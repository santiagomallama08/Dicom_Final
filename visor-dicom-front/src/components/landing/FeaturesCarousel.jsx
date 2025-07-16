import React from "react";
import Slider from "react-slick";
import { FaCloudUploadAlt, FaBrain, FaRulerVertical, FaCube, FaEye } from "react-icons/fa";
import { MdArrowBackIos, MdArrowForwardIos } from "react-icons/md";

const features = [
  {
    icon: <FaCloudUploadAlt size={40} />,
    title: "Carga de estudios",
    desc: "Sube carpetas DICOM completas y recórrelas frame a frame.",
    bgColor: "from-blue-200 to-blue-100",
  },
  {
    icon: <FaBrain size={40} />,
    title: "Segmentación automática",
    desc: "Segmenta en tiempo real y obtén máscaras precisas.",
    bgColor: "from-purple-200 to-purple-100",
  },
  {
    icon: <FaRulerVertical size={40} />,
    title: "Medidas anatómicas",
    desc: "Calcula volumen, longitud, área y más.",
    bgColor: "from-green-200 to-green-100",
  },
  {
    icon: <FaCube size={40} />,
    title: "Modelado STL",
    desc: "Exporta estructuras segmentadas en formato STL.",
    bgColor: "from-pink-200 to-pink-100",
  },
  {
    icon: <FaEye size={40} />,
    title: "Visualización 3D",
    desc: "Visualiza tus resultados en 3D dentro del navegador.",
    bgColor: "from-yellow-200 to-yellow-100",
  },
];

const ArrowLeft = ({ onClick }) => (
  <div
    className="absolute -left-6 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer text-gray-700 hover:text-black"
    onClick={onClick}
  >
    <MdArrowBackIos size={28} />
  </div>
);

const ArrowRight = ({ onClick }) => (
  <div
    className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer text-gray-700 hover:text-black"
    onClick={onClick}
  >
    <MdArrowForwardIos size={28} />
  </div>
);

const FeaturesCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "120px",
    autoplay: true,
    autoplaySpeed: 2000,
    nextArrow: <ArrowRight />,
    prevArrow: <ArrowLeft />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          centerPadding: "60px",
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          centerPadding: "30px",
        },
      },
    ],
  };

  return (
    <section className="feature-carousel py-20 bg-gray-100 relative">
      <h2 className="text-3xl font-bold text-black text-center mb-12">¿Qué puedes hacer aquí?</h2>
      <div className="max-w-7xl mx-auto px-4 relative">
        <Slider {...settings}>
          {features.map((f, i) => (
            <div key={i} className="px-4">
              <div
                className={`feature-card flex flex-col items-center bg-gradient-to-br ${f.bgColor} rounded-xl shadow-lg p-8 text-center h-80`}
              >
                <div className="text-gray-800 mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-700 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default FeaturesCarousel;