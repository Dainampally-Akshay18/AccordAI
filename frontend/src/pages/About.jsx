import React from "react";

const AboutDeveloper = () => {
  // Shared image link for the three new developers
  const sharedImageLink = "https://imageio.forbes.com/specials-images/imageserve/5ecebee7938ec500060ab34f/0x0.jpg?format=jpg&crop=2336,2337,x1064,y702,safe&height=416&width=416&fit=bounds";

  return (
    <section className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-200">
      <br /><br /><br />

      {/* ===== Developers Grid ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* =====================================================
            LEFT SIDE — MICROSOFT INTERN
        ====================================================== */}
        <div className="space-y-8">

          {/* Profile */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl text-center">
            <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
              <img
                src="https://res.cloudinary.com/dadapse5k/image/upload/v1759377580/akshay4_k1qqtn.png"
                alt="Dainampally Akshay Kireet"
                className="w-full h-full object-cover"
              />
            </div>

            <span className="inline-block px-4 py-1 mb-3 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 text-blue-300 text-sm font-semibold">
              Microsoft Intern
            </span>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Dainampally Akshay Kireet
            </h2>

            <p className="text-slate-400 mt-3 leading-relaxed">
              AI-focused full-stack developer with strong foundations in DSA and Machine Learning,
              contributing equally to system architecture, development, and innovation.
            </p>
          </div>

          {/* Mission */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🎯 Mission</h3>
            <p className="text-slate-400 leading-relaxed">
              To design and implement intelligent, scalable applications by combining
              strong software engineering practices with applied AI solutions.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🔭 Vision</h3>
            <p className="text-slate-400 leading-relaxed">
              To become a technology innovator delivering impactful, ethical,
              and production-ready AI-driven systems.
            </p>
          </div>

          {/* Microsoft Intern Experience */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              🏢 Microsoft Intern Experience
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Gained hands-on experience working on real-world enterprise applications,
              strengthening problem-solving, cloud fundamentals, and collaborative development.
            </p>
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">🛠 Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "React.js",
                "JavaScript",
                "Node.js",
                "FastAPI",
                "MongoDB",
                "SQL",
                "Machine Learning",
                "Microsoft Azure"
              ].map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE — DELOITTE INTERN
        ====================================================== */}
        <div className="space-y-8">

          {/* Profile */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl text-center">
            <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
              <img
                src="https://res.cloudinary.com/dadapse5k/image/upload/v1758006489/saiteja_dzj2gn.jpg"
                alt="Mayedmakula Saiteja"
                className="w-full h-full object-cover"
              />
            </div>

            <span className="inline-block px-4 py-1 mb-3 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 text-blue-300 text-sm font-semibold">
              Deloitte Intern
            </span>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Mayedmakula Saiteja
            </h2>

            <p className="text-slate-400 mt-3 leading-relaxed">
              Software developer with equal ownership in frontend and backend development,
              contributing actively to design decisions and implementation.
            </p>
          </div>

          {/* Mission */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🎯 Mission</h3>
            <p className="text-slate-400 leading-relaxed">
              To build reliable, maintainable, and user-focused software systems
              through strong collaboration and engineering discipline.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">🔭 Vision</h3>
            <p className="text-slate-400 leading-relaxed">
              To grow as a full-stack engineer capable of delivering scalable solutions
              that meet real-world business and technical requirements.
            </p>
          </div>

          {/* Deloitte Intern Experience */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              🏢 Deloitte Intern Experience
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Worked in a professional consulting environment, gaining exposure to
              enterprise workflows, teamwork, and production-level development standards.
            </p>
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">🛠 Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "React.js",
                "HTML",
                "CSS",
                "JavaScript",
                "Node.js",
                "SQL",
                "Git & GitHub",
                "REST APIs"
              ].map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          NEW ROW — THREE NEW DEVELOPERS
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-10">
        
        {/* Developer 1: Varshith Reddy */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl text-center space-y-6">
          <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
            <img
              src={"https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919878/VARSHITH_djjuas.jpg"}
              alt="Varshith Reddy"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="inline-block px-4 py-1 mb-3 rounded-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/30 text-emerald-300 text-sm font-semibold">
            Full Stack Developer
          </span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Varshith Reddy
          </h2>
          <p className="text-slate-400 mt-3 leading-relaxed">
            Passionate full-stack developer with expertise in modern web technologies,
            focused on building seamless user experiences and robust backend systems.
          </p>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">🛠 Technical Skills</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {["React.js", "Node.js", "Python", "MongoDB", "Tailwind CSS", "Express.js"].map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Developer 2: Rohith Kumar */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl text-center space-y-6">
          <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
            <img
              src={"https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919879/rohith_szve4v.jpg"}
              alt="Rohith Kumar"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="inline-block px-4 py-1 mb-3 rounded-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/30 text-emerald-300 text-sm font-semibold">
            Backend Specialist
          </span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Rohith Kumar
          </h2>
          <p className="text-slate-400 mt-3 leading-relaxed">
            Backend-focused developer skilled in API design, database management,
            and scalable server-side architecture for high-performance applications.
          </p>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">🛠 Technical Skills</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Java", "Spring Boot", "PostgreSQL", "Docker", "AWS", "REST APIs"].map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Developer 3: Hebbare Likith */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-xl text-center space-y-6">
          <div className="w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-slate-700 mb-4">
            <img
              src={"https://res.cloudinary.com/dunrzq7tv/image/upload/v1775919879/likith_qlhzbb.jpg"}
              alt="Hebbare Likith"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="inline-block px-4 py-1 mb-3 rounded-full bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-600/30 text-emerald-300 text-sm font-semibold">
            Frontend Developer
          </span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
            Hebbare Likith
          </h2>
          <p className="text-slate-400 mt-3 leading-relaxed">
            Creative frontend developer passionate about responsive design,
            interactive UI components, and delivering pixel-perfect user interfaces.
          </p>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4">🛠 Technical Skills</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Figma", "Redux"].map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AboutDeveloper;
