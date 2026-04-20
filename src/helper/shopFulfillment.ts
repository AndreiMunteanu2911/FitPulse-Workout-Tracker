import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdminClient>;

type ShippingAddressLike = {
  city?: string | null;
  country?: string | null;
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  state?: string | null;
};

type ShippingDetailsLike = {
  name?: string | null;
  address?: ShippingAddressLike | null;
};

type PaymentIntentLike = {
  id?: string;
  shipping?: ShippingDetailsLike | null;
  latest_charge?: {
    shipping?: ShippingDetailsLike | null;
  } | null;
} | null;

type CheckoutSessionLike = {
  id?: string;
  metadata?: Record<string, string> | null;
  collected_information?: {
    shipping_details?: ShippingDetailsLike | null;
  } | null;
  shipping_details?: ShippingDetailsLike | null;
  customer_details?: {
    name?: string | null;
    address?: ShippingAddressLike | null;
  } | null;
};

function isShippingAddressLike(value: unknown): value is ShippingAddressLike {
  return !!value && typeof value === "object";
}

function extractShippingDetails(session: CheckoutSessionLike, paymentIntent: PaymentIntentLike): ShippingDetailsLike | null {
  const collectedShipping = session.collected_information?.shipping_details;
  if (collectedShipping?.address && isShippingAddressLike(collectedShipping.address)) return collectedShipping;

  const sessionShipping = session.shipping_details;
  if (sessionShipping?.address && isShippingAddressLike(sessionShipping.address)) return sessionShipping;

  const customerAddress = session.customer_details?.address;
  if (customerAddress && isShippingAddressLike(customerAddress)) {
    return {
      name: session.customer_details?.name,
      address: customerAddress,
    };
  }

  const paymentShipping = paymentIntent?.shipping;
  if (paymentShipping?.address && isShippingAddressLike(paymentShipping.address)) return paymentShipping;

  const chargeShipping = paymentIntent?.latest_charge?.shipping;
  if (chargeShipping?.address && isShippingAddressLike(chargeShipping.address)) return chargeShipping;

  return null;
}

export async function fulfillStripeProductOrder(
  supabaseAdmin: SupabaseAdmin,
  session: CheckoutSessionLike,
  paymentIntent: PaymentIntentLike = null,
) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    return { status: "ignored", reason: "missing_order_id" as const };
  }

  const { data: existingOrder, error: existingError } = await supabaseAdmin
    .from("orders")
    .select("id, product_id, stripe_session_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existingOrder) return { status: "ignored", reason: "order_not_found" as const };
  if (existingOrder.stripe_session_id === session.id && existingOrder.status === "completed") {
    return { status: "already_processed" as const };
  }

  const quantity = Math.max(1, Number(session.metadata?.quantity || 1));
  const { data: productRow, error: productError } = await supabaseAdmin
    .from("products")
    .select("price_usd")
    .eq("id", existingOrder.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const shippingDetails = extractShippingDetails(session, paymentIntent);
  const shippingAddress = shippingDetails?.address ?? null;

  if (!shippingAddress) {
    console.warn("[shop-fulfillment] shipping address missing", {
      orderId,
      sessionId: session.id,
      hasCollectedShipping: Boolean(session.collected_information?.shipping_details),
      hasSessionShipping: Boolean(session.shipping_details),
      hasCustomerAddress: Boolean(session.customer_details?.address),
      hasPaymentIntentShipping: Boolean(paymentIntent?.shipping?.address),
      hasLatestCharge: Boolean(paymentIntent?.latest_charge?.shipping?.address),
    });
  }

  const amountUsd = productRow?.price_usd == null ? null : Number(productRow.price_usd) * quantity;

  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "completed",
      amount_usd: amountUsd,
      shipping_address: shippingAddress,
      payment_method: "stripe",
      stripe_session_id: session.id,
    })
    .eq("id", orderId)
    .select("id, product_id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updatedOrder?.product_id) return { status: "ignored", reason: "missing_product_id" as const };

  const { data: stockProduct, error: stockProductError } = await supabaseAdmin
    .from("products")
    .select("stock_quantity")
    .eq("id", updatedOrder.product_id)
    .maybeSingle();

  if (stockProductError) throw stockProductError;

  if (stockProduct) {
    const { error: stockError } = await supabaseAdmin
      .from("products")
      .update({ stock_quantity: Math.max(0, Number(stockProduct.stock_quantity || 0) - quantity) })
      .eq("id", updatedOrder.product_id);

    if (stockError) throw stockError;
  }

  return {
    status: "processed" as const,
    paymentMethod: "stripe" as const,
    orderId,
    productId: updatedOrder.product_id as string,
    shippingAddress,
    stripeSessionId: session.id,
  };
}
