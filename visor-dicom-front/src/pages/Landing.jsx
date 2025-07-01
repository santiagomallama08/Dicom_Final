import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';
import Navbar from '../components/landing/Navbar';
import AboutDicom from '../components/landing/AboutDicom';
import ParallaxSection from '../components/landing/ParallaxSection';

const Landing = () => {
  return (
    <div className="bg-gray-100 text-gray-900">
      <Navbar />
      <HeroSection />
      <AboutDicom />
      <ParallaxSection /> 
      <Features />
      <Footer />
    </div>
  );
};

export default Landing;