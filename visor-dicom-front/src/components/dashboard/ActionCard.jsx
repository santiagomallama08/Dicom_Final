import React from 'react';

export default function ActionCard({ title, description, onClick, color, disabled }) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`p-8 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition
        bg-gradient-to-br ${color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="text-base">{description}</p>
    </div>
  );
}