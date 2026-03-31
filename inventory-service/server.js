/**
 * Inventory Service
 *
 * YOU MUST IMPLEMENT the TODO sections below.
 *
 * This service handles stock reservation and release.
 * It is called by your Node-RED orchestration flow after payment succeeds.
 *
 * Behaviour is controlled by INVENTORY_FAIL_MODE environment variable:
 *   never  — always reserve successfully
 *   always — always report unavailable (useful for testing compensation logic)
 *   random — 10% unavailability rate
 *
 * The /admin endpoints are used by the instructor's grading session.
 * Do not remove them, but you do not need to document them in your README.
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;
const INVENTORY_FAIL_MODE = process.env.INVENTORY_FAIL_MODE || "never";

const callLog = [];

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "inventory-service" });
});

app.post("/inventory/reserve", (req, res) => {
  const correlationId =
    req.body.correlationId || req.headers["x-correlation-id"] || uuidv4();
  const orderId = req.body.orderId;

  callLog.push({
    endpoint: "/inventory/reserve",
    correlationId,
    orderId,
    timestamp: new Date().toISOString(),
  });

  let shouldFail = false;
  if (INVENTORY_FAIL_MODE === "always") {
    shouldFail = true;
  } else if (INVENTORY_FAIL_MODE === "random") {
    shouldFail = Math.random() < 0.1;
  }

  if (shouldFail) {
    return res.status(422).json({
      status: "unavailable",
      reason: "Insufficient stock",
      correlationId,
    });
  }

  return res.status(200).json({
    status: "reserved",
    reservationId: uuidv4(),
    correlationId,
  });
});

app.post("/inventory/release", (req, res) => {
  const correlationId =
    req.body.correlationId || req.headers["x-correlation-id"] || uuidv4();
  const orderId = req.body.orderId;

  callLog.push({
    endpoint: "/inventory/release",
    correlationId,
    orderId,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    status: "released",
    correlationId,
  });
});

app.get("/admin/logs", (req, res) => {
  res.json(callLog);
});

app.post("/admin/reset", (req, res) => {
  callLog.length = 0;
  console.log("[inventory-service] Call log cleared");
  res.json({ status: "ok", message: "Call log cleared" });
});

app.listen(PORT, () => {
  console.log(
    `[inventory-service] Running on port ${PORT} | INVENTORY_FAIL_MODE=${INVENTORY_FAIL_MODE}`,
  );
});
