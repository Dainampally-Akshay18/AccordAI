import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase'; 

// Page Imports
import Home from './components/Home';
import About from './pages/About';
import RagAnalysis from './pages/RagAnalysis';
import Login from './pages/Login';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Protected Route Wrapper
  const RequireAuth = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App min-h-screen bg-slate-900 text-white">
        
        {/* FIXED NAVBAR: High z-index to stay on top of everything */}
        <div className="fixed top-0 left-0 w-full z-[100] bg-slate-900 shadow-md">
          <Navbar user={user} /> 
        </div>
        
        {/* CONTENT WRAPPER: Pushes content down so it's not hidden by Navbar */}
        <div className="pt-16">
          <Routes>
            {/* 1. Root now redirects to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 2. Login Route (Redirects to Analysis if already logged in) */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/home" replace /> : <Login />} 
            />

            {/* 3. Explicit Home Route */}
            <Route path="/home" element={user ? <Home /> : <Navigate to="/login" replace />} />
            
            <Route path="/about" element={<About />} />
            
            {/* Protected Analysis Routes */}
            <Route 
              path="/analysis/*" 
              element={
                <RequireAuth>
                  <RagAnalysis />
                </RequireAuth>
              } 
            />
            
            {/* Fallback - Redirects to Login for unknown paths */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;