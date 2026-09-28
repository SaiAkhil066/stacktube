const ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeUrl(input: string): { youtubeId: string; isShort: boolean } | null {
  const raw = input.trim();
  if (ID.test(raw)) return { youtubeId: raw, isShort: false };
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  let isShort = false;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (first === "shorts") {
      id = second;
      isShort = true;
    } else if (first === "embed" || first === "live" || first === "v") id = second;
  }
  return id && ID.test(id) ? { youtubeId: id, isShort } : null;
}

export function thumbnailUrl(youtubeId: string, size: "hq" | "mq" = "hq") {
  return `https://i.ytimg.com/vi/${youtubeId}/${size}default.jpg`;
}

export type OEmbed = { title: string; author_name: string; author_url: string };

// Public, keyless endpoint. Returns null for private/removed videos.
export async function fetchOEmbed(youtubeId: string): Promise<OEmbed | null> {
  const target = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`;
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return (await res.json()) as OEmbed;
  } catch {
    return null;
  }
}
