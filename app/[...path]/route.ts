import { nestedPageParams, pageResponse } from '@/lib/site-pages';

export const runtime = 'nodejs';
export const dynamicParams = false;

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export function generateStaticParams(): Array<{ path: string[] }> {
  return nestedPageParams;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return pageResponse(path);
}
