// src/pages/Landing.jsx
import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import AboutDicom from '../components/landing/AboutDicom';
import ParallaxSection from '../components/landing/ParallaxSection';
import ScrollZoomSection from '../components/landing/ScrollZoomSection';
import FeaturesCarousel from '../components/landing/FeaturesCarousel';
import Features from '../components/landing/Features';
import Footer from '../components/shared/Footer';
import Navbar from '../components/shared/Navbar';

const Landing = () => (
  <div className="bg-gradient-to-br from-[#0f0f10] via-[#0a0a0a] to-[#1c1c1e] text-white">
    <Navbar />

    <section id="hero" className="scroll-mt-16">
      <HeroSection />
    </section>

    <section id="about" className="scroll-mt-16">
      <AboutDicom />
    </section>

    <section id="parallax" className="scroll-mt-16">
      <ParallaxSection />
    </section>

    <section id="explore" className="scroll-mt-16">
      <ScrollZoomSection />
    </section>

    <section id="carousel"className="scroll-mt-16">
      <FeaturesCarousel />
    </section>

    <section id="features"className="scroll-mt-16">
      <Features />
    </section>

    <Footer />
  </div>
);

export default Landing;
