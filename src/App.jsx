import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineRefresh, HiOutlinePhotograph, HiOutlineUser, HiOutlineCalendar } from 'react-icons/hi';
import './index.css';

const SpotifyAdmin = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://manageproapi.logarithm.co.in/Techwalo-Server/api/spotify/spotify-gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery');
      const data = await response.json();
      setGallery(data.result || []);
      setError(null);
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError('Could not load gallery. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        padding: '0 1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem' }}>
            SPOTIFY <span style={{ color: 'var(--spotify-green)' }}>ADMIN</span>
          </h1>
          <p style={{ color: 'var(--spotify-text-sub)', fontSize: '1rem' }}>
            Manage and view all captured photobooth moments.
          </p>
        </div>
        <button 
          onClick={fetchGallery}
          disabled={loading}
          style={{
            backgroundColor: 'var(--spotify-surface-2)',
            color: 'white',
            border: '1px solid var(--spotify-border)',
            padding: '0.8rem 1.5rem',
            borderRadius: '500px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <HiOutlineRefresh className={loading ? 'spin' : ''} size={18} />
          {loading ? 'REFRESHING...' : 'REFRESH GALLERY'}
        </button>
      </header>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {loading && gallery.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}
          >
            <div className="spinner"></div>
            <p style={{ marginTop: '1.5rem', color: 'var(--spotify-text-sub)' }}>Loading shared moments...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#1A1A1A', borderRadius: '20px', border: '1px solid rgba(255,0,0,0.1)' }}
          >
            <p style={{ color: '#FF5F5F', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={fetchGallery} className="primary-btn">TRY AGAIN</button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}
          >
            {gallery.map((item, index) => (
              <motion.div
                key={item.userId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  backgroundColor: 'var(--spotify-surface)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--spotify-border)',
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  cursor: 'pointer'
                }}
                whileHover={{ transform: 'translateY(-8px)', borderColor: 'rgba(26, 215, 96, 0.3)' }}
              >
                {/* Image Container */}
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                  <img 
                    src={item.originalImageURL} 
                    alt={`Capture by ${item.userId}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found'; }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '500px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    color: item.status === 1 ? 'var(--spotify-green)' : '#FFD700',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {item.status === 1 ? 'PUBLISHED' : 'PENDING'}
                  </div>
                </div>

                {/* Details Container */}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: 'var(--spotify-surface-2)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', color: 'var(--spotify-green)'
                    }}>
                      <HiOutlineUser size={16} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--spotify-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Captured by</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ID: {item.userId}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: 'var(--spotify-surface-2)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', color: 'var(--spotify-text-sub)'
                    }}>
                      <HiOutlineCalendar size={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--spotify-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Timestamp</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--spotify-text-sub)' }}>
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for spinner and special buttons */}
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(26, 215, 96, 0.2);
          border-top: 3px solid var(--spotify-green);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .primary-btn {
          background-color: var(--spotify-green);
          color: black;
          padding: 0.8rem 2rem;
          border-radius: 500px;
          border: none;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
        }

        :root {
          --spotify-green: #1AD760;
          --spotify-bg: #121212;
          --spotify-surface: #1E1E1E;
          --spotify-surface-2: #282828;
          --spotify-surface-3: #333333;
          --spotify-text: #FFFFFF;
          --spotify-text-sub: #B3B3B3;
          --spotify-text-muted: #6A6A6A;
          --spotify-border: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default SpotifyAdmin;
