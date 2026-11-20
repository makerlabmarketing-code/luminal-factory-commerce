import { z } from "zod";
import { formatShippingUsd } from "./raffle-shipping";

export const paymentQuoteOrderSchema = z.object({
  customer_email_snapshot: z.email(),
  order_number: z.string().regex(/^LF-RF-[A-F0-9]{12}$/),
  currency: z.literal("USD"),
  subtotal_minor: z.number().int().nonnegative(),
  shipping_minor: z.number().int().nonnegative(),
  grand_total_minor: z.number().int().nonnegative(),
}).refine(order => order.subtotal_minor + order.shipping_minor === order.grand_total_minor);

export function buildRafflePaymentQuote(
  order: z.infer<typeof paymentQuoteOrderSchema>,
  deadline: string,
) {
  const deadlineInVietnam = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(deadline));
  return {
    to: order.customer_email_snapshot,
    subject: `Your raffle payment details | ${order.order_number} | Luminal Factory`,
    text: [
      "You were selected in the Luminal Factory raffle.",
      "",
      `Order ${order.order_number}`,
      `Item · ${formatShippingUsd(order.subtotal_minor)} USD`,
      `Shipping · ${formatShippingUsd(order.shipping_minor)} USD`,
      `Total due · ${formatShippingUsd(order.grand_total_minor)} USD`,
      `Pay by ${deadlineInVietnam} (Vietnam time, UTC+7).`,
      "",
      "Please reply to this email for payment instructions.",
      "",
      "Luminal Factory",
    ].join("\n"),
  };
}
