import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 🔥 UPDATE: Netlify link hata kar sirf relative path likha hai
        const backendURL = '/api/auth'; 
        
        try {
            const response = await fetch(backendURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: username || 'Team Member', 
                    email: email, 
                    password: password, // 🔥 UPDATE: Yeh missing tha, iske bina login/signup fail hota
                    role: 'User' 
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Something went wrong');

            // Token aur user info save karna
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.name);
            onLoginSuccess(data); // App ko batana ki login ho gaya
            
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Server se connect nahi ho paaya. Kripya apna Render link check karein.');
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '350px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
                {error && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center', background: '#fee2e2', padding: '10px', borderRadius: '5px' }}>{error}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="text" placeholder="Your Name" value={username} 
                        onChange={(e) => setUsername(e.target.value)} required 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    
                    <input 
                        type="email" placeholder="Email Address" value={email} 
                        onChange={(e) => setEmail(e.target.value)} required 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    
                    <input 
                        type="password" placeholder="Password" value={password} 
                        onChange={(e) => setPassword(e.target.value)} required 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    
                    <button type="submit" style={{ padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                        {isSignup ? 'Sign Up' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px', cursor: 'pointer', color: '#4f46e5', fontWeight: '600' }} onClick={() => {setIsSignup(!isSignup); setError('');}}>
                    {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </p>
            </div>
        </div>
    );
}

export default Login;