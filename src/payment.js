import { serve } from "./http.js";

const authorized = new Set();

serve("payment", process.env.PORT || 8083, (path, body) => {
  if (path === "/authorize") {
    if (body.amount > 1000) throw new Error("payment declined");
    authorized.add(body.orderId);
  } else if (path === "/capture" || path === "/void") {
    if (path === "/capture" && !authorized.has(body.orderId)) {
      throw new Error("payment was not authorized");
    }
    authorized.delete(body.orderId);
  } else throw new Error("route not found");
  return { ok: true };
});

