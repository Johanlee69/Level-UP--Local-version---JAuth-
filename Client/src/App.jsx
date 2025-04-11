import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Components/Login_page/Login';
import StartUP from './Components/Startup/StartUP';
import Homepage from './Components/Homepage/Homepage';
import Layout from './Components/layout/Layout';
import ProtectedRoute from './Components/ProtectedRoute';
import './global.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/startup" element={<StartUP />} />

      {/* Protected routes */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Layout toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}>
            <Homepage initialTab="daily" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <Layout toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}>
            <Homepage initialTab="calendar" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/custom" element={
        <ProtectedRoute>
          <Layout toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}>
            <Homepage initialTab="custom" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/performance" element={
        <ProtectedRoute>
          <Layout toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen}>
            <Homepage initialTab="performance" />
          </Layout>
        </ProtectedRoute>
      } />

      {/* 404 route */}
      <Route path="*" element={
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">404</h1>
            <p className="text-gray-300 mb-6">Page not found</p>
            <Link to="/home" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500">
              Go Home
            </Link>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
