import { handleCatalogMedia } from '@/features/management/catalog-media-route';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string; variantId?: string }> };
export async function POST(request: Request, { params }: Props) { return handleCatalogMedia(request, params, true); }
