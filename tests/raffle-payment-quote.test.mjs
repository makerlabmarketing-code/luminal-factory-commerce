import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
function loadSource(file, dependencies = {}) {
  const emitted = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", emitted)(
    name => dependencies[name] ?? nodeRequire(name), compiledModule, compiledModule.exports,
  );
  return compiledModule.exports;
}

const shipping = loadSource("src/features/raffle/raffle-shipping.ts");
const { buildRafflePaymentQuote, paymentQuoteOrderSchema } = loadSource(
  "src/features/raffle/raffle-payment-quote.ts", { "./raffle-shipping": shipping },
);

test("customer mail contains the saved net shipping and reconciles with the order total", () => {
  const order = paymentQuoteOrderSchema.parse({
    customer_email_snapshot: "winner@example.com", order_number: "LF-RF-ABCDEF123456",
    currency: "USD", subtotal_minor: 8000, shipping_minor: 800, grand_total_minor: 8800,
  });
  const quote = buildRafflePaymentQuote(order, "2026-12-20T05:00:00Z");
  assert.equal(quote.to, "winner@example.com");
  assert.match(quote.text, /Item · \$80\.00 USD/);
  assert.match(quote.text, /Shipping · \$8\.00 USD/);
  assert.match(quote.text, /Total due · \$88\.00 USD/);
  assert.match(quote.text, /12:00 PM \(Vietnam time, UTC\+7\)/);
  assert.doesNotMatch(quote.text, /carrier|subsidy|Luminal covers/i);
  assert.equal(paymentQuoteOrderSchema.safeParse({ ...order, grand_total_minor: 9600 }).success, false);
});

test("shipping estimate keeps unconfigured destinations distinct from free delivery", () => {
  assert.equal(shipping.getShippingEstimate(" us ", { US: 800 }), 800);
  assert.equal(shipping.getShippingEstimate("VN", {}), 0);
  assert.equal(shipping.getShippingEstimate("DE", {}), null);
});
