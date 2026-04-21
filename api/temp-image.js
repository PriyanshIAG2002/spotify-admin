export default async function handler(request, response) {
  const sourceUrl = request.query?.url;

  if (!sourceUrl) {
    response.status(400).json({ error: 'Missing image url.' });
    return;
  }

  let remoteUrl;
  try {
    remoteUrl = new URL(sourceUrl);
  } catch {
    response.status(400).json({ error: 'Invalid image url.' });
    return;
  }

  if (!['http:', 'https:'].includes(remoteUrl.protocol)) {
    response.status(400).json({ error: 'Unsupported image protocol.' });
    return;
  }

  try {
    const upstreamResponse = await fetch(remoteUrl.toString());

    if (!upstreamResponse.ok) {
      response
        .status(upstreamResponse.status)
        .json({ error: `Image download failed with status ${upstreamResponse.status}` });
      return;
    }

    const contentType =
      upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const body = new Uint8Array(await upstreamResponse.arrayBuffer());

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    response.status(200).end(body);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Temp image proxy failed.',
    });
  }
}
