import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import NeteaseCloudMusicApi from 'NeteaseCloudMusicApi';

// 前端最终使用的歌曲结构。
export interface NeteaseTrack {
  id: number;
  name: string;
  artist: string;
  duration: string;
  cover: string;
  playUrl: string;
}

interface GetTrackOptions {
  // 覆盖默认 TopK。
  topK?: number;
  // 是否随机抽取歌曲。
  random?: boolean;
}

// 网易云歌单接口中的歌曲字段（仅保留用到的字段）。
interface PlaylistTrack {
  id: number;
  name: string;
  dt: number;
  ar?: Array<{ name?: string }>;
  al?: { picUrl?: string };
}

interface TracksCache {
  // 缓存写入时间戳（毫秒）。
  updatedAt: number;
  // 最近一次成功拿到的可播放歌曲列表。
  tracks: NeteaseTrack[];
}

interface RefreshState {
  // 上一次执行 login_refresh 的时间戳。
  lastRefreshAt: number;
}

// 歌曲缓存文件。
const TRACKS_CACHE_PATH = join(process.cwd(), '.cache', 'netease-tracks.json');
// 续期状态文件。
const REFRESH_STATE_PATH = join(process.cwd(), '.cache', 'netease-refresh.json');

const formatDuration = (ms: number): string => {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remain = sec % 60;
  return `${String(min).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
};

const toHttpsUrl = (value: string | undefined): string => {
  if (!value) return '';
  return value.replace(/^http:\/\//i, 'https://');
};

const buildNeteaseCookie = (): string => {
  // 优先使用完整 Cookie 配置。
  const rawCookie = import.meta.env.NETEASE_COOKIE?.trim();
  if (rawCookie) return rawCookie;

  // 兜底：用拆分字段拼接 Cookie。
  const musicU = import.meta.env.NETEASE_MUSIC_U?.trim();
  const csrf = import.meta.env.NETEASE_CSRF?.trim();
  const nmtid = import.meta.env.NETEASE_NMTID?.trim();

  return [
    musicU ? `MUSIC_U=${musicU}` : '',
    csrf ? `__csrf=${csrf}` : '',
    nmtid ? `NMTID=${nmtid}` : '',
  ]
    .filter(Boolean)
    .join('; ');
};

const sampleArray = <T>(items: T[], count: number): T[] => {
  // Fisher-Yates 洗牌后截取，用于随机 TopK。
  if (items.length <= count) return items;
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied.slice(0, count);
};

const ensureParentDir = async (filePath: string): Promise<void> => {
  // 写文件前确保父目录存在。
  await mkdir(dirname(filePath), { recursive: true });
};

const loadTracksCache = async (): Promise<TracksCache | null> => {
  // 缓存缺失或格式异常时，返回 null。
  try {
    const raw = await readFile(TRACKS_CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as TracksCache;
    if (!Array.isArray(parsed?.tracks)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveTracksCache = async (tracks: NeteaseTrack[]): Promise<void> => {
  // 持久化最近可播放结果，用于接口失败或凭证失效时兜底。
  try {
    await ensureParentDir(TRACKS_CACHE_PATH);
    await writeFile(
      TRACKS_CACHE_PATH,
      JSON.stringify({ updatedAt: Date.now(), tracks }, null, 2),
      'utf-8',
    );
  } catch (error) {
    console.warn('[netease] failed to write cache:', error);
  }
};

const maybeRefreshLogin = async (cookie: string): Promise<void> => {
  // 定时续期登录态，降低 Cookie 过期影响。
  const refreshIntervalHours = Number(import.meta.env.NETEASE_REFRESH_INTERVAL_HOURS ?? 12);
  const refreshIntervalMs = Math.max(1, refreshIntervalHours) * 60 * 60 * 1000;

  let lastRefreshAt = 0;
  try {
    const raw = await readFile(REFRESH_STATE_PATH, 'utf-8');
    const state = JSON.parse(raw) as RefreshState;
    lastRefreshAt = Number(state?.lastRefreshAt ?? 0);
  } catch {
    lastRefreshAt = 0;
  }

  if (Date.now() - lastRefreshAt < refreshIntervalMs) return;

  try {
    await NeteaseCloudMusicApi.login_refresh({ cookie });
    await ensureParentDir(REFRESH_STATE_PATH);
    await writeFile(
      REFRESH_STATE_PATH,
      JSON.stringify({ lastRefreshAt: Date.now() } satisfies RefreshState, null, 2),
      'utf-8',
    );
  } catch (error) {
    console.warn('[netease] login_refresh failed, continue with existing cookie:', error);
  }
};

const pickFromCache = (cache: TracksCache | null, topK: number, random = false): NeteaseTrack[] => {
  // 统一缓存兜底入口。
  if (!cache || cache.tracks.length === 0) return [];
  return random ? sampleArray(cache.tracks, topK) : cache.tracks.slice(0, topK);
};

export const getNeteaseTopTracks = async (options: GetTrackOptions = {}): Promise<NeteaseTrack[]> => {
  // 读取运行配置。
  const cookie = buildNeteaseCookie();
  const playlistId = import.meta.env.NETEASE_PLAYLIST_ID?.trim();
  const topK = Math.max(1, Number(options.topK ?? import.meta.env.NETEASE_TOP_K ?? 8));

  // 提前加载缓存，确保任意失败路径都能复用。
  const cache = await loadTracksCache();

  if (!cookie || !playlistId) {
    // 配置不完整时，尽量返回缓存数据。
    console.warn('[netease] missing envs, fallback to cache. Required: NETEASE_PLAYLIST_ID + cookie creds');
    return pickFromCache(cache, topK, options.random);
  }

  try {
    // 先做登录续期，再请求业务数据。
    await maybeRefreshLogin(cookie);

    const playlistRes = await NeteaseCloudMusicApi.playlist_detail({
      id: playlistId,
      cookie,
    });

    const playlistBody = (playlistRes?.body ?? {}) as {
      playlist?: { tracks?: PlaylistTrack[] };
    };

    const tracksRaw = playlistBody.playlist?.tracks ?? [];
    const sourceTracks = options.random
      ? sampleArray(tracksRaw, Math.min(tracksRaw.length, topK * 5))
      : tracksRaw;
    const candidateTracks = sourceTracks.slice(0, Math.max(1, topK * (options.random ? 3 : 1)));
    // 随机模式先多取一些，过滤不可播后再裁剪。

    if (candidateTracks.length === 0) {
      // 歌单为空时走缓存兜底。
      return pickFromCache(cache, topK, options.random);
    }

    const ids = candidateTracks.map((t) => t.id).join(',');
    const urlRes = await NeteaseCloudMusicApi.song_url_v1({
      id: ids,
      level: 'standard' as any,
      cookie,
    });

    const urls = (urlRes?.body?.data ?? []) as Array<{ id: number; url: string | null }>;
    const urlMap = new Map<number, string>();
    urls.forEach((item) => {
      if (item?.id && item?.url) urlMap.set(item.id, item.url);
    });

    const playableTracks = candidateTracks
      .map((track) => ({
        id: track.id,
        name: track.name,
        artist: (track.ar ?? []).map((a) => a.name).filter(Boolean).join(' / ') || 'Unknown Artist',
        duration: formatDuration(track.dt),
        cover: toHttpsUrl(track.al?.picUrl ?? ''),
        playUrl: toHttpsUrl(urlMap.get(track.id) ?? ''),
      }))
      .filter((track) => track.playUrl);
    // VIP/版权受限歌曲通常无播放地址。

    if (playableTracks.length === 0) {
      // 可能全是不可播歌曲，继续回退缓存。
      console.warn('[netease] no playable tracks from API response, fallback to cache');
      return pickFromCache(cache, topK, options.random);
    }

    // 请求成功后刷新缓存，供下次兜底。
    await saveTracksCache(playableTracks);
    return options.random ? sampleArray(playableTracks, topK) : playableTracks.slice(0, topK);
  } catch (error) {
    console.error('[netease] request failed, fallback to cache:', error);
    return pickFromCache(cache, topK, options.random);
  }
};
