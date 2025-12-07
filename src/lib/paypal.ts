const PAYPAL_API_URL =
  process.env.PAYPAL_MODE === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function createOrder({
  bookId,
  bookTitle,
  price,
  userId,
}: {
  bookId: string;
  bookTitle: string;
  price: number;
  userId: string;
}): Promise<{ orderId: string }> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: price.toFixed(2),
          },
          description: bookTitle,
          custom_id: JSON.stringify({ bookId, userId }),
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create PayPal order");
  }

  return { orderId: data.id };
}

export async function captureOrder(orderId: string): Promise<{
  status: string;
  bookId: string;
  userId: string;
  paymentId: string;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to capture PayPal order");
  }

  const customId = data.purchase_units[0].payments.captures[0].custom_id;
  const { bookId, userId } = JSON.parse(customId || "{}");

  return {
    status: data.status,
    bookId,
    userId,
    paymentId: data.id,
  };
}

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers["paypal-auth-algo"],
        cert_url: headers["paypal-cert-url"],
        transmission_id: headers["paypal-transmission-id"],
        transmission_sig: headers["paypal-transmission-sig"],
        transmission_time: headers["paypal-transmission-time"],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  const data = await response.json();
  return data.verification_status === "SUCCESS";
}
