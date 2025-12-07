import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
  }
  return new Stripe(key, { typescript: true });
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  : (null as unknown as Stripe);

export async function createCheckoutSession({
  bookId,
  bookTitle,
  price,
  userId,
  successUrl,
  cancelUrl,
}: {
  bookId: string;
  bookTitle: string;
  price: number;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: bookTitle,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      bookId,
      userId,
    },
  });

  return session;
}

export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function retrieveSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId);
}
