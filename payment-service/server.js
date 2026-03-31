/**
 * Payment Service
 *
 * YOU MUST IMPLEMENT the TODO sections below.
 *
 * This service handles payment authorization and refunds.
 * It is called by your Node-RED orchestration flow (or Order Service).
 *
 * Behaviour is controlled by PAYMENT_FAIL_MODE environment variable:
 *   never  — always authorize successfully
 *   always — always reject (useful for testing compensation logic)
 *   random — 20% rejection rate (useful for stress testing)
 *
 * The /admin endpoints are used by the instructor's grading session.
 * Do not remove them, but you do not need to document them in your README.
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const PAYMENT_FAIL_MODE = process.env.PAYMENT_FAIL_MODE || "never";

const callLog = [];

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

app.post("/payment/authorize", (req, res) => {
  const correlationId =
    req.body.correlationId || req.headers["x-correlation-id"] || uuidv4();
  const orderId = req.body.orderId;

  callLog.push({
    endpoint: "/payment/authorize",
    correlationId,
    orderId,
    timestamp: new Date().toISOString(),
  });

  let shouldFail = false;

  if (PAYMENT_FAIL_MODE === "always") {
    shouldFail = true;
  } else if (PAYMENT_FAIL_MODE === "random") {
    shouldFail = Math.random() < 0.2;
  }

  if (shouldFail) {
    return res.status(422).json({
      status: "rejected",
      reason: "Payment declined",
      correlationId,
    });
  }

  return res.status(200).json({
    status: "authorized",
    transactionId: uuidv4(),
    correlationId,
  });
});

app.post("/payment/refund", (req, res) => {
  const correlationId =
    req.body.correlationId || req.headers["x-correlation-id"] || uuidv4();
  const orderId = req.body.orderId;

  callLog.push({
    endpoint: "/payment/refund",
    correlationId,
    orderId,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    status: "refunded",
    correlationId,
  });
});

app.get("/admin/logs", (req, res) => {
  res.json(callLog);
});

app.post("/admin/reset", (req, res) => {
  callLog.length = 0;
  console.log("[payment-service] Call log cleared");
  res.json({ status: "ok", message: "Call log cleared" });
});

app.listen(PORT, () => {
  console.log(
    `[payment-service] Running on port ${PORT} | PAYMENT_FAIL_MODE=${PAYMENT_FAIL_MODE}`,
  );
});
