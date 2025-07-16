import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import ViewerControls from '../components/dashboard/ViewerControls';

export default function Viewer() {
  const { sessionId } = useParams();
  const [images, setImages] = useState([]);
  const [mapping, setMapping] = useState({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Obtiene lista de imágenes y mapping
    axios.get(`http://localhost:8000/series-mapping/?session_id=${sessionId}`)
      .then(res => {
        setMapping(res.data.mapping);
        // Asume que mapping keys = png filenames
        const urls = Object.keys(res.data.mapping)
          .map(name => `/static/series/${sessionId}/${name}`);
        setImages(urls);
      });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <img
          src={images[current]}
          alt="DICOM frame"
          className="w-full h-auto mb-4 rounded-lg shadow-lg"
        />
        <ViewerControls
          current={current}
          total={images.length}
          onPrev={() => setCurrent(i => Math.max(i-1, 0))}
          onNext={() => setCurrent(i => Math.min(i+1, images.length-1))}
        />
      </div>
    </div>
  );
}