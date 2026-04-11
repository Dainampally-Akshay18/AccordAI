import React from "react";

const AboutDeveloper = () => {
  return (
    <section className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200">
      
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
          Meet Our Developers
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Passionate innovators building the future of web technology
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
      </div>

      {/* 2x2 Developers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        
        {/* Developer 1: Dainampally Akshay Kireet - Microsoft Intern */}
        <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Profile Image */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 w-full h-full">
                <img
                  src="https://res.cloudinary.com/dadapse5k/image/upload/v1759377580/akshay4_k1qqtn.png"
                  alt="Dainampally Akshay Kireet"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 text-blue-300 text-sm font-semibold backdrop-blur-sm">
                🚀 Microsoft Intern
              </span>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                Dainampally Akshay Kireet
              </h2>
              <p className="text-slate-400 text-sm">AI Full-Stack Developer</p>
            </div>

            {/* Bio */}
            <p className="text-slate-400 text-center leading-relaxed mb-6">
              AI-focused full-stack developer with strong foundations in DSA and Machine Learning,
              contributing equally to system architecture, development, and innovation.
            </p>

            {/* Experience */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-blue-300">
                🏢 Intern Experience
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gained hands-on experience working on real-world enterprise applications,
                strengthening problem-solving, cloud fundamentals, and collaborative development.
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-slate-300 flex items-center gap-2">
                🛠 Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "React.js", "JavaScript", "Node.js", "FastAPI",
                  "MongoDB", "SQL", "Machine Learning", "Azure"
                ].map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-medium hover:border-blue-500/50 hover:text-blue-300 transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Developer 2: Varshith Reddy - Full Stack Developer */}
        <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Profile Image */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 w-full h-full">
                <img
                  src="https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919878/VARSHITH_djjuas.jpg"
                  alt="Varshith Reddy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/30 text-emerald-300 text-sm font-semibold backdrop-blur-sm">
                Software Engineer LTI MindTree
              </span>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                Varshith Reddy
              </h2>
              <p className="text-slate-400 text-sm">MERN Stack Expert</p>
            </div>

            {/* Bio */}
            <p className="text-slate-400 text-center leading-relaxed mb-6">
              Passionate full-stack developer with expertise in modern web technologies,
              focused on building seamless user experiences and robust backend systems.
            </p>

            {/* Quote/Motto */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-emerald-300">
                💡 Dev Motto
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "Code is poetry written for both machines and humans to understand."
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-slate-300 flex items-center gap-2">
                🛠 Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-2">
                {["React.js", "Node.js", "Python", "MongoDB", "Tailwind CSS", "Express.js"].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-medium hover:border-emerald-500/50 hover:text-emerald-300 transition-colors duration-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Developer 3: Rohith Kumar - Backend Specialist */}
        <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Profile Image */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 w-full h-full">
                <img
                  src="https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919879/rohith_szve4v.jpg"
                  alt="Rohith Kumar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-600/30 text-orange-300 text-sm font-semibold backdrop-blur-sm">
                Software Engineer Intern Nxzen
              </span>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                Rohith Kumar
              </h2>
              <p className="text-slate-400 text-sm">System Architect</p>
            </div>

            {/* Bio */}
            <p className="text-slate-400 text-center leading-relaxed mb-6">
              Backend-focused developer skilled in API design, database management,
              and scalable server-side architecture for high-performance applications.
            </p>

            {/* Experience */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-orange-300">
                🎯 Core Focus
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Specializing in building robust, scalable backend systems that handle millions of requests with minimal latency.
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-slate-300 flex items-center gap-2">
                🛠 Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Java", "Spring Boot", "PostgreSQL", "Docker", "AWS", "REST APIs"].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-medium hover:border-orange-500/50 hover:text-orange-300 transition-colors duration-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Developer 4: Hebbare Likith - Frontend Developer */}
        <div className="group rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-pink-500/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Profile Image */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 w-full h-full">
                <img
                  src="https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919879/likith_qlhzbb.jpg"
                  alt="Hebbare Likith"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-600/30 text-pink-300 text-sm font-semibold backdrop-blur-sm">
                Software Engineer Capgemini
              </span>
            </div>

            {/* Name & Title */}
            <div className="text-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-red-500 bg-clip-text text-transparent mb-2">
                Hebbare Likith
              </h2>
              <p className="text-slate-400 text-sm">UI/UX Craftsman</p>
            </div>

            {/* Bio */}
            <p className="text-slate-400 text-center leading-relaxed mb-6">
              Creative frontend developer passionate about responsive design,
              interactive UI components, and delivering pixel-perfect user interfaces.
            </p>

            {/* Philosophy */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-pink-300">
                🎯 Design Philosophy
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "Every pixel matters — creating experiences that users fall in love with."
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-md font-semibold mb-3 text-slate-300 flex items-center gap-2">
                🛠 Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-2">
                {["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Figma", "Redux"].map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-medium hover:border-pink-500/50 hover:text-pink-300 transition-colors duration-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Note */}
      <div className="text-center mt-12 pt-8 border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          🌟 Building the future, one line of code at a time
        </p>
      </div>
    </section>
  );
};

export default AboutDeveloper;
