import React from 'react';

const OVERLAY_IMAGE_URL = '/Spotify Polaroid.png';

const imageAreaStyle = {
  position: 'absolute',
  left: '8.4%',
  top: '25.3%',
  width: '83.2%',
  height: '49.8%',
  overflow: 'hidden',
  zIndex: 1,
};

const codeAreaStyle = {
  position: 'absolute',
  left: '0.0%',
  bottom: '0',
  width: '100%',
  height: '24.2%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
};

const OverlayPreview = ({
  imageUrl,
  spotifyCode,
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
    {/* User Photo Area - Behind Overlay */}
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

    {/* Overlay Image */}
    <img
      src={OVERLAY_IMAGE_URL}
      alt="Overlay frame"
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%', 
        height: '100%', 
        display: 'block', 
        pointerEvents: 'none',
        zIndex: 10 
      }}
    />

    {/* Spotify Code Area - On Top of Overlay */}
    {spotifyCode && (
      <div style={codeAreaStyle}>
        <img 
          src={spotifyCode} 
          alt="Spotify Code" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>
    )}
  </div>
);

export default OverlayPreview;
