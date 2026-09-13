import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const app = spawn(process.execPath, ["src/local.js"], { stdio: "ignore" });
const checkout = async (order) => {
  const response = await fetch("http://127.0.0.1:8080/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sku: "book", quantity: 1, ...order })
  });
  return { status: response.status, body: await response.json() };
};

try {
  await new Promise((resolve) => setTimeout(resolve, 700));
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
