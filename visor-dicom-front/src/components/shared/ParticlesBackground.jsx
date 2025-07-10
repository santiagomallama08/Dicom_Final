import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadStarsPreset } from "tsparticles-preset-stars";

const ParticlesBackground = () => {
  const particlesInit = useCallback(async engine => {
    await loadStarsPreset(engine);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          preset: "stars",
          background: {
            color: {
              value: "transparent",
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            number: {
              value: 100,
              density: {
                enable: true,
                area: 800,
              },
            },
          },
        }}
      />
    </div>
  );
};

export default ParticlesBackground;