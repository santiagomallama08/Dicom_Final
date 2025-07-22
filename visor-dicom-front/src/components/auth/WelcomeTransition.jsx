// src/components/auth/WelcomeTransition.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  ScanLine,
  HeartPulse,
  Stethoscope,
  Microscope
} from "lucide-react";

const icons = [ScanLine, Brain, HeartPulse, Stethoscope, Microscope];
const messages = [
  "Inspirados por la precisión, diseñados para la salud.",
  "Bienvenido al futuro del diagnóstico médico."
];

const WelcomeTransition = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 4000); // 4 segundos
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="flex space-x-6 mb-8">
        {icons.map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 * index, duration: 0.5 }}
          >
            <Icon size={42} className="text-blue-400" />
          </motion.div>
        ))}
      </div>
      {messages.map((msg, i) => (
        <motion.p
          key={i}
          className="text-lg font-light text-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + i * 0.5, duration: 0.6 }}
        >
          {msg}
        </motion.p>
      ))}
    </div>
  );
};

export default WelcomeTransition;
