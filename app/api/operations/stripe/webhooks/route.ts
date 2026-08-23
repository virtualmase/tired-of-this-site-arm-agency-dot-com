import { stripeClient } from '@/lib/stripe-private-invoice';
import {
  constructStripeWebhookEvent,
  normalizeStripeWebhookError,
  reconcileStripeInvoiceEvent
} from '@/lib/stripe-invoice-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const stripe = stripeClient(process.env.STRIPE_SECRET_KEY);
    const event = constructStripeWebhookEvent(
      stripe,
      await request.text(),
      request.headers.get('stripe-signature'),
      process.env.STRIPE_WEBHOOK_SECRET
    );
    const result = await reconcileStripeInvoiceEvent(stripe, event);
    return Response.json(result, {
      status: result.processed ? 200 : 202,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (caught) {
    const error = normalizeStripeWebhookError(caught);
    if (error.status >= 500) {
      console.error('Stripe webhook reconciliation failed', { error_code: error.code });
    }
    return Response.json({ error: error.code, message: error.message }, {
      status: error.status,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
