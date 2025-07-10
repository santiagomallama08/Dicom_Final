// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../Pages/Login';
import Upload from '../Pages/Upload';
import Result from 'postcss/lib/result';
import Register from '../pages/Register';

const AppRouter = () => (
    <>
        <Navbar />
        <Routes>
            { }
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/register" element={<Register />} />
            <Route path="/result" element={<Result />} />
        </Routes>
    </>
);

export default AppRouter;