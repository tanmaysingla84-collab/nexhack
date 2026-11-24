import React, { useState } from 'react';

export default function LoginPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'fleet' | 'admin'
  const [identifier, setIdentifier] = useState('GU24-CSE-1042');
  const [mobile, setMobile] = useState('9876543210');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickDemo = (name, rollNo, roleTitle) => {
    onLoginSuccess({
      name,
      id: rollNo,
      department: 'School of Computer Science & AI',
      role: activeTab,
      avatar: activeTab === 'student' ? '🎓' : (activeTab === 'fleet' ? '🚐' : '🛡️'),
      walletBalance: 160,
      rating: 4.95
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: identifier.includes('1042') ? 'Aarav Sharma' : 'GU Campus User',
        id: identifier.toUpperCase(),
        department: 'School of Computer Science & Engineering',
        role: activeTab,
        avatar: activeTab === 'student' ? '🎓' : (activeTab === 'fleet' ? '🚐' : '🛡️'),
        walletBalance: 150,
        rating: 5.0
      });
    }, 450);
  };

  return (
    <div className="new-login-wrapper">
      {/* Dynamic Animated Background Mesh */}
      <div className="mesh-gradient-bg"></div>
      <div className="glowing-orb orb-1"></div>
      <div className="glowing-orb orb-2"></div>
      <div className="glowing-orb orb-3"></div>

      <div className="new-login-modal-card">
        {/* Top Floating Brand Pill */}
        <div className="brand-header-strip">
          <div className="gu-crest-squircle">GU</div>
          <div>
            <div className="brand-title-bold">GEETA UNIVERSITY</div>
            <div className="brand-caption-tiny">TRANSIT OS • RAPIDO POOLING PLATFORM</div>
          </div>
          <span className="live-status-pill">
            <span className="live-dot-green"></span>
            SHUTTLES LIVE
          </span>
        </div>

        {/* Hero Prompt */}
        <div className="login-hero-block">
          <h1 className="hero-punchline">
            Your Campus Ride, <span className="gradient-highlight">On Demand.</span>
          </h1>
          <p className="hero-subtext">
            Smart algorithmically pooled shuttles across Geeta University's 40-acre campus. Zero wait, zero emissions.
          </p>
        </div>

        {/* Persona Selector Tabs (Student vs Shuttle Captain vs Admin) */}
        <div className="persona-nav-bar">
          <button
            type="button"
            className={`persona-pill ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span>👨‍🎓</span>
            <span>Student Rider</span>
          </button>
          <button
            type="button"
            className={`persona-pill ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            <span>🚐</span>
            <span>Shuttle Captain</span>
          </button>
          <button
            type="button"
            className={`persona-pill ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <span>🛡️</span>
            <span>Transport Admin</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLoginSubmit} className="modern-glass-form">
          <div className="glass-input-row">
            <label className="field-label">
              {activeTab === 'student' ? 'University Roll No / ERP ID' : (activeTab === 'fleet' ? 'Captain ID / Vehicle No' : 'Admin Passcode')}
            </label>
            <div className="field-input-box">
              <span className="field-icon">
                {activeTab === 'student' ? '🎓' : (activeTab === 'fleet' ? '🚐' : '🔑')}
              </span>
              <input
                type="text"
                className="glass-text-input"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={activeTab === 'student' ? 'e.g. GU24-CSE-1042' : 'e.g. GU-DRIVER-01'}
                required
              />
            </div>
          </div>

          <div className="glass-input-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="field-label">Registered Phone / OTP</label>
              <button
                type="button"
                className="otp-toggle-btn"
                onClick={() => setOtpMode(!otpMode)}
              >
                {otpMode ? 'Use Password' : 'Login via 1-Click OTP 📱'}
              </button>
            </div>

            <div className="field-input-box">
              <span className="field-icon">📱</span>
              <input
                type={otpMode ? 'number' : 'text'}
                className="glass-text-input"
                value={otpMode ? (otp || '4242') : mobile}
                onChange={e => otpMode ? setOtp(e.target.value) : setMobile(e.target.value)}
                placeholder={otpMode ? '4-Digit OTP' : '10-digit mobile number'}
                required
              />
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            type="submit"
            className="rapido-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Connecting to Campus Transit...</span>
            ) : (
              <>
                <span>Launch GU Transit Map</span>
                <span className="arrow-badge">➔</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Instant Demo Credentials for Hackathon Presentation */}
        <div className="instant-demo-strip">
          <span className="demo-caption-title">⚡ Fast 1-Click Presenter Access:</span>
          <div className="demo-chips-grid">
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickDemo('Aarav Sharma', 'GU24-CSE-1042', 'student')}
            >
              🎓 Aarav (Student - Tagore Hall)
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickDemo('Priya Verma', 'GU24-PHARM-203', 'student')}
            >
              👩‍🎓 Priya (Student - Gargi Hall)
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickDemo('Captain Jagdish', 'GU-V1-DRIVER', 'fleet')}
            >
              🚐 Shuttle V1 Captain
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickDemo('Transport Director', 'GU-ADMIN-01', 'admin')}
            >
              🛡️ Transport Control Officer
            </button>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="bottom-perks-row">
          <div className="perk-tag">
            <span>⚡</span>
            <span>Sub-3min Pickup</span>
          </div>
          <div className="perk-tag">
            <span>🌱</span>
            <span>100% Electric Campus Fleet</span>
          </div>
          <div className="perk-tag">
            <span>🤝</span>
            <span>No Silent Drops Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
