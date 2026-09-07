# Distributed Checkout Demo

Five tiny Node.js services demonstrate a distributed checkout saga. Each
service only needs Node 20+ and can run on a different machine.

```mermaid
flowchart LR
  C[Client] --> G[Gateway]
  G --> O[Order Orchestrator]
  O --> I[Inventory]
  O --> P[Payment]
  O -. async .-> N[Notifier]
```

```mermaid
sequenceDiagram
  Client->>Gateway: POST /checkout
  Gateway->>Orchestrator: POST /orders
  par Prepare inventory
    Orchestrator->>Inventory: /reserve
  and Authorize payment
    Orchestrator->>Payment: /authorize
  end
  alt both prepared
    par Finalize
      Orchestrator->>Inventory: /commit
    and
      Orchestrator->>Payment: /capture
    end
    Orchestrator-->>Notifier: /notify (async)
  else either failed
    Orchestrator->>Inventory: /release
    Orchestrator->>Payment: /void
  end
```

Run everything locally:

```bash
npm start
curl -s localhost:8080/checkout \
  -H 'content-type: application/json' \
  -d '{"sku":"book","quantity":1,"amount":42}'
```

Run on separate machines by starting one file per host and configuring URLs:

```bash
PORT=8081 INVENTORY_URL=http://inventory:8082 \
PAYMENT_URL=http://payment:8083 NOTIFIER_URL=http://notifier:8084 \
node src/orchestrator.js
```

`amount > 1000` deliberately fails authorization and exercises compensation.

