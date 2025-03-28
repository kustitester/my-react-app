// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';

const App = () => {
  return (
      <Router>
          <Layout>
              <nav>
                  <ul>
                      <li><Link to="/">Home</Link></li>
                  </ul>
              </nav>
              <Routes>
                  <Route path="/" element={<Home />} />
              </Routes>
          </Layout>
      </Router>
  );
};

export default App;
