// About.jsx - Complete Tailwind CSS Version
import React, { useState, useEffect } from 'react';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTeamMember, setActiveTeamMember] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Document Upload',
      description: 'Support for various file formats including text, PDF, and Word documents with smart validation'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M4 7V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V7" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 17V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V17" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 12H20" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Text Processing',
      description: 'Advanced text chunking and analysis for better AI comprehension and faster results'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 15L8 11L16 11L12 15Z" fill="currentColor"/>
          <path d="M2 12C2 6.48 6.48 2 12 2S22 6.48 22 12 17.52 22 12 22 2 17.52 2 12Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Secure Sessions',
      description: 'Each user session is isolated using secure JWT tokens for maximum privacy protection'
    },
    {
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Fast Processing',
      description: 'Efficient document processing and storage using vector databases for lightning-fast responses'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Content',
      description: 'Upload your document or paste text directly into our intelligent interface',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2"/>
          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our advanced AI processes and chunks your content for optimal analysis and understanding',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      number: '03',
      title: 'Secure Storage',
      description: 'Documents are securely stored with session-based isolation ensuring complete privacy',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      number: '04',
      title: 'Interactive Chat',
      description: 'Start chatting with your documents using our intelligent AI interface for instant insights',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.60573 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    }
  ];

  // Team Members Data
  const teamMembers = [
    {
      id: 1,
      name: 'Akshay Kireet',
      role: 'Frontend Developer',
      specialty: 'Langchain Developer',
      bio: 'Akshay Kireet is frontend developer with a passion for building intuitive user interfaces. He specializes in ReactJS and Langchain to create seamless user experiences.',
      image: 'https://res.cloudinary.com/dadapse5k/image/upload/v1758006505/Akshay_ivg3og.png',
      skills: ['ReactJS', 'Langchain', 'FastAPI', 'Pandas'],
      social: {
        linkedin: 'https://linkedin.com/in/alex-rodriguez',
        github: 'https://github.com/alex-rodriguez',
        twitter: 'https://twitter.com/alex_ai'
      }
    },
    {
      id: 2,
      name: 'M Saiteja',
      role: 'ML Developer',
      specialty: 'Machine Learning & AI',
      bio: 'M Saiteja is a skilled machine learning developer specializing in ML. He has a strong background in data science and a passion for creating intelligent systems.',
      image: 'https://res.cloudinary.com/dadapse5k/image/upload/v1758006489/saiteja_dzj2gn.jpg',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn'],
      social: {
        linkedin: 'https://linkedin.com/in/sarah-chen',
        github: 'https://github.com/sarah-chen',
        twitter: 'https://twitter.com/sarah_codes'
      }
    },
    {
      id: 3,
      name: 'Shek Shahid',
      role: 'Backend Developer',
      specialty: 'FastAPI',
      bio: 'Shahid ensures our platform runs smoothly with enterprise-grade security. He manages our cloud infrastructure',
      image: 'https://res.cloudinary.com/dadapse5k/image/upload/v1758006488/shahid_zwaukj.jpg',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
      social: {
        linkedin: 'https://linkedin.com/in/marcus-johnson',
        github: 'https://github.com/marcus-devops',
        twitter: 'https://twitter.com/marcus_cloud'
      }
    },
    {
      id: 4,
      name: 'Dheeraj Rao',
      role: 'Langchain Developer',
      specialty: 'Langchain & AI Integration',
      bio: 'Dheeraj is a langchain developer with a knack for integrating AI into user-friendly applications. He focuses on creating seamless user experiences.',
      image: 'https://res.cloudinary.com/dadapse5k/image/upload/v1758006515/Dheeraj_tepaci.jpg',
      skills: ['Langchain', 'JavaScript', 'Pandas', 'NumPy'],
      social: {
        linkedin: 'https://linkedin.com/in/emma-watson-design',
        github: 'https://github.com/emma-designs',
        twitter: 'https://twitter.com/emma_ux'
      }
    },
    {
      id: 5,
      name: 'Sai Ganesh',
      role: 'Deployment Engineer',
      specialty: 'Cloud Infrastructure',
      bio: 'Sai Ganesh is a deployment engineer who specializes in cloud infrastructure. He ensures our platform is scalable and reliable.',
      image: 'https://res.cloudinary.com/dadapse5k/image/upload/v1758006710/Screenshot_2025-09-16_124130_xm6p41.png',
      skills: ['AWS', 'CI/CD', 'Docker', 'Linux'],
      social: {
        linkedin: 'https://linkedin.com/in/david-kim-pm',
        github: 'https://github.com/david-pm',
        twitter: 'https://twitter.com/david_product'
      }
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-1 bg-slate-800/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 relative"
          style={{ width: `${scrollProgress}%` }}
        >
          <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-2000 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 backdrop-blur-sm border border-blue-500/30 rounded-full mb-8 animate-bounce-slow">
            <div className="w-5 h-5 text-blue-400">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-blue-400 font-semibold">Revolutionizing Legal Analysis</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 leading-tight">
            Revolutionizing document interaction through{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              cutting-edge artificial intelligence
            </span>{' '}
            and natural language processing technology
          </h1>

          <div className="flex justify-center gap-8 text-center">
            {[
              { number: '10K+', label: 'Documents Analyzed' },
              { number: '99.9%', label: 'Accuracy Rate' },
              { number: '50+', label: 'Languages Supported' }
            ].map((stat, index) => (
              <div key={index} className="flex flex-col">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-xl text-slate-300 leading-relaxed">
                  <strong className="text-white">Accord AI</strong> is an{' '}
                  <strong className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    intelligent document processing platform
                  </strong>{' '}
                  that allows you to upload, analyze, and interact with your documents using advanced AI technology.
                </p>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Our platform uses cutting-edge natural language processing to understand and extract insights from your documents.
                </p>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Built with enterprise-grade security and powered by state-of-the-art machine learning models,
                  Accord AI transforms the way you work with documents, making information retrieval{' '}
                  <strong className="text-green-400">instant, accurate, and intuitive</strong>.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center animate-float shadow-2xl shadow-blue-500/50">
                    <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-3xl blur-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
              <span className="text-blue-400 font-semibold uppercase tracking-wide text-sm">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Discover the advanced capabilities
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              that make Accord AI the perfect solution for intelligent document processing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 ${
                  activeFeature === index ? 'border-blue-500/50 bg-blue-500/10' : ''
                }`}
                onClick={() => setActiveFeature(index)}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
              <span className="text-purple-400 font-semibold uppercase tracking-wide text-sm">Process</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Get started in four simple steps
            </h2>
            <p className="text-xl text-slate-400">
              and experience the future of document intelligence
            </p>
          </div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-8">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                      {step.number}
                    </div>
                    <div className="w-16 h-16 bg-slate-800/60 border border-blue-500/30 rounded-xl flex items-center justify-center">
                      <div className="text-blue-400">
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
                <span className="text-green-400 font-semibold uppercase tracking-wide text-sm">Team</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Meet Our Expert Team
              </h2>
              <p className="text-xl text-slate-400">
                Our diverse team of experts combines years of experience in AI, development, design, and product strategy
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id}
                  className="group bg-slate-900/60 border border-slate-600/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  {/* Member Image */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-4 border-blue-500/50 group-hover:border-blue-400 transition-colors">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-blue-400 font-semibold mb-1">
                      {member.role}
                    </p>
                    <p className="text-slate-400 text-sm mb-4">
                      {member.specialty}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {member.skills.slice(0, 3).map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 3 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full">
                          +{member.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl shadow-green-500/50">
                    <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className={`absolute inset-0 border-2 border-green-500/30 rounded-3xl animate-ping`}
                      style={{ animationDelay: `${i * 0.5}s`, animationDuration: '2s' }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
                    <span className="text-green-400 font-semibold uppercase tracking-wide text-sm">Security</span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Enterprise-Grade Security
                  </h2>
                  <p className="text-xl text-slate-300 leading-relaxed mb-8">
                    We take your privacy seriously. Each session is completely isolated using{' '}
                    <strong className="text-green-400">secure JWT tokens</strong>, ensuring that your documents are never mixed
                    with other users' content. Your session data is automatically managed and secured
                    with enterprise-grade encryption.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: '🔐', text: 'End-to-end encryption' },
                    { icon: '🛡️', text: 'Session isolation' },
                    { icon: '🔒', text: 'Secure data storage' },
                    { icon: '✅', text: 'GDPR compliant' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-slate-600/50 rounded-xl hover:border-green-500/50 transition-all duration-300 hover:translate-x-2">
                      <span className="text-2xl">{feature.icon}</span>
                      <span className="text-white font-semibold">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Transform Your Legal Workflow
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of users who have already transformed their document workflow with Accord AI's intelligent processing capabilities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/50">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                </svg>
                <span>Get Started Free</span>
              </div>
            </button>

            <button className="group bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-blue-500/50 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>View Demo</span>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
