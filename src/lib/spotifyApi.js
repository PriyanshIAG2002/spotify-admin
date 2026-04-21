const GALLERY_API_URL =
  'https://manageproapi.logarithm.co.in/Techwalo-Server/api/spotify/spotify-gallery';

export const fetchGalleryRecords = async () => {
  const response = await fetch(GALLERY_API_URL);

  if (!response.ok) {
    throw new Error('Failed to fetch gallery');
  }

  const data = await response.json();
  return (data.result || []).sort((a, b) => b.createdAt - a.createdAt);
};

export const fetchGalleryRecordByUserId = async (userId) => {
  const records = await fetchGalleryRecords();
  return records.find((item) => item.userId === userId) || null;
};
