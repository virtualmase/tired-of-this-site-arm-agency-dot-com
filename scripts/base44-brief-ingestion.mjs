import { createHmac, timingSafeEqual } from 'node:crypto';
import { loadContract } from './case-ledger.mjs';
import { buildBriefEventCandidate } from './brief-event-candidate.mjs';

const hexDigestPattern = /^[a-f0-9]{64}$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const externalIdPattern = /^[A-Za-z0-9_-]{3,160}$/;

export class BriefIngestionError extends Error {
  constructor(code, message, { retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = 'BriefIngestionError';
    this.code = code;
    this.retryable = retryable;
  }
}

function isIsoDate(value) {
  return typeof value === 'string' && isoDatePattern.test(value) && !Number.isNaN(Date.parse(value));
}

function requireSecret(secret, label) {
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new BriefIngestionError('CONFIGURATION_ERROR', `${label} must contain at least 32 bytes`);
  }
}

function hmac(secret, namespace, value) {
  return createHmac('sha256', secret).update(namespace).update('\0').update(value).digest('hex');
}

function safeEqualHex(left, right) {
  if (!hexDigestPattern.test(left) || !hexDigestPattern.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export function signBase44Notification(rawBody, notificationSecret) {
  requireSecret(notificationSecret, 'notificationSecret');
  if (typeof rawBody !== 'string') throw new BriefIngestionError('INVALID_BODY', 'rawBody must be a string');
  return `sha256=${createHmac('sha256', notificationSecret).update(rawBody).digest('hex')}`;
}

export function verifyBase44Notification(rawBody, signature, notificationSecret) {
  requireSecret(notificationSecret, 'notificationSecret');
  if (typeof rawBody !== 'string') return false;
  const supplied = typeof signature === 'string' && signature.startsWith('sha256=') ? signature.slice(7) : '';
  const expected = createHmac('sha256', notificationSecret).update(rawBody).digest('hex');
  return safeEqualHex(supplied, expected);
}

function parseNotification(rawBody) {
  let notification;
  try {
    notification = JSON.parse(rawBody);
  } catch (cause) {
    throw new BriefIngestionError('INVALID_NOTIFICATION', 'notification body must be valid JSON', { cause });
  }
  if (!notification || typeof notification !== 'object' || Array.isArray(notification)) {
    throw new BriefIngestionError('INVALID_NOTIFICATION', 'notification must be an object');
  }
  for (const field of ['delivery_id', 'source_record_id']) {
    if (!externalIdPattern.test(notification[field] || '')) {
      throw new BriefIngestionError('INVALID_NOTIFICATION', `${field} is invalid`);
    }
  }
  if (!isIsoDate(notification.notified_at)) {
    throw new BriefIngestionError('INVALID_NOTIFICATION', 'notified_at must be an ISO UTC timestamp');
  }
  return notification;
}

function opaqueIdentifiers(sourceRecordId, idSecret) {
  requireSecret(idSecret, 'idSecret');
  const sourceRecordDigest = hmac(idSecret, 'base44-lead-source-v1', sourceRecordId);
  return {
    caseId: `arm_${hmac(idSecret, 'arm-case-id-v1', sourceRecordId).slice(0, 40)}`,
    eventId: `evt_${hmac(idSecret, 'arm-brief-event-id-v1', sourceRecordId).slice(0, 40)}`,
    sourceRecordDigest
  };
}

function normalizeError(error) {
  if (error instanceof BriefIngestionError) return error;
  return new BriefIngestionError('ADAPTER_FAILURE', 'Base44 Brief ingestion failed', {
    retryable: true,
    cause: error
  });
}

async function recordDeadLetter(store, notification, error, idSecret, recordedAt) {
  if (!store || typeof store.putDeadLetter !== 'function') return;
  const stableInput = notification.source_record_id || notification.delivery_id;
  if (!externalIdPattern.test(stableInput || '')) return;
  const deadLetter = {
    dead_letter_id: `dead_${hmac(idSecret, 'arm-brief-dead-letter-v1', notification.delivery_id || stableInput).slice(0, 40)}`,
    source_record_digest: hmac(idSecret, 'base44-lead-source-v1', stableInput),
    failure_code: error.code,
    retryable: error.retryable,
    recorded_at: recordedAt
  };
  await store.putDeadLetter(deadLetter);
}

function requireStore(store) {
  if (!store || typeof store.appendBriefIfAbsent !== 'function') {
    throw new BriefIngestionError('CONFIGURATION_ERROR', 'store.appendBriefIfAbsent is required');
  }
}

export async function ingestSignedBase44Brief({
  rawBody,
  signature,
  notificationSecret,
  idSecret,
  fetchLead,
  store,
  recordedAt = new Date().toISOString(),
  contract = loadContract()
}) {
  requireSecret(notificationSecret, 'notificationSecret');
  requireSecret(idSecret, 'idSecret');
  requireStore(store);
  if (typeof fetchLead !== 'function') {
    throw new BriefIngestionError('CONFIGURATION_ERROR', 'fetchLead is required');
  }
  if (!isIsoDate(recordedAt)) {
    throw new BriefIngestionError('CONFIGURATION_ERROR', 'recordedAt must be an ISO UTC timestamp');
  }
  if (!verifyBase44Notification(rawBody, signature, notificationSecret)) {
    throw new BriefIngestionError('UNAUTHENTICATED', 'notification signature is invalid');
  }

  let notification;
  try {
    notification = parseNotification(rawBody);
    const ids = opaqueIdentifiers(notification.source_record_id, idSecret);
    let lead;
    try {
      lead = await fetchLead(notification.source_record_id);
    } catch (cause) {
      throw new BriefIngestionError('SOURCE_UNAVAILABLE', 'canonical Base44 Lead could not be read', {
        retryable: true,
        cause
      });
    }
    if (!lead || typeof lead !== 'object' || Array.isArray(lead)) {
      throw new BriefIngestionError('SOURCE_NOT_FOUND', 'canonical Base44 Lead was not found');
    }
    if (!isIsoDate(lead.created_date)) {
      throw new BriefIngestionError('SOURCE_DRIFT', 'canonical Base44 Lead created_date is invalid');
    }
    if (Date.parse(recordedAt) < Date.parse(lead.created_date)) {
      throw new BriefIngestionError('CLOCK_CONFLICT', 'recordedAt precedes the Base44 Lead timestamp');
    }

    let event;
    try {
      event = buildBriefEventCandidate({
        case_id: ids.caseId,
        event_id: ids.eventId,
        source_record_digest: ids.sourceRecordDigest,
        occurred_at: lead.created_date,
        recorded_at: recordedAt,
        lead
      }, contract);
    } catch (cause) {
      throw new BriefIngestionError('SOURCE_DRIFT', 'canonical Base44 Lead does not match the approved Brief contract', { cause });
    }

    let result;
    try {
      result = await store.appendBriefIfAbsent({
        idempotency_key: ids.sourceRecordDigest,
        event
      });
    } catch (cause) {
      throw new BriefIngestionError('STORE_UNAVAILABLE', 'private ledger append failed', {
        retryable: true,
        cause
      });
    }
    if (!result || !['appended', 'duplicate'].includes(result.status)) {
      throw new BriefIngestionError('STORE_PROTOCOL_ERROR', 'private ledger returned an invalid append result');
    }
    return {
      status: result.status,
      case_id: ids.caseId,
      event_id: ids.eventId,
      source_record_digest: ids.sourceRecordDigest
    };
  } catch (caught) {
    const error = normalizeError(caught);
    if (notification) await recordDeadLetter(store, notification, error, idSecret, recordedAt);
    throw error;
  }
}

export class InMemoryBriefLedgerStore {
  constructor() {
    this.eventsByIdempotencyKey = new Map();
    this.deadLettersById = new Map();
  }

  async appendBriefIfAbsent({ idempotency_key: idempotencyKey, event }) {
    if (!hexDigestPattern.test(idempotencyKey || '')) throw new Error('idempotency key is invalid');
    const existing = this.eventsByIdempotencyKey.get(idempotencyKey);
    if (existing) return { status: 'duplicate', event: structuredClone(existing) };
    this.eventsByIdempotencyKey.set(idempotencyKey, structuredClone(event));
    return { status: 'appended', event: structuredClone(event) };
  }

  async putDeadLetter(deadLetter) {
    if (!this.deadLettersById.has(deadLetter.dead_letter_id)) {
      this.deadLettersById.set(deadLetter.dead_letter_id, structuredClone(deadLetter));
    }
    return { status: 'recorded' };
  }

  events() {
    return [...this.eventsByIdempotencyKey.values()].map((event) => structuredClone(event));
  }

  deadLetters() {
    return [...this.deadLettersById.values()].map((item) => structuredClone(item));
  }
}
