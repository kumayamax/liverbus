import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyDxQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ",
  authDomain: "livebus-planner.firebaseapp.com",
  projectId: "livebus-planner",
  storageBucket: "livebus-planner.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890123456789012"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const sendEmail = httpsCallable(functions, 'sendEmail');
      await sendEmail(formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>联系我们</h1>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="您的姓名"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="您的邮箱"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="您的电话"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="您的留言"
              required
            />
          </div>
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? '发送中...' : '发送'}
          </button>
          {status === 'success' && <p className="success">发送成功！</p>}
          {status === 'error' && <p className="error">发送失败，请重试</p>}
        </form>
      </header>
    </div>
  );
}

export default App; 