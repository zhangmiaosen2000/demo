import { call, serve } from "./http.js";

const orders = process.env.ORDERS_URL || "http://127.0.0.1:8081";

serve("gateway", process.env.PORT || 8080, (path, body, trace) => {
  if (path !== "/checkout") throw new Error("route not found");
  return call(orders, "/orders", body, trace);
});

