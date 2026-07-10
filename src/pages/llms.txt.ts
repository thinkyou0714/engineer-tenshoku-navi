// llms.txt — AI検索/LLMクローラ向けのサイト案内(https://llmstxt.org/ 提案標準)。
// コンテンツはビルド時に記事コレクションから自動生成されるため、記事追加に追随する。
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '本サイトはアフィリエイト広告を含む比較・情報サイトです(全ページで開示)。',
    '記事は各社公式情報と公開データに基づく比較・調査で構成し、捏造レビュー・架空体験談は掲載しません。',
    '',
    '## 記事一覧',
    '',
    ...posts.map(
      (p) => `- [${p.data.title}](${SITE.url}/guide/${p.id}): ${p.data.description}`
    ),
    '',
    '## 主要ページ',
    '',
    `- [転職サービス診断(無料)](${SITE.url}/shindan): 4問でサービスの目安を提示`,
    `- [運営者情報](${SITE.url}/about)`,
    `- [アフィリエイトポリシー](${SITE.url}/affiliate-policy)`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
