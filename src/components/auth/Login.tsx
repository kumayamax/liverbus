import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { message?: string };
    if (state?.message) {
      setInfo(state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/nightbus');
    } catch (err: any) {
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('メールアドレスを入力してください。');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('パスワードリセットのメールを送信しました。メールボックスでご確認ください。');
      setError('');
    } catch (err: any) {
      setError('パスワードリセットメールの送信に失敗しました。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-4xl h-[600px] bg-white rounded-lg shadow-lg flex overflow-hidden relative">
        <div className="absolute top-8 left-8 flex items-center z-10">
          <img src="/bus.png" alt="logo" className="h-6 w-11 mr-4" />
          <span className="font-bold text-lg">Live Bus Planner</span>
        </div>
        <div className="w-1/2 flex flex-col justify-center items-center min-h-[32rem]">
          <div className="w-full max-w-xs">
            <h2 className="text-center text-lg font-semibold mb-8 mt-12">ログイン</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-1">メールアドレス</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
              </div>
              <div>
                <label className="block text-sm mb-1">パスワード</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
              </div>
              <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition">ログイン</button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              {info && <div className="text-green-600 text-sm mt-2">{info}</div>}
            </form>
            <div className="mt-4 text-center text-sm space-y-2">
              <div>
                まだ登録していない？<a href="/register" className="text-blue-700 hover:underline ml-1">登録</a>
              </div>
              <div>
                <button onClick={handleResetPassword} className="text-blue-700 hover:underline">パスワードをお忘れですか？</button>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 h-full bg-blue-300">
          {/* <img src="/bus_night.jpg" alt="background" className="w-full h-full object-cover rounded-r-lg blur-xs" /> */}
        </div>
      </div>
    </div>
  );
};

export default Login; 