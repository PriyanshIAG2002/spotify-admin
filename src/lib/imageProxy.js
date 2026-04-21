export const buildTempImageProxyLookupUrl = (remoteUrl) => {
  if (!remoteUrl) {
    return '';
  }

  return `/api/temp-image?url=${encodeURIComponent(remoteUrl)}`;
};

export const fetchTempImagePublicPath = async (remoteUrl) => {
  if (!remoteUrl) {
    return '';
  }

  return buildTempImageProxyLookupUrl(remoteUrl);
};
