// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Lottie from "lottie-react";
import loginAnimation from "../../Assets/lotties/login.json";
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';


const API_URL = 'http://localhost:8000/auth';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const nav = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const { user_id } = (await axios.post(`${API_URL}/login`, { email, password })).data;
            nav('/upload');
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Tilt
                glareEnable={true}
                glareMaxOpacity={0.15}
                glareColor="#ffffff"
                glarePosition="all"
                scale={1.02}
                transitionSpeed={1500}
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                className="w-full"
                style={{ width: '100%' }} // 👈 fuerza anchura
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full bg-[#1c1c1e]/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Ilustración animada */}
                    <div className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-[#007AFF] via-[#C633FF] to-[#FF4D00] p-10">
                        <Lottie animationData={loginAnimation} loop={true} className="w-72 h-auto" />
                    </div>

                    {/* Formulario */}
                    <div className="md:w-1/2 p-10 flex flex-col justify-center text-white space-y-6">
                        <h2 className="text-4xl font-bold text-center">Iniciar Sesión</h2>

                        {error && (
                            <div className="bg-red-500 text-white p-2 rounded text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c2c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Correo electrónico"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#2c2c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Contraseña"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full text-white font-semibold
                                bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00]
                                shadow-lg hover:shadow-[0_0_20px_rgba(199,51,255,0.6)]
                                hover:brightness-110 transition duration-300"
                            >
                                Entrar
                            </button>
                        </form>

                        <p className="text-sm text-gray-400 text-center">
                            ¿No tienes cuenta?{' '}
                            <button onClick={() => nav('/register')} className="text-blue-400 hover:underline">
                                Regístrate
                            </button>
                        </p>
                    </div>
                </motion.div>
            </Tilt>
        </div>
    );
}
