import { call, serve } from "./http.js";

const inventory = process.env.INVENTORY_URL || "http://127.0.0.1:8082";
const payment = process.env.PAYMENT_URL || "http://127.0.0.1:8083";
const notifier = process.env.NOTIFIER_URL || "http://127.0.0.1:8084";

serve("checkout-coordinator", process.env.PORT || 8081, async (path, order, trace) => {
  if (path !== "/coordinate") throw new Error("route not found");
  order.orderId = crypto.randomUUID();
  await call(payment, "/authorize", order, trace);
  try {
    await call(inventory, "/reserve", order, trace);
  } catch (error) {
    await call(payment, "/void", order, trace);
    throw error;
  }
  const status = "confirmed";
  await Promise.all([
    call(inventory, "/commit", order, trace),
    call(payment, "/capture", order, trace)
  ]);
  void call(notifier, "/notify", { ...order, status }, trace)
    .catch((error) => console.error(`notification failed: ${error.message}`));
  return { orderId: order.orderId, status, component: "checkout-coordinator", trace };
});
