// robots.txt をビルド時生成する。Sitemap URL が SITE.url(env 駆動の origin+base)から
// 導出されるため、独自ドメイン移行時に手動更新が不要になる(旧 public/robots.txt は
// URL ハードコードで移行に追従しなかった)。
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

export const GET: APIRoute = () => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE.url}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
