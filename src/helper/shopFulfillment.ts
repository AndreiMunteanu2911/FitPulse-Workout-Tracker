import type { Stripe } from "stripe";
import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdminClient>;

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

  const quantity = Math.max(1, Number(session.metadata?.quantity || 1));
  const { data: productRow, error: productError } = await supabaseAdmin
    .from("products")
    .select("price_usd")
    .eq("id", existingOrder.product_id)
    .maybeSingle();

  if (productError) throw productError;

  const shippingAddress =
    session.shipping_details?.address ??
    session.customer_details?.address ??
    null;

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
