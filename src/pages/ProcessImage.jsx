import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import {
  HiOutlineChevronLeft,
  HiOutlinePhotograph,
  HiOutlinePrinter,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineHome,
} from 'react-icons/hi';
import OverlayPreview from '../components/OverlayPreview';
import { fetchTempImagePublicPath } from '../lib/imageProxy';
import { buildOverlayPrintMarkup } from '../lib/overlayPrint';
import { fetchGalleryRecordByUserId } from '../lib/spotifyApi';

const MotionDiv = motion.div;

const ProcessImage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState(location.state?.record || null);
  const [isRecordLoading, setIsRecordLoading] = useState(!location.state?.record);
  const [previewImageURL, setPreviewImageURL] = useState('');
  const [phase, setPhase] = useState('upload-code');
  const [spotifyCode, setSpotifyCode] = useState(null);
  const [cardCompositeURL, setCardCompositeURL] = useState('');
  const [compositeError, setCompositeError] = useState('');
  const [overlayZoom, setOverlayZoom] = useState(1);
  const [overlayOffsetX, setOverlayOffsetX] = useState(0);
  const [overlayOffsetY, setOverlayOffsetY] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [finalPreviewURL, setFinalPreviewURL] = useState('');
  const [finalPreviewError, setFinalPreviewError] = useState('');

  const spotifyInputRef = useRef(null);
  const compositeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRecord = async () => {
      if (location.state?.record) {
        setRecord(location.state.record);
        setIsRecordLoading(false);
        return;
      }

      try {
        setIsRecordLoading(true);
        const matchedRecord = await fetchGalleryRecordByUserId(userId);

        if (!matchedRecord) {
          throw new Error('No record found for this process id.');
        }

        if (isMounted) {
          setRecord(matchedRecord);
        }
      } catch (error) {
        console.error('Record fetch error:', error);
        if (isMounted) {
          alert('No record data found. Returning to dashboard.');
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setIsRecordLoading(false);
        }
      }
    };

    loadRecord();

    return () => {
      isMounted = false;
    };
  }, [location.state, navigate, userId]);

  useEffect(() => {
    let isMounted = true;

    const cachePreviewImage = async () => {
      if (!record) {
        return;
      }

      const sourceUrl = record.downloadableSourceImageURL || record.originalImageURL;
      if (!sourceUrl) {
        return;
      }

      try {
        const publicPath = await fetchTempImagePublicPath(sourceUrl);

        if (isMounted) {
          setPreviewImageURL(publicPath);
        }
      } catch (error) {
        console.error('Preview image cache error:', error);
      }
    };

    cachePreviewImage();

    return () => {
      isMounted = false;
    };
  }, [record]);


  useEffect(() => {
    let isMounted = true;

    const cacheFinalImage = async () => {
      if (!apiResult) {
        return;
      }

      try {
        setFinalPreviewError('');
        const sourceUrl = apiResult.spotifyImageURL || apiResult.downloadableSpotifyImageURL;
        const publicPath = await fetchTempImagePublicPath(sourceUrl);

        if (isMounted) {
          setFinalPreviewURL(publicPath);
        }
      } catch (error) {
        console.error('Final image cache error:', error);
        if (isMounted) {
          setFinalPreviewError('Could not prepare the final card preview.');
        }
      }
    };

    cacheFinalImage();

    return () => {
      isMounted = false;
    };
  }, [apiResult]);

  const handleCodeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const stripHeight = Math.round(img.height * 0.19);
        canvas.width = img.width;
        canvas.height = stripHeight;
        const context = canvas.getContext('2d');

        if (!context) {
          alert('Could not read the Spotify code image.');
          return;
        }

        context.drawImage(
          img,
          0,
          img.height - stripHeight,
          img.width,
          stripHeight,
          0,
          0,
          img.width,
          stripHeight
        );

        setSpotifyCode(canvas.toDataURL('image/png'));
        setOverlayZoom(1);
        setOverlayOffsetX(0);
        setOverlayOffsetY(0);
        setPhase('adjust');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!compositeRef.current || !record || !previewImageURL || !spotifyCode) return;
    setIsProcessing(true);

    try {
      const canvas = await html2canvas(compositeRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#000',
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const blob = await (await fetch(dataUrl)).blob();

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('sourceImage', blob, `final-${userId}.jpg`);

      const response = await fetch(
        'https://manageproapi.logarithm.co.in/Techwalo-Server/api/spotify/spotify-image',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('API capture failed');
      const data = await response.json();
      setApiResult(data.result);
      setPhase('result');
    } catch (error) {
      console.error(error);
      alert('Failed to submit image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !finalPreviewURL) {
      return;
    }

    printWindow.document.write(buildOverlayPrintMarkup(finalPreviewURL));
    printWindow.document.close();
  };

  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          <HiOutlineChevronLeft size={20} /> DASHBOARD
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {isRecordLoading && (
          <MotionDiv key="record-loading" initial={fade.in} animate={fade.animate} exit={fade.out} style={cardStyle}>
            <h2 style={titleStyle}>Loading Process</h2>
            <p style={subTitleStyle}>Fetching the record details and preparing the preview image.</p>
          </MotionDiv>
        )}

        {!isRecordLoading && phase === 'upload-code' && (
          <MotionDiv key="upload-code" initial={fade.in} animate={fade.animate} exit={fade.out} style={cardStyle}>
            <HiOutlinePhotograph size={64} color="var(--spotify-green)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={titleStyle}>Upload Spotify Code</h2>
            <p style={subTitleStyle}>Please upload the Spotify code image to start processing.</p>
            <div onClick={() => spotifyInputRef.current?.click()} style={uploadAreaStyle}>
              <HiOutlineCloudUpload size={40} />
              <p style={{ fontWeight: '600', marginTop: '1rem' }}>Click to select image</p>
            </div>
            <input ref={spotifyInputRef} type="file" hidden accept="image/*" onChange={handleCodeUpload} />
          </MotionDiv>
        )}

        {!isRecordLoading && phase === 'adjust' && (
          <MotionDiv key="adjust" initial={fade.in} animate={fade.animate} exit={fade.out} style={adjustLayout}>
            <div style={singlePreviewLayoutStyle}>
              <div style={previewCol}>
                <p style={panelLabelStyle}>FINAL OVERLAY</p>
                <div ref={compositeRef} style={overlayPreviewBoxStyle}>
                  {previewImageURL ? (
                    <OverlayPreview
                      imageUrl={previewImageURL}
                      spotifyCode={spotifyCode}
                      scale={overlayZoom}
                      offsetX={overlayOffsetX}
                      offsetY={overlayOffsetY}
                    />
                  ) : (
                    <div style={previewPlaceholderStyle}>
                      <p style={placeholderTextStyle}>
                        {compositeError || 'Preparing the final overlay preview...'}
                      </p>
                    </div>
                  )}
                </div>

                <div style={controlsPanelStyle}>
                  <label style={controlGroupStyle}>
                    <span style={controlLabelStyle}>Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={overlayZoom}
                      onChange={(event) => setOverlayZoom(Number(event.target.value))}
                      style={rangeInputStyle}
                    />
                  </label>

                  <label style={controlGroupStyle}>
                    <span style={controlLabelStyle}>Vertical Adjust</span>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      step="0.5"
                      value={overlayOffsetY}
                      onChange={(event) => setOverlayOffsetY(Number(event.target.value))}
                      style={rangeInputStyle}
                    />
                  </label>

                  <label style={controlGroupStyle}>
                    <span style={controlLabelStyle}>Horizontal Adjust</span>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      step="0.5"
                      value={overlayOffsetX}
                      onChange={(event) => setOverlayOffsetX(Number(event.target.value))}
                      style={rangeInputStyle}
                    />
                  </label>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !previewImageURL || !spotifyCode}
                  style={primaryBtnStyle}
                >
                  {isProcessing ? 'GENERATING...' : 'SUBMIT IMAGE'}
                </button>
              </div>
            </div>
          </MotionDiv>
        )}

        {!isRecordLoading && phase === 'result' && (
          <MotionDiv key="result" initial={fade.in} animate={fade.animate} exit={fade.out} style={cardStyle}>
            <HiOutlineCheckCircle size={64} color="var(--spotify-green)" style={{ marginBottom: '1rem' }} />
            <h2 style={titleStyle}>Processing Complete!</h2>
            <p style={subTitleStyle}>The finalized card has been generated.</p>

            <div style={resultFlex}>
              <div style={qrBox}>
                <QRCodeSVG value={apiResult?.downloadableSpotifyImageURL} size={180} bgColor="#FFF" fgColor="#000" />
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--spotify-text-sub)' }}>
                  SCAN TO DOWNLOAD
                </p>
              </div>

              <div style={actionBox}>
                {finalPreviewURL ? (
                  <div style={finalPreviewBoxStyle}>
                    <img src={finalPreviewURL} alt="Final card" style={finalPreviewImgStyle} />
                  </div>
                ) : (
                  <div style={finalPreviewPlaceholderStyle}>
                    {finalPreviewError || 'Preparing final card preview...'}
                  </div>
                )}

                <button onClick={handlePrint} style={printBtnStyle} disabled={!finalPreviewURL}>
                  <HiOutlinePrinter size={20} /> PRINT CARD
                </button>
                <button onClick={() => navigate('/')} style={homeBtnStyle}>
                  <HiOutlineHome size={20} /> GO TO HOME
                </button>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', padding: '2rem 1rem', maxWidth: '1080px', margin: '0 auto' };
const navStyle = { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '3rem' };
const backBtnStyle = { background: 'none', border: 'none', color: 'var(--spotify-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' };
const cardStyle = { backgroundColor: 'var(--spotify-surface)', padding: '3rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--spotify-border)' };
const uploadAreaStyle = { width: '100%', maxWidth: '400px', margin: '2rem 0', border: '2px dashed var(--spotify-border)', borderRadius: '20px', padding: '3rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const titleStyle = { fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' };
const subTitleStyle = { color: 'var(--spotify-text-sub)', maxWidth: '400px', lineHeight: 1.6 };
const adjustLayout = { display: 'flex', justifyContent: 'center', width: '100%' };
const singlePreviewLayoutStyle = { width: '100%', maxWidth: '420px' };
const previewCol = { width: '100%', maxWidth: '420px' };
const panelLabelStyle = { fontSize: '0.78rem', fontWeight: '800', letterSpacing: '1.4px', color: 'var(--spotify-text-muted)', marginBottom: '0.85rem' };
const overlayPreviewBoxStyle = { 
  width: '100%', 
  aspectRatio: '2 / 3',
  backgroundColor: '#000',
  borderRadius: '0px', 
  overflow: 'hidden', 
  boxShadow: '0 30px 60px rgba(0,0,0,0.4)', 
  border: '1px solid var(--spotify-border)',
  position: 'relative'
};
const previewPlaceholderStyle = { width: '100%', minHeight: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' };
const placeholderTextStyle = { color: 'var(--spotify-text-sub)', textAlign: 'center', padding: '0 1.5rem' };
const controlsPanelStyle = { marginTop: '1rem', padding: '1rem 1.1rem', backgroundColor: 'var(--spotify-surface)', border: '1px solid var(--spotify-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.9rem' };
const controlGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left' };
const controlLabelStyle = { fontSize: '0.82rem', fontWeight: '700', color: 'var(--spotify-text-sub)' };
const rangeInputStyle = { width: '100%', accentColor: 'var(--spotify-green)', cursor: 'pointer' };
const primaryBtnStyle = { width: '100%', marginTop: '1.5rem', padding: '1.2rem', backgroundColor: 'var(--spotify-green)', color: 'black', border: 'none', borderRadius: '500px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' };
const resultFlex = { display: 'flex', gap: '3rem', marginTop: '2.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' };
const qrBox = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const actionBox = { display: 'flex', flexDirection: 'column', gap: '1rem', width: '250px' };
const finalPreviewBoxStyle = { width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--spotify-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' };
const finalPreviewImgStyle = { width: '100%', display: 'block' };
const finalPreviewPlaceholderStyle = { width: '100%', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: 'var(--spotify-text-sub)', backgroundColor: 'var(--spotify-surface-2)', border: '1px solid var(--spotify-border)', borderRadius: '16px', textAlign: 'center' };
const printBtnStyle = { ...primaryBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1rem' };
const homeBtnStyle = { width: '100%', padding: '1.2rem', backgroundColor: 'transparent', color: 'white', border: '1px solid var(--spotify-border)', borderRadius: '500px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' };

const fade = { in: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, out: { opacity: 0, y: -10 } };

export default ProcessImage;
