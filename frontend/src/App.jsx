import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './pages/About';
import RagAnalysis from './pages/RagAnalysis';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Global Navbar (if you want it on all pages) */}
        <Navbar />
        
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<Home />} />
          
          {/* About Route */}
          <Route path="/about" element={<About />} />
          
          {/* ✅ CRITICAL: Analysis Route with Wildcard for Nested Routes */}
          <Route path="/analysis/*" element={<RagAnalysis />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
