import { pageResponse } from '@/lib/site-pages';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export function GET(): Promise<Response> {
  return pageResponse();
}
