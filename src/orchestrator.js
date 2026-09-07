import { call, serve } from "./http.js";

const inventory = process.env.INVENTORY_URL || "http://127.0.0.1:8082";
const payment = process.env.PAYMENT_URL || "http://127.0.0.1:8083";
const notifier = process.env.NOTIFIER_URL || "http://127.0.0.1:8084";

serve("orchestrator", process.env.PORT || 8081, async (path, order, trace) => {
  if (path !== "/orders") throw new Error("route not found");
  order.orderId = crypto.randomUUID();
  const [stock, money] = await Promise.allSettled([
    call(inventory, "/reserve", order, trace),
    call(payment, "/authorize", order, trace)
  ]);
  if (stock.status === "rejected" || money.status === "rejected") {
    await Promise.allSettled([
      stock.status === "fulfilled" && call(inventory, "/release", order, trace),
      money.status === "fulfilled" && call(payment, "/void", order, trace)
    ]);
    throw new Error(stock.reason?.message || money.reason?.message);
  }
  await Promise.all([
    call(inventory, "/commit", order, trace),
    call(payment, "/capture", order, trace)
  ]);
  void call(notifier, "/notify", { ...order, status: "confirmed" }, trace)
    .catch((error) => console.error(`notification failed: ${error.message}`));
  return { orderId: order.orderId, status: "confirmed", trace };
});

