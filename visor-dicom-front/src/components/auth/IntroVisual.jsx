// src/components/auth/IntroVisual.jsx
import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import animationData from '../../Assets/lotties/intro-login.json';

const IntroVisual = ({ onFinish }) => {
  const [isDone, setIsDone] = useState(false);
  const animationRef = useRef();

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.setSpeed(4);
    }

    const timer = setTimeout(() => {
      setIsDone(true);
      onFinish();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <Lottie
        lottieRef={animationRef}
        animationData={animationData}
        className="max-w-[80%] max-h-[80%] object-contain pointer-events-none"
        loop={false}
      />
    </div>
  );
};

export default IntroVisual;