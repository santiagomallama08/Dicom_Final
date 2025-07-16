// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../Pages/Login';
import Upload from '../Pages/Upload';
import Register from '../pages/Register';
import Viewer from '../pages/Viewer';

const AppRouter = () => (
  <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/register" element={<Register />} />
      <Route path="/visor" element={<Viewer />} />
    </Routes>
  </>
);

export default AppRouter;