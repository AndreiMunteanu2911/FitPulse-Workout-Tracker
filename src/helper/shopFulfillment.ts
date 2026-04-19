import type { Stripe } from "stripe";

type SupabaseAdmin = any;

type StripeCheckoutSession = Pick<
  Stripe.Checkout.Session,
  "id" | "payment_status" | "metadata" | "shipping_details" | "customer_details"
>;

export async function fulfillStripeProductOrder(
  supabaseAdmin: SupabaseAdmin,
  session: StripeCheckoutSession,
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

  const shippingAddress = session.shipping_details ?? session.customer_details?.address ?? null;

  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "completed",
      shipping_address: shippingAddress,
      payment_method: "stripe",
      stripe_session_id: session.id,

    })
    .eq("id", orderId)
    .select("id, product_id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updatedOrder?.product_id) return { status: "ignored", reason: "missing_product_id" as const };

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("stock_quantity")
    .eq("id", updatedOrder.product_id)
    .maybeSingle();

  if (productError) throw productError;

  if (product) {
    const { error: stockError } = await supabaseAdmin
      .from("products")
      .update({ stock_quantity: Math.max(0, Number(product.stock_quantity || 0) - 1) })
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


