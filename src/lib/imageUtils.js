const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const buildCardCompositeDataUrl = async (sourceUrl, codeUrl) => {
  if (!sourceUrl || !codeUrl) {
    return '';
  }

  const [sourceImage, codeImage] = await Promise.all([
    loadImage(sourceUrl),
    loadImage(codeUrl),
  ]);

  const squareSize = 1000;
  const stripHeight = Math.round(
    squareSize * (codeImage.naturalHeight / codeImage.naturalWidth)
  );

  const canvas = document.createElement('canvas');
  canvas.width = squareSize;
  canvas.height = squareSize + stripHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context is unavailable.');
  }

  const sourceAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
  const targetAspect = 1;
  let sx = 0;
  let sy = 0;
  let sw = sourceImage.naturalWidth;
  let sh = sourceImage.naturalHeight;

  if (sourceAspect > targetAspect) {
    sw = sourceImage.naturalHeight * targetAspect;
    sx = (sourceImage.naturalWidth - sw) / 2;
  } else if (sourceAspect < targetAspect) {
    sh = sourceImage.naturalWidth / targetAspect;
    sy = (sourceImage.naturalHeight - sh) / 2;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, squareSize, squareSize);
  context.drawImage(codeImage, 0, squareSize, squareSize, stripHeight);

  return canvas.toDataURL('image/jpeg', 0.95);
};
