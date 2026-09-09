import { handleAddressRequest } from "@/features/account/customer-address-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = handleAddressRequest;
export const POST = handleAddressRequest;
