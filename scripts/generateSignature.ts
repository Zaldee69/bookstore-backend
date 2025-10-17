import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/**
 * Helper script untuk generate payment signature
 * Usage: tsx scripts/generateSignature.ts <orderId> <status>
 * Example: tsx scripts/generateSignature.ts abc-123 SUCCESS
 */

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: tsx scripts/generateSignature.ts <orderId> <status>");
  console.log("Example: tsx scripts/generateSignature.ts abc-123 SUCCESS");
  process.exit(1);
}

const [orderId, status] = args;
const secret =
  process.env.PAYMENT_CALLBACK_SECRET || "your-payment-callback-secret";

const signature = crypto
  .createHmac("sha256", secret)
  .update(`${orderId}:${status}`)
  .digest("hex");

console.log("\nPayment Signature Generator");
console.log("================================");
console.log("Order ID:", orderId);
console.log("Status:", status);
console.log("Secret:", secret);
console.log("\nGenerated Signature:");
console.log(signature);
console.log("\nUse this in payment callback request:");
console.log(
  JSON.stringify(
    {
      orderId,
      status,
      providerRef: "PAY" + Date.now(),
      signature,
    },
    null,
    2
  )
);
