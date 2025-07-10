import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import Features from '../components/landing/Features';
import Footer from '../components/shared/Footer';
import Navbar from '../components/shared/Navbar';
import AboutDicom from '../components/landing/AboutDicom';
import ParallaxSection from '../components/landing/ParallaxSection';
import FeaturesCarousel from "../components/landing/FeaturesCarousel";
import ScrollZoomSection from '../components/landing/ScrollZoomSection';


const Landing = () => {
  return (
    <div className="bg-gray-100 text-gray-900">
      <Navbar />
      <HeroSection />
      <AboutDicom />
      <ParallaxSection />
      <ScrollZoomSection />
      <FeaturesCarousel />
      <Features />
      <Footer />
    </div>
  );
};

export default Landing;