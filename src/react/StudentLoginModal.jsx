import React, { useState } from 'react';

export default function StudentLoginModal({ isOpen, onClose, onLogin, currentUser }) {
  const [loginMethod, setLoginMethod] = useState('roll'); // 'roll' | 'phone'
  const [studentId, setStudentId] = useState('GU24-CSE-1042');
  const [studentName, setStudentName] = useState('Aarav Sharma');
  const [phone, setPhone] = useState('9876543210');
  const [department, setDepartment] = useState('School of Computer Science & AI');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyAndLogin = (e) => {
    e.preventDefault();
    const studentUser = {
      id: studentId || `GU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: studentName || 'GU Student',
      phone: phone,
      department: department,
      avatar: '👨‍🎓',
      walletBalance: 120, // Free campus shuttle ride credits
      rating: 4.9
    };
    onLogin(studentUser);
    onClose();
  };

  const handleQuickStudent = (name, id, dept) => {
    const studentUser = {
      id: id,
      name: name,
      phone: '9812345678',
      department: dept,
      avatar: '🎓',
      walletBalance: 150,
      rating: 5.0
    };
    onLogin(studentUser);
    onClose();
  };

  return (
    <div className="modal-backdrop active" style={{ zIndex: 3000 }}>
      <div className="modal-window rapido-login-window">
        {/* Modal Top Header */}
        <div className="rapido-header">
          <div className="rapido-brand-pill">
            <span className="rapido-badge">GU RAPIDO RIDER</span>
            <h3>Geeta University Transit Access</h3>
            <p>Single Sign-On (SSO) with GU eFlow ERP & Student Roll Number</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {currentUser ? (
            <div className="logged-in-profile-box">
              <div className="profile-top">
                <div className="profile-avatar">{currentUser.avatar}</div>
                <div>
                  <h4>{currentUser.name}</h4>
                  <span className="profile-roll">{currentUser.id}</span>
                  <div className="profile-dept">{currentUser.department}</div>
                </div>
              </div>

              <div className="rapido-wallet-card">
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>GU Ride Credits</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#012e55' }}>
                    🪙 {currentUser.walletBalance} pts
                  </div>
                </div>
                <div className="rapido-tier-badge">⭐ Gold Campus Rider</div>
              </div>

              <button
                className="btn-danger"
                style={{ width: '100%', padding: '0.6rem', marginTop: '1rem', fontWeight: 700 }}
                onClick={() => onLogin(null)}
              >
                Sign Out / Switch Student
              </button>
            </div>
          ) : (
            <div>
              {/* Login Method Toggle */}
              <div className="rapido-toggle-tabs">
                <button
                  type="button"
                  className={`rapido-tab ${loginMethod === 'roll' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('roll')}
                >
                  🎓 University Roll Number (ERP)
                </button>
                <button
                  type="button"
                  className={`rapido-tab ${loginMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('phone')}
                >
                  📱 Mobile & OTP (Rapido Style)
                </button>
              </div>

              {loginMethod === 'roll' ? (
                <form onSubmit={handleVerifyAndLogin} className="rapido-form">
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">GU Roll No / Student ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g. GU24-CSE-1042"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Department / School</label>
                    <select
                      className="form-select"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                    >
                      <option value="School of Computer Science & AI">School of Computer Science & AI</option>
                      <option value="Geeta Institute of Pharmacy">Geeta Institute of Pharmacy</option>
                      <option value="S.P. Bansal School of Business">S.P. Bansal School of Business</option>
                      <option value="Geeta Global Law School">Geeta Global Law School</option>
                      <option value="School of Engineering & Robotics">School of Engineering & Robotics</option>
                      <option value="School of Agricultural Sciences">School of Agricultural Sciences</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.65rem', justifyContent: 'center', fontSize: '0.9rem' }}
                  >
                    🚀 Enter CampusPool as Student
                  </button>
                </form>
              ) : (
                <form onSubmit={otpSent ? handleVerifyAndLogin : handleSendOtp} className="rapido-form">
                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <label className="form-label">Registered Student Mobile Number</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="country-code">+91</span>
                      <input
                        type="tel"
                        className="form-input"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="10 digit mobile"
                        maxLength="10"
                        required
                        disabled={otpSent}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label">Enter 4-Digit OTP</label>
                        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>OTP sent: 4242 (Auto-filled)</span>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        value={otp || '4242'}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="4242"
                        maxLength="4"
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 800 }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.65rem', justifyContent: 'center', fontSize: '0.9rem' }}
                  >
                    {otpSent ? '✅ Verify & Login' : '📩 Request OTP (Fast Access)'}
                  </button>
                </form>
              )}

              {/* Fast 1-Click Demo Profiles */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
                  ⚡ Quick Demo Student Profiles:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-preset"
                    onClick={() => handleQuickStudent('Priya Verma', 'GU24-PHARM-203', 'Geeta Institute of Pharmacy')}
                  >
                    👩‍🎓 Priya Verma (Pharmacy)
                  </button>
                  <button
                    type="button"
                    className="btn-preset"
                    onClick={() => handleQuickStudent('Rahul Tanwar', 'GU24-CSE-118', 'School of Computer Science & AI')}
                  >
                    👨‍🎓 Rahul Tanwar (CSE AI)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
