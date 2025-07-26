// src/components/shared/ActionCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function ActionCard({ title, description, onClick, color = 'from-blue-500 to-blue-700', icon: Icon, disabled }) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`p-6 md:p-8 rounded-3xl shadow-xl cursor-pointer transition-all
        bg-gradient-to-br ${color} text-white relative overflow-hidden 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'}`}
    >
      {Icon && (
        <div className="absolute top-4 right-4 opacity-30">
          <Icon className="w-16 h-16 stroke-white" />
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold mb-2 z-10 relative">{title}</h2>
      <p className="text-sm md:text-base z-10 relative">{description}</p>
    </motion.div>
  );
}
