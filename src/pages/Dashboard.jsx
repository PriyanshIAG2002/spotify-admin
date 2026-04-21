import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineRefresh, 
  HiChevronLeft, 
  HiChevronRight,
  HiFilter
} from 'react-icons/hi';
import { fetchGalleryRecords } from '../lib/spotifyApi';

const MotionTableRow = motion.tr;

const Dashboard = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); 
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const records = await fetchGalleryRecords();
      setGallery(records);
      setError(null);
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError('Could not load gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void fetchGallery();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredData = useMemo(() => {
    if (filter === 'all') return gallery;
    return gallery.filter(item => item.status.toString() === filter);
  }, [gallery, filter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.4rem' }}>
            SPOTIFY <span style={{ color: 'var(--spotify-green)' }}>SHARING</span>
          </h1>
          <p style={{ color: 'var(--spotify-text-sub)', fontSize: '0.85rem' }}>
            {filteredData.length} records found.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.8rem', 
            backgroundColor: 'var(--spotify-surface-2)', padding: '0.4rem 1rem', 
            borderRadius: '500px', border: '1px solid var(--spotify-border)'
          }}>
            <HiFilter size={16} color="var(--spotify-text-muted)" />
            <select 
              value={filter} 
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              style={{
                backgroundColor: 'transparent', color: 'white', border: 'none',
                fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="all">ALL STATUS</option>
              <option value="1">PENDING (ST 1)</option>
              <option value="2">COMPLETED (ST 2)</option>
            </select>
          </div>

          <button onClick={fetchGallery} disabled={loading} style={refreshButtonStyle}>
            <HiOutlineRefresh className={loading ? 'spin' : ''} size={14} />
            {loading ? 'RELOADING...' : 'REFRESH'}
          </button>
        </div>
      </header>

      <div style={containerStyle}>
        {error && (
          <div style={errorBannerStyle}>
            {error}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--spotify-border)', backgroundColor: 'var(--spotify-surface-2)' }}>
              <th style={thStyle}>PREVIEW</th>
              <th style={thStyle}>DATE & TIME</th>
              <th style={thStyle}>STATUS</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading && gallery.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></td></tr>
              ) : paginatedData.map((item, index) => (
                <MotionTableRow
                  key={item.createdAt + index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: '1px solid var(--spotify-border)' }}
                  className="table-row"
                >
                  <td style={tdStyle}>
                    <div style={imageThumbStyle}>
                      <img 
                        src={item.originalImageURL} 
                        style={imgStyle} 
                        alt={`Preview for ${item.userId}`}
                        loading="lazy"
                      />
                    </div>
                  </td>
                  <td style={tdStyle}>{formatDate(item.createdAt)}</td>
                  <td style={tdStyle}>
                    <div style={{ 
                      ...statusBadgeStyle,
                      color: item.status.toString() === '1' ? '#FFA500' : 'var(--spotify-green)',
                      backgroundColor: item.status.toString() === '1' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(26, 215, 96, 0.1)'
                    }}>
                      {item.status.toString() === '1' ? 'PENDING' : 'READY'}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {item.status.toString() === '1' ? (
                      <button 
                        onClick={() => navigate(`/process/${item.userId}`, { state: { record: item } })}
                        style={actionButtonStyle}
                      >
                        PROCEED
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/result/${item.userId}`, { state: { record: item } })}
                        style={viewButtonStyle}
                      >
                        VIEW IMAGE
                      </button>
                    )}
                  </td>
                </MotionTableRow>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {!loading && filteredData.length > 0 && (
          <div style={paginationWrapperStyle}>
            <p style={{ fontSize: '0.8rem', color: 'var(--spotify-text-muted)' }}>
              Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <PaginationButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} icon={<HiChevronLeft size={18} />} />
              <PaginationButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} icon={<HiChevronRight size={18} />} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = { backgroundColor: 'var(--spotify-surface)', borderRadius: '16px', border: '1px solid var(--spotify-border)', overflow: 'hidden' };
const thStyle = { padding: '1.2rem 1.5rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--spotify-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle = { padding: '1rem 1.5rem', verticalAlign: 'middle', fontSize: '0.85rem' };
const imageThumbStyle = { width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#333' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const statusBadgeStyle = { display: 'inline-flex', padding: '0.3rem 0.6rem', borderRadius: '500px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid currentColor' };
const actionButtonStyle = { backgroundColor: 'var(--spotify-green)', color: 'black', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '500px', fontWeight: '700', cursor: 'pointer', fontSize: '0.7rem' };
const viewButtonStyle = { backgroundColor: 'transparent', color: 'var(--spotify-green)', border: '1px solid var(--spotify-green)', padding: '0.5rem 1.2rem', borderRadius: '500px', fontWeight: '700', cursor: 'pointer', fontSize: '0.7rem' };
const refreshButtonStyle = { backgroundColor: 'var(--spotify-surface-2)', color: 'white', border: '1px solid var(--spotify-border)', padding: '0.5rem 1rem', borderRadius: '500px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer' };
const paginationWrapperStyle = { padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--spotify-border)', backgroundColor: 'var(--spotify-surface-2)' };
const errorBannerStyle = { padding: '1rem 1.5rem', color: '#ffb4b4', backgroundColor: 'rgba(255, 69, 58, 0.08)', borderBottom: '1px solid rgba(255, 69, 58, 0.2)', fontSize: '0.85rem', fontWeight: '600' };

const PaginationButton = ({ onClick, disabled, icon }) => (
  <button onClick={onClick} disabled={disabled} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--spotify-border)', backgroundColor: 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1 }}>
    {icon}
  </button>
);

export default Dashboard;
