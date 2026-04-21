import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProcessImage from './pages/ProcessImage';
import ResultView from './pages/ResultView';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/process/:userId" element={<ProcessImage />} />
        <Route path="/result/:userId" element={<ResultView />} />
      </Routes>
    </Router>
  );
}

export default App;
