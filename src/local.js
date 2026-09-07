import { spawn } from "node:child_process";

const services = ["inventory", "payment", "notifier", "orchestrator", "gateway"];
const children = services.map((name) =>
  spawn(process.execPath, [`src/${name}.js`], { stdio: "inherit" })
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => children.forEach((child) => child.kill(signal)));
}

