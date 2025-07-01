// src/routes/AppRouter.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import Upload from '../pages/Upload';
import SegmentResult from '../pages/SegmentResult';
import Landing from '../pages/Landing';

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/result" element={<SegmentResult />} />
        </Routes>
    );
}

export default AppRouter;