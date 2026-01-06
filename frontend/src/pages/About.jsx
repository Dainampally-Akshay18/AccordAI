import React from "react";

const AboutDeveloper = () => {
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
    </section>
  );
};

export default AboutDeveloper;
