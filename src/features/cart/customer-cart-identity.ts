import type { VerifiedCustomerCartIdentity } from "./customer-cart-service";

export type CustomerCartIdentity =
  | Readonly<{ state: "anonymous" }>
  | Readonly<{ state: "verified_customer"; identity: VerifiedCustomerCartIdentity }>
  | Readonly<{ state: "identity_unavailable" }>;

export interface CustomerCartIdentityResolver {
  resolve(): Promise<CustomerCartIdentity>;
}
