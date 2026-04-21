export const buildTempImageProxyLookupUrl = (remoteUrl) => {
  if (!remoteUrl) {
    return '';
  }

  return `/__temp-image?url=${encodeURIComponent(remoteUrl)}`;
};

export const fetchTempImagePublicPath = async (remoteUrl) => {
  if (!remoteUrl) {
    return '';
  }

  const response = await fetch(buildTempImageProxyLookupUrl(remoteUrl));

  if (!response.ok) {
    throw new Error('Failed to prepare local image preview.');
  }

  const data = await response.json();
  return data.publicPath || '';
};
