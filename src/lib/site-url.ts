// Verified Production domain; an explicit deployment configuration may override it.
export const publicSiteUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() || 'https://luminalfactory.com';
