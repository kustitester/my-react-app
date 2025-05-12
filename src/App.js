// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Fingerprint2Test from './components/Fingerprint2Test';
import EnhancedFingerprintTest from './components/EnhancedFingerprintTest';

const App = () => {
  return (
      <Router>
          <Layout>
              <nav style={{
                  background: '#f8f9fa',
                  padding: '1rem',
                  marginBottom: '2rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                  <ul style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      gap: '1rem',
                      justifyContent: 'center'
                  }}>
                      <li><Link to="/" style={{
                          textDecoration: 'none',
                          color: '#6c5ce7',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                      }}>Home</Link></li>
                      <li><Link to="/fingerprint2test" style={{
                          textDecoration: 'none',
                          color: '#6c5ce7',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                      }}>Fingerprint2 Test</Link></li>
                      <li><Link to="/enhancedfingerprinttest" style={{
                          textDecoration: 'none',
                          color: '#6c5ce7',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                      }}>Enhanced Fingerprint Test</Link></li>
                  </ul>
              </nav>
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/fingerprint2test" element={<Fingerprint2Test />} />
                  <Route path="/enhancedfingerprinttest" element={<EnhancedFingerprintTest />} />
              </Routes>
          </Layout>
      </Router>
  );
};

export default App;
