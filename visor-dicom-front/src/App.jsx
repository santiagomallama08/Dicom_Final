// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './Pages/Login';
import Navbar from './components/shared/Navbar';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Upload from './Pages/Upload';
const AppRouter = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Upload" element={<Upload />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
};

export default AppRouter;