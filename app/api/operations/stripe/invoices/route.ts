import {
  InvoiceRequestError,
  authorizeInvoiceRequest,
  createAndSendPrivateInvoice,
  parseInvoiceRequest,
  stripeClient
} from '@/lib/stripe-private-invoice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    authorizeInvoiceRequest(request.headers.get('authorization'), process.env.ARM_OPERATIONS_TOKEN);
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
      throw new InvoiceRequestError('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json', 415);
    }
    const input = parseInvoiceRequest(await request.json());
    const result = await createAndSendPrivateInvoice(stripeClient(process.env.STRIPE_SECRET_KEY), input);
    return Response.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (caught) {
    if (caught instanceof InvoiceRequestError) {
      return Response.json({ error: caught.code, message: caught.message }, {
        status: caught.status,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
    console.error('private invoice request failed', {
      error_type: caught instanceof Error ? caught.name : 'UnknownError'
    });
    return Response.json({ error: 'INVOICE_REQUEST_FAILED', message: 'Private invoice request failed' }, {
      status: 502,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
