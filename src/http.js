import { createServer } from "node:http";

export function serve(name, port, handler) {
  return createServer(async (req, res) => {
    const trace = req.headers["x-trace-id"] || crypto.randomUUID();
    try {
      const body = await readJson(req);
      console.log(`${trace} ${name} ${req.method} ${req.url}`);
      send(res, 200, await handler(req.url, body, trace));
    } catch (error) {
      send(res, 409, { error: error.message, trace });
    }
  }).listen(port, () => console.log(`${name} listening on :${port}`));
}

export async function call(base, path, body, trace) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-trace-id": trace },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

