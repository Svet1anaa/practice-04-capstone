/**
 * Order Service
 *
 * YOU MUST IMPLEMENT the TODO sections below.
 *
 * This service is the business-domain record keeper for orders.
 * Its exact role in the overall flow depends on your architecture decision:
 *
 * OPTION A — Node-RED is the entry point:
 *   Client → POST /order (Node-RED) → Node-RED calls this service to create the order record
 *   Node-RED then orchestrates Payment → Inventory → Notification
 *
 * OPTION B — Order Service is the entry point:
 *   Client → POST /orders (this service) → this service triggers Node-RED
 *   This service stores the order, then calls Node-RED or publishes an event
 *
 * EITHER approach is acceptable. Document your choice in your architecture diagram
 * and justify it in your README.
 *
 * Regardless of which option you choose, this service must:
 *   - Store orders (in memory is fine)
 *   - Generate a correlationId for each order
 *   - Expose GET /orders/:id for status lookup
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const NODERED_URL = process.env.NODERED_URL;
const PAYMENT_URL = process.env.PAYMENT_URL;
const INVENTORY_URL = process.env.INVENTORY_URL;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL;

const orders = new Map();

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

app.post("/orders", (req, res) => {
  try {
    const orderId = `ord-${uuidv4().slice(0, 8)}`;
    const correlationId = uuidv4();

    const order = {
      orderId,
      correlationId,
      ...req.body,
      receivedAt: new Date().toISOString(),
      status: "received",
    };

    orders.set(orderId, order);

    res.status(201).json({
      orderId,
      correlationId,
      status: "received",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
});

app.get("/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order);
});

app.listen(PORT, () => {
  console.log(`[order-service] Running on port ${PORT}`);
});
