import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const app = spawn(process.execPath, ["src/local.js"], { stdio: "ignore" });
const post = async (port, path, body) => {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
};
const checkout = (order) =>
  post(8080, "/checkout", { sku: "book", quantity: 1, ...order });

try {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const unsupportedMethod = await fetch("http://127.0.0.1:8080/checkout");
  assert.equal(unsupportedMethod.status, 405);
  assert.equal(unsupportedMethod.headers.get("allow"), "POST");
  assert.match((await unsupportedMethod.json()).error, /method GET not allowed/);

  const reservation = { orderId: "retry-test", quantity: 2 };
  const firstReserve = await post(8082, "/reserve", reservation);
  assert.equal(firstReserve.body.stock, 3);
  const retriedReserve = await post(8082, "/reserve", reservation);
  assert.equal(retriedReserve.body.stock, 3);
  const conflictingReserve = await post(
    8082, "/reserve", { ...reservation, quantity: 3 });
  assert.equal(conflictingReserve.status, 409);
  assert.match(conflictingReserve.body.error, /different reservation/);
  const release = await post(8082, "/release", reservation);
  assert.equal(release.body.stock, 5);

  const success = await checkout({ amount: 42 });
  assert.equal(success.status, 200);
  assert.equal(success.body.status, "confirmed");
  const declined = await checkout({ amount: 1200 });
  assert.equal(declined.status, 409);
  assert.match(declined.body.error, /declined/);

  const invalidQuantity = await checkout({ amount: 42, quantity: -1 });
  assert.equal(invalidQuantity.status, 409);
  assert.match(invalidQuantity.body.error, /positive integer/);

  const remainingStock = await checkout({ amount: 42, quantity: 4 });
  assert.equal(remainingStock.status, 200);
  const exhausted = await checkout({ amount: 42 });
  assert.equal(exhausted.status, 409);
  assert.match(exhausted.body.error, /out of stock/);
} finally {
  app.kill("SIGTERM");
}
