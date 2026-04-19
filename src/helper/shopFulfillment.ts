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
      amount_cores: null,
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

export async function fulfillCoresProductOrder(
  supabaseAdmin: SupabaseAdmin,
  input: {
    userId: string;
    productId: string;
    shippingAddress: unknown;
  },
) {
  const { userId, productId, shippingAddress } = input;

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, price_cores, stock_quantity, is_physical")
    .eq("id", productId)
    .maybeSingle();

  if (productError) throw productError;
  if (!product) return { status: "ignored" as const, reason: "product_not_found" as const };

  const totalCores = Number(product.price_cores || 0);
  if (totalCores <= 0) return { status: "ignored" as const, reason: "product_has_no_cores_price" as const };

  const { data: statsRow, error: statsError } = await supabaseAdmin
    .from("user_stats")
    .select("cores_balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (statsError) throw statsError;

  const currentBalance = Number(statsRow?.cores_balance || 0);
  if (currentBalance < totalCores) {
    return { status: "ignored" as const, reason: "insufficient_cores" as const };
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      product_id: productId,
      status: "completed",
      shipping_address: product.is_physical ? shippingAddress ?? null : null,
      payment_method: "cores",
      amount_cores: totalCores,
      stripe_session_id: null,
    })
    .select("id")
    .single();

  if (orderError) throw orderError;

  const { error: balanceError } = await supabaseAdmin
    .from("user_stats")
    .update({ cores_balance: currentBalance - totalCores })
    .eq("user_id", userId);

  if (balanceError) throw balanceError;

  if (product.is_physical) {
    const { error: stockError } = await supabaseAdmin
      .from("products")
      .update({ stock_quantity: Math.max(0, Number(product.stock_quantity || 0) - 1) })
      .eq("id", productId);

    if (stockError) throw stockError;
  }

  return {
    status: "processed" as const,
    paymentMethod: "cores" as const,
    orderId: order.id as string,
    productId,
    amountCores: totalCores,
    shippingAddress: product.is_physical ? shippingAddress ?? null : null,
  };
}
