import { handleColorwayRequest } from "@/features/management/colorway-admin-route";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Props) { return handleColorwayRequest(request, (await params).id); }
export async function POST(request: Request, { params }: Props) { return handleColorwayRequest(request, (await params).id); }
