import React, { useState } from 'react';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔥 SINGLE PLATFORM MAGIC: Ab frontend aur backend ek hi jagah hain
      // Toh humein lamba link nahi likhna, sirf rasta (route) batana hai
      const backendURL = '/api/auth';
      
      const response = await fetch(backendURL,  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
      }

      // ✅ SUCCESS
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.name);
      
      onLoginSuccess({ token: data.token, username: data.user.name });

    } catch (err) {
      // ❌ ERROR
      if (err.message === 'Failed to fetch') {
        setError('Connection Failed: Backend server se jud nahi paaya. Link check karein ya thoda wait karein.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F5F7', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      
      {/* Left Side - Graphics/Info */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0052CC 0%, #2C82C9 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', padding: '40px' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <LayoutDashboard size={48} color="#fff" />
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', textAlign: 'center' }}>Apex Workspace</h1>
        <p style={{ fontSize: '18px', textAlign: 'center', opacity: 0.9, maxWidth: '400px', lineHeight: '1.6' }}>
          AI-Powered Kanban Board. Manage your projects, track bugs, and collaborate in real-time.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#172B4D', marginBottom: '8px' }}>
            {isLoginView ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p style={{ color: '#5E6C84', marginBottom: '32px' }}>
            {isLoginView ? 'Please enter your details to sign in.' : 'Sign up to start managing your projects.'}
          </p>

          {/* DYNAMIC ERROR MESSAGE BOX */}
          {error && (
            <div style={{ background: '#FFEBE6', color: '#DE350B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name Field - Only for Register */}
            {!isLoginView && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required={!isLoginView} placeholder="Himanshi Shakya" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', transition: '0.2s', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ background: '#0052CC', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : (isLoginView ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={20} />}
            </button>

          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#5E6C84' }}>
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); setFormData({name: '', email: '', password: ''}); }} 
              style={{ color: '#0052CC', fontWeight: '700', cursor: 'pointer' }}
            >
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}import React, { useState } from 'react';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔥 SINGLE PLATFORM MAGIC: Ab frontend aur backend ek hi jagah hain
      // Toh humein lamba link nahi likhna, sirf rasta (route) batana hai
      const backendURL = '/api/auth';
      
      const response = await fetch(backendURL,  {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
      }

      // ✅ SUCCESS
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user.name);
      
      onLoginSuccess({ token: data.token, username: data.user.name });

    } catch (err) {
      // ❌ ERROR
      if (err.message === 'Failed to fetch') {
        setError('Connection Failed: Backend server se jud nahi paaya. Link check karein ya thoda wait karein.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F5F7', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      
      {/* Left Side - Graphics/Info */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0052CC 0%, #2C82C9 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', padding: '40px' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <LayoutDashboard size={48} color="#fff" />
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', textAlign: 'center' }}>Apex Workspace</h1>
        <p style={{ fontSize: '18px', textAlign: 'center', opacity: 0.9, maxWidth: '400px', lineHeight: '1.6' }}>
          AI-Powered Kanban Board. Manage your projects, track bugs, and collaborate in real-time.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#172B4D', marginBottom: '8px' }}>
            {isLoginView ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p style={{ color: '#5E6C84', marginBottom: '32px' }}>
            {isLoginView ? 'Please enter your details to sign in.' : 'Sign up to start managing your projects.'}
          </p>

          {/* DYNAMIC ERROR MESSAGE BOX */}
          {error && (
            <div style={{ background: '#FFEBE6', color: '#DE350B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name Field - Only for Register */}
            {!isLoginView && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required={!isLoginView} placeholder="Himanshi Shakya" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', transition: '0.2s', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#5E6C84', marginBottom: '8px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#8993A4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px', border: '2px solid #DFE1E6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ background: '#0052CC', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : (isLoginView ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight size={20} />}
            </button>

          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#5E6C84' }}>
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <span 
              onClick={() => { setIsLoginView(!isLoginView); setError(''); setFormData({name: '', email: '', password: ''}); }} 
              style={{ color: '#0052CC', fontWeight: '700', cursor: 'pointer' }}
            >
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}