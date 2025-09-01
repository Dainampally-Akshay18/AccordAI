import React, { useState, useEffect } from 'react'
import './About.css'

const About = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeTeamMember, setActiveTeamMember] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      ),
      title: 'Document Upload',
      description: 'Support for various file formats including text, PDF, and Word documents with smart validation'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      ),
      title: 'Text Processing',
      description: 'Advanced text chunking and analysis for better AI comprehension and faster results'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
      title: 'Secure Sessions',
      description: 'Each user session is isolated using secure JWT tokens for maximum privacy protection'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="10,8 16,12 10,16"></polyline>
        </svg>
      ),
      title: 'Fast Processing',
      description: 'Efficient document processing and storage using vector databases for lightning-fast responses'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload Content',
      description: 'Upload your document or paste text directly into our intelligent interface',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
      )
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our advanced AI processes and chunks your content for optimal analysis and understanding',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      )
    },
    {
      number: '03',
      title: 'Secure Storage',
      description: 'Documents are securely stored with session-based isolation ensuring complete privacy',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <circle cx="12" cy="16" r="1"></circle>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      number: '04',
      title: 'Interactive Chat',
      description: 'Start chatting with your documents using our intelligent AI interface for instant insights',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      )
    }
  ]

  // Team Members Data
  const teamMembers = [
    {
      id: 1,
      name: 'Akshay Kireet',
      role: 'Frontend Developer',
      specialty: 'Langchain Developer',
      bio: 'Akshay Kireet is frontend developer with a passion for building intuitive user interfaces. He specializes in ReactJS and Langchain to create seamless user experiences.',
      image: 'https://w0.peakpx.com/wallpaper/166/790/HD-wallpaper-virat-kohli.jpg',
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
      image: 'https://cdn.punchng.com/wp-content/uploads/2023/09/01133700/Ronaldo.jpeg',
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
      bio: 'Marcus ensures our platform runs smoothly with enterprise-grade security. He manages our cloud infrastructure and CI/CD pipelines.',
      image: 'https://documents.iplt20.com/ipl/IPLHeadshot2024/6.png',
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
      role: 'Langchain Developer ',
      specialty: 'Langchain & AI Integration',
      bio: 'Dheeraj is a langchain developer with a knack for integrating AI into user-friendly applications. He focuses on creating seamless user experiences.',
      image: 'https://www.sportzcraazy.com/wp-content/uploads/2020/02/ms-dhoni.jpeg',
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
      image: 'https://english.cdn.zeenews.com/sites/default/files/2022/12/14/1129224-gallerymessi1.jpg',
      skills: ['AWS', 'CI/CD', 'Docker', 'Linux'],
      social: {
        linkedin: 'https://linkedin.com/in/david-kim-pm',
        github: 'https://github.com/david-pm',
        twitter: 'https://twitter.com/david_product'
      }
    }
  ]

  return (
    <div className="about-page">
      {/* Progress Bar */}
      <div className="scroll-progress">
        <div 
          className="progress-fill" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Animated Background */}
      <div className="about-background">
        <div className="gradient-mesh"></div>
        <div className="floating-elements">
          <div className="element element-1"></div>
          <div className="element element-2"></div>
          <div className="element element-3"></div>
          <div className="element element-4"></div>
          <div className="element element-5"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`about-container ${isVisible ? 'visible' : ''}`}>
        
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <span>AI-Powered Document Intelligence</span>
            </div>
            <h1 className="hero-title">
              About <span className="title-accent">Accord AI</span>
            </h1>
            <p className="hero-subtitle">
              Revolutionizing document interaction through cutting-edge artificial intelligence 
              and natural language processing technology
            </p>
           
          </div>
        </section>

        {/* What is Accord AI Section */}
        <section className="content-section intro-section">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <span>Platform Overview</span>
              </div>
              <h2 className="section-title">What is Accord AI?</h2>
            </div>
            <div className="intro-content">
              <div className="intro-text">
                <p className="intro-paragraph">
                  Accord AI is an <strong>intelligent document processing platform</strong> that allows you to upload, 
                  analyze, and interact with your documents using advanced AI technology. Our platform 
                  uses cutting-edge natural language processing to understand and extract insights from your documents.
                </p>
                <p className="intro-paragraph">
                  Built with enterprise-grade security and powered by state-of-the-art machine learning models, 
                  Accord AI transforms the way you work with documents, making information retrieval 
                  <strong> instant, accurate, and intuitive</strong>.
                </p>
              </div>
              <div className="intro-visual">
                <div className="visual-container">
                  <div className="visual-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div className="visual-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
            <br /><br />
        {/* Features Section */}
        <section className="content-section features-section">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <span>Core Capabilities</span>
              </div>
              <h2 className="section-title">Powerful Features</h2>
              <p className="section-subtitle">
                Discover the advanced capabilities that make Accord AI the perfect solution 
                for intelligent document processing
              </p>
            </div>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <div className="feature-content">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                  <div className="feature-glow"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="content-section process-section">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <span>Simple Process</span>
              </div>
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">
                Get started with Accord AI in four simple steps and experience 
                the future of document intelligence
              </p>
            </div>
            <div className="process-timeline">
              {steps.map((step, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="marker-number">{step.number}</div>
                    <div className="marker-icon">
                      {step.icon}
                    </div>
                  </div>
                  <div className="timeline-content">
                    <h3 className="timeline-title">{step.title}</h3>
                    <p className="timeline-description">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && <div className="timeline-connector"></div>}
                </div>
              ))}
            </div>
          </div>
        </section>
        <br /><br />
        {/* Team Section */}
        <section className="content-section team-section">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <span>Meet Our Team</span>
              </div>
              <h2 className="section-title">The Minds Behind AccordAI</h2>
              <p className="section-subtitle">
                Our diverse team of experts combines years of experience in AI, development, 
                design, and product strategy to deliver exceptional results
              </p>
            </div>

            {/* Team Grid */}
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id}
                  className={`team-card ${activeTeamMember === index ? 'active' : ''}`}
                  onMouseEnter={() => setActiveTeamMember(index)}
                >
                  <div className="team-card-inner">
                    {/* Front of card */}
                    <div className="team-card-front">
                      <div className="member-image-container">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="member-image"
                        />
                        <div className="image-overlay">
                          <div className="overlay-content">
                            <span>View Details</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 8v8"></path>
                              <path d="M8 12h8"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="member-info">
                        <h3 className="member-name">{member.name}</h3>
                        <p className="member-role">{member.role}</p>
                        <p className="member-specialty">{member.specialty}</p>
                        <div className="member-skills">
                          {member.skills.slice(0, 3).map((skill, skillIndex) => (
                            <span key={skillIndex} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="skill-more">+{member.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Back of card */}
                    <div className="team-card-back">
                      <div className="member-bio-section">
                        <div className="bio-header">
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="bio-image"
                          />
                          <div className="bio-title">
                            <h3>{member.name}</h3>
                            <p>{member.role}</p>
                          </div>
                        </div>
                        <div className="member-bio">
                          <p>{member.bio}</p>
                        </div>
                        <div className="member-skills-full">
                          <h4>Expertise</h4>
                          <div className="skills-list">
                            {member.skills.map((skill, skillIndex) => (
                              <span key={skillIndex} className="skill-tag-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="team-card-glow"></div>
                </div>
              ))}
            </div>

            
          </div>
        </section>
              <br /><br />
        {/* Privacy & Security Section */}
        <section className="content-section security-section">
          <div className="section-container">
            <div className="security-content">
              <div className="security-visual">
                <div className="security-shield">
                  <div className="shield-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <path d="M9 12l2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="shield-rings">
                    <div className="ring ring-1"></div>
                    <div className="ring ring-2"></div>
                    <div className="ring ring-3"></div>
                  </div>
                </div>
              </div>
              <div className="security-text">
                <div className="section-badge">
                  <span>Enterprise Security</span>
                </div>
                <h2 className="section-title">Privacy & Security</h2>
                <p className="security-description">
                  We take your privacy seriously. Each session is completely isolated using 
                  <strong> secure JWT tokens</strong>, ensuring that your documents are never mixed 
                  with other users' content. Your session data is automatically managed and secured 
                  with enterprise-grade encryption.
                </p>
                <div className="security-features">
                  <div className="security-feature">
                    <div className="security-feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <circle cx="12" cy="16" r="1"></circle>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <span>End-to-End Encryption</span>
                  </div>
                  <div className="security-feature">
                    <div className="security-feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                    </div>
                    <span>Session Isolation</span>
                  </div>
                  <div className="security-feature">
                    <div className="security-feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </div>
                    <span>Auto Data Management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Experience the Future?</h2>
              <p className="cta-description">
                Join thousands of users who have already transformed their document workflow 
                with Accord AI's intelligent processing capabilities.
              </p>
              <div className="cta-buttons">
                <button className="cta-primary">
                  <span>Get Started Now</span>
                  <div className="button-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12,5 19,12 12,19"></polyline>
                    </svg>
                  </div>
                </button>
                
              </div>
            </div>
            <div className="cta-visual">
              <div className="visual-grid">
                <div className="grid-item item-1"></div>
                <div className="grid-item item-2"></div>
                <div className="grid-item item-3"></div>
                <div className="grid-item item-4"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
