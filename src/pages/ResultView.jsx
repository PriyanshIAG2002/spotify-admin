import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  HiOutlineChevronLeft,
  HiOutlinePrinter,
  HiOutlineHome,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { fetchTempImagePublicPath } from '../lib/imageProxy';
import { buildOverlayPrintMarkup } from '../lib/overlayPrint';
import { fetchGalleryRecordByUserId } from '../lib/spotifyApi';

const MotionDiv = motion.div;

const ResultView = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [record, setRecord] = useState(location.state?.record || null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(!location.state?.record);
  const [finalImageURL, setFinalImageURL] = useState('');
  const [finalImageError, setFinalImageError] = useState('');

  const spotifyImageURL = record?.spotifyImageURL;
  const downloadableSpotifyImageURL = record?.downloadableSpotifyImageURL;

  useEffect(() => {
    let isMounted = true;

    const loadRecord = async () => {
      if (location.state?.record) {
        setRecord(location.state.record);
        setIsLoadingRecord(false);
        return;
      }

      try {
        setIsLoadingRecord(true);
        const matchedRecord = await fetchGalleryRecordByUserId(userId);

        if (!matchedRecord?.spotifyImageURL) {
          throw new Error('No completed capture found for this user.');
        }

        if (isMounted) {
          setRecord(matchedRecord);
        }
      } catch (error) {
        console.error('Result record fetch error:', error);
        if (isMounted) {
          alert('No capture data found. Returning to dashboard.');
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecord(false);
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

    const cacheFinalImage = async () => {
      if (!spotifyImageURL) {
        return;
      }

      try {
        setFinalImageError('');
        const publicPath = await fetchTempImagePublicPath(spotifyImageURL);

        if (isMounted) {
          setFinalImageURL(publicPath);
        }
      } catch (error) {
        console.error('Result preview cache error:', error);
        if (isMounted) {
          setFinalImageError('Could not prepare the final card preview.');
        }
      }
    };

    cacheFinalImage();

    return () => {
      isMounted = false;
    };
  }, [spotifyImageURL]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !finalImageURL) {
      return;
    }

    printWindow.document.write(buildOverlayPrintMarkup(finalImageURL));
    printWindow.document.close();
  };

  if (isLoadingRecord) {
    return (
      <div style={containerStyle}>
        <nav style={navStyle}>
          <button onClick={() => navigate('/')} style={backBtnStyle}>
            <HiOutlineChevronLeft size={20} /> DASHBOARD
          </button>
        </nav>

        <div style={loadingCardStyle}>Loading final image...</div>
      </div>
    );
  }

  if (!spotifyImageURL) return null;

  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <button onClick={() => navigate('/')} style={backBtnStyle}>
          <HiOutlineChevronLeft size={20} /> DASHBOARD
        </button>
        <span style={userIdBadgeStyle}>COMPLETED CAPTURE</span>
      </nav>

      <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={cardStyle}>
        <div style={headerSection}>
          <HiOutlineCheckCircle size={48} color="var(--spotify-green)" />
          <div>
            <h2 style={titleStyle}>Ready for Distribution</h2>
            <p style={subTitleStyle}>This capture has been processed and is ready to be printed or shared.</p>
          </div>
        </div>

        <div style={mainContentFlex}>
          <div style={previewBox}>
            <p style={labelStyle}>FINAL CARD PREVIEW</p>
            <div style={imageContainer}>
              {finalImageURL ? (
                <img src={finalImageURL} alt="Final card" style={finalImgStyle} />
              ) : (
                <div style={imagePlaceholderStyle}>
                  {finalImageError || 'Preparing final card preview...'}
                </div>
              )}
            </div>
          </div>

          <div style={actionsBox}>
            <div style={qrSection}>
              <div style={qrContainer}>
                <QRCodeSVG value={downloadableSpotifyImageURL} size={160} bgColor="#FFF" fgColor="#000" />
              </div>
              <p style={qrLabel}>SCAN TO DOWNLOAD</p>
            </div>

            <div style={buttonGroup}>
              <button onClick={handlePrint} style={printBtnStyle} disabled={!finalImageURL}>
                <HiOutlinePrinter size={20} /> PRINT CARD
              </button>
              <button onClick={() => navigate('/')} style={homeBtnStyle}>
                <HiOutlineHome size={20} /> GO TO HOME
              </button>
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' };
const backBtnStyle = { background: 'none', border: 'none', color: 'var(--spotify-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' };
const userIdBadgeStyle = { backgroundColor: 'var(--spotify-surface-2)', padding: '0.5rem 1rem', borderRadius: '500px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid var(--spotify-border)' };
const loadingCardStyle = { backgroundColor: 'var(--spotify-surface)', borderRadius: '24px', border: '1px solid var(--spotify-border)', padding: '3rem', textAlign: 'center', color: 'var(--spotify-text-sub)', fontWeight: '600' };
const cardStyle = { backgroundColor: 'var(--spotify-surface)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--spotify-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' };
const headerSection = { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--spotify-border)', paddingBottom: '2rem' };
const titleStyle = { fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem' };
const subTitleStyle = { color: 'var(--spotify-text-sub)', fontSize: '0.95rem' };
const mainContentFlex = { display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' };
const previewBox = { width: '100%', maxWidth: '400px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: 'var(--spotify-text-muted)', letterSpacing: '1.5px', marginBottom: '1.5rem' };
const imageContainer = { width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', border: '1px solid var(--spotify-border)' };
const finalImgStyle = { width: '100%', display: 'block' };
const imagePlaceholderStyle = { minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', color: 'var(--spotify-text-sub)', backgroundColor: 'var(--spotify-surface-2)' };
const actionsBox = { width: '320px', display: 'flex', flexDirection: 'column', gap: '2.5rem' };
const qrSection = { textAlign: 'center', backgroundColor: 'var(--spotify-surface-2)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--spotify-border)' };
const qrContainer = { backgroundColor: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' };
const qrLabel = { fontSize: '0.8rem', fontWeight: '700', color: 'var(--spotify-text-sub)' };
const buttonGroup = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const printBtnStyle = { width: '100%', padding: '1.2rem', backgroundColor: 'var(--spotify-green)', color: 'black', border: 'none', borderRadius: '500px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' };
const homeBtnStyle = { width: '100%', padding: '1.2rem', backgroundColor: 'transparent', color: 'white', border: '1px solid var(--spotify-border)', borderRadius: '500px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' };

export default ResultView;
