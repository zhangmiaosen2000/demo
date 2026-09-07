import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const app = spawn(process.execPath, ["src/local.js"], { stdio: "ignore" });
const checkout = async (amount) => {
  const response = await fetch("http://127.0.0.1:8080/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sku: "book", quantity: 1, amount })
  });
  return { status: response.status, body: await response.json() };
};

try {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const success = await checkout(42);
  assert.equal(success.status, 200);
  assert.equal(success.body.status, "confirmed");
  const declined = await checkout(1200);
  assert.equal(declined.status, 409);
  assert.match(declined.body.error, /declined/);
} finally {
  app.kill("SIGTERM");
}

