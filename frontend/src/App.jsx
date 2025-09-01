import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import About from './pages/About';
import RagAnalysis from './pages/RagAnalysis';
import Navbar from './components/Navbar';


function App() {
  return (
    <Router>
      <Navbar/>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<About />} />
          <Route path="/analysis" element={<RagAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
