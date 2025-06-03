import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NightBusForm from './components/forms/NightBusForm';
import AccommodationForm from './components/forms/AccommodationForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BudgetForm from './components/forms/BudgetForm';
import SharePage from './components/shared/SharePage';
import SharedView from './components/shared/SharedView';
import 'react-day-picker/dist/style.css';

const Home: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-2xl font-bold">ホームページへようこそ！</div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/nightbus" 
          element={
            <ProtectedRoute>
              <NightBusForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/accommodation" 
          element={
            <ProtectedRoute>
              <AccommodationForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/budget" 
          element={
            <ProtectedRoute>
              <BudgetForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/share" 
          element={
            <ProtectedRoute>
              <SharePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/shared" element={<SharedView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
