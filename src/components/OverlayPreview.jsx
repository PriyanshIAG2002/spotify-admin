import React from 'react';

const OVERLAY_IMAGE_URL = '/overlay.png';

const imageAreaStyle = {
  position: 'absolute',
  left: '7.75%',
  top: '31.5%',
  width: '84.5%',
  height: '63.8%',
  overflow: 'hidden',
  border: '3.5px solid #1ed760',
  borderRadius: '2px',
  boxShadow: '0 0 20px rgba(30, 215, 96, 0.2)',
};

const OverlayPreview = ({
  imageUrl,
  alt = 'Spotify card',
  style,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  imageFit = 'cover',
  frameBackground = '#121212',
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
    {/* User Photo Area */}
    {imageUrl && (
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
    )}

    <img
      src={OVERLAY_IMAGE_URL}
      alt="Overlay frame"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
    />
  </div>
);

export default OverlayPreview;
