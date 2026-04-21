import React from 'react';

const OVERLAY_IMAGE_URL = '/overlay.png';

const imageAreaStyle = {
  position: 'absolute',
  left: '7.75%',
  top: '31.5%',
  width: '83%',
  height: '63.8%',
  overflow: 'hidden',
};

const OverlayPreview = ({
  imageUrl,
  alt = 'Spotify card',
  style,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  imageFit = 'contain',
  frameBackground = '#ffffff',
}) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '2 / 3',
      overflow: 'hidden',
      backgroundColor: '#000',
      ...style,
    }}
  >
    {imageUrl ? (
      <div style={{ ...imageAreaStyle, backgroundColor: frameBackground }}>
        <img
          src={imageUrl}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: imageFit,
            display: 'block',
            transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    ) : null}

    <img
      src={OVERLAY_IMAGE_URL}
      alt="Overlay frame"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  </div>
);

export default OverlayPreview;
