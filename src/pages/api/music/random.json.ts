import type { APIRoute } from 'astro';
import { getNeteaseTopTracks } from '@src/lib/music/netease';

export const prerender = true;

// 从配置歌单返回一组可播放的随机歌曲。
export const GET: APIRoute = async ({ url }) => {
  const kParam = Number(url.searchParams.get('k') ?? '');
  const tracks = await getNeteaseTopTracks({
    random: true,
    ...(Number.isFinite(kParam) && kParam > 0 ? { topK: kParam } : {}),
  });

  return new Response(JSON.stringify({ tracks }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
