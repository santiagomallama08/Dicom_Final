import React from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';

export default function ViewerControls({ current, total, onPrev, onNext }) {
  return (
    <div className="flex justify-between items-center">
      <button onClick={onPrev} disabled={current===0}
        className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition disabled:opacity-50">
        <BiLeftArrow size={24} />
      </button>
      <span>{current+1} / {total}</span>
      <button onClick={onNext} disabled={current===total-1}
        className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition disabled:opacity-50">
        <BiRightArrow size={24} />
      </button>
    </div>
  );
}