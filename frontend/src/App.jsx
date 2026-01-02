import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import About from './pages/About';
import RagAnalysis from './pages/RagAnalysis';
import Navbar from './components/Navbar';
import { initializeSession } from './services/api.js';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize session once on mount
    const init = async () => {
      try {
        await initializeSession();
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);
  
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
