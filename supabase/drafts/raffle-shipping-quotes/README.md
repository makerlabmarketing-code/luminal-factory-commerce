# Raffle shipping rates and quote snapshots

Amounts use USD cents to match OldToy pricing and the existing order/payment currency. Confirm freight and subsidy in USD before saving a rate or override. Activate storefront estimates for a raffle by saving at least one rate, such as Vietnam. A missing international rate requires a per-order override. Vietnam shipping is always free to the buyer when using the quote workflow.

The quote RPC wraps the existing winner confirmation transaction. It records the carrier cost and applied subsidy privately and uses the resulting net shipping to create the order and pending payment. The ERP email draft reads the saved order amounts. Changes to rates apply to new quotes.

## Review and rollout

1. Confirm the target is the dedicated Commerce database and the existing winner-allocation RPC and shipping address tables are available.
2. Migration `20261120084342_raffle_shipping_quotes.sql` was applied directly to Commerce Production with the owner's authorization on 20 November 2026. The migration adds tables and an RPC without backfilling or editing existing rows.
3. Run `validation.sql` and require all four columns to be true. Verify that an anonymous read returns estimates only for published, non-test raffles.
4. Confirm the ERP Commerce integration allows the existing `commerce.raffle.winner.manage` scope for payment quote operations. Configure the approved OldToy rates in ERP, then validate a test winner, including the free Vietnam rate and an international override. Verify the order, payment and email agree.
5. To roll back, roll back the application changes and run `rollback.sql` to disable the new API grants without losing saved rates or confirmed quote records. To re-enable the feature after remediation, restore the grants in the recorded migration without recreating the tables or RPC.
