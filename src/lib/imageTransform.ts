export const getImageUrl = (src: string, width: number, quality = 80): string => {
  if (!src) return src;

  const imageTransformEnabled = String(import.meta.env.IMAGEPORT_IMAGE_TRANSFORM_ENABLED ?? '').toLowerCase() === 'true';
  if (!imageTransformEnabled) return src;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return src;
  }

  const params = `width=${width},quality=${quality},format=auto`;
  parsed.pathname = `/cdn-cgi/image/${params}${parsed.pathname}`;
  return parsed.toString();
};
