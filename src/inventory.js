import { serve } from "./http.js";

let stock = 5;
const held = new Map();

serve("inventory", process.env.PORT || 8082, (path, body) => {
  if (path === "/reserve") {
    if (!Number.isSafeInteger(body.quantity) || body.quantity <= 0) {
      throw new Error("quantity must be a positive integer");
    }
    if (held.has(body.orderId)) {
      if (held.get(body.orderId) !== body.quantity) {
        throw new Error("order already has a different reservation");
      }
      return { ok: true, stock };
    }
    if (body.quantity > stock) throw new Error("out of stock");
    stock -= body.quantity;
    held.set(body.orderId, body.quantity);
  } else if (path === "/release") {
    stock += held.get(body.orderId) || 0;
    held.delete(body.orderId);
  } else if (path === "/commit") {
    held.delete(body.orderId);
  } else throw new Error("route not found");
  return { ok: true, stock };
});
