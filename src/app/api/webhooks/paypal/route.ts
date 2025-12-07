import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyWebhookSignature } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();

    const webhookHeaders: Record<string, string> = {};
    ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"].forEach((key) => {
      const value = headersList.get(key);
      if (value) webhookHeaders[key] = value;
    });

    const isValid = await verifyWebhookSignature(webhookHeaders, body);

    if (!isValid) {
      console.error("PayPal webhook signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // PayPal webhooks are handled synchronously via capture endpoint
    // This webhook is mainly for logging/backup verification
    console.log("PayPal webhook received:", event.event_type);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
