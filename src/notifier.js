import { serve } from "./http.js";

serve("notifier", process.env.PORT || 8084, (path, body) => {
  if (path !== "/notify") throw new Error("route not found");
  console.log(`notification: order ${body.orderId} is ${body.status}`);
  return { delivered: true };
});

