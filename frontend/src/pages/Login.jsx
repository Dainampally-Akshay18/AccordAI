import React from 'react'

const Login = () => {
  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-10 left-5 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-5 w-80 h-80 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse [animation-delay:2000ms] transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Main Content */}
        <main className="relative z-10">
          {/* Hero Section */}
          <section className="pt-32 pb-16 px-4 text-center">
            <div className="max-w-6xl mx-auto">
              {/* Logo */}
              <div className="mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/50 animate-bounce">
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-white">
                    <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              
              {/* Title */}
              <h1 className="mb-8">
                <span className="block text-6xl sm:text-7xl md:text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
                  Accord AI
                </span>
                <span className="block text-xl sm:text-2xl md:text-3xl font-semibold text-slate-400 tracking-wide">
                  Legal Document Intelligence
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
                Transform your legal document analysis with cutting-edge AI technology. Upload contracts, agreements, and legal documents for comprehensive{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">risk assessment</span>,{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">intelligent summarization</span>, and{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">negotiation assistance</span>.
              </p>

              {/* Tech Badges */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {[
                  { icon: '🤖', text: 'Llama 3.3 70B' },
                  { icon: '📄', text: 'Enhanced PDF' },
                  { icon: '🛡️', text: 'Secure Analysis' }
                ].map((badge, index) => (
                  <div key={index} className="flex items-center gap-3 px-6 py-3 bg-slate-800/60 backdrop-blur-sm border border-blue-500/30 rounded-full hover:bg-blue-600/20 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="font-semibold text-slate-200">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default Login
