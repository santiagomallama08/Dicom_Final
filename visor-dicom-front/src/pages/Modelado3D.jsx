// src/pages/Modelado3D.jsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Modelado3D() {
  const mountRef = useRef(null);

  const [renderer, setRenderer] = useState(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [controls, setControls] = useState(null);
  const [currentMesh, setCurrentMesh] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [selectionMarkers, setSelectionMarkers] = useState([]);
  const [selectionLines, setSelectionLines] = useState([]);

  const [modelDimensions, setModelDimensions] = useState(null);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // --------------------------------------------------------------------
  // 1. Inicializar escena
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const _scene = new THREE.Scene();
    _scene.background = new THREE.Color("#050505");

    const _camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    _camera.position.set(0, 0, 150);

    const _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(width, height);
    _renderer.setPixelRatio(window.devicePixelRatio);

    mountRef.current.appendChild(_renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    _scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(40, 60, 30);
    _scene.add(directional);

    const _controls = new OrbitControls(_camera, _renderer.domElement);
    _controls.enableDamping = true;
    _controls.dampingFactor = 0.05;
    _controls.enablePan = true;
    _controls.panSpeed = 1.0;
    _controls.zoomSpeed = 0.9;
    _controls.rotateSpeed = 0.9;

    setScene(_scene);
    setCamera(_camera);
    setRenderer(_renderer);
    setControls(_controls);

    const animate = () => {
      requestAnimationFrame(animate);
      _controls.update();
      _renderer.render(_scene, _camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      _renderer.setSize(newWidth, newHeight);
      _camera.aspect = newWidth / newHeight;
      _camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && _renderer.domElement?.parentNode) {
        mountRef.current.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
    };
  }, []);

  // --------------------------------------------------------------------
  // 2. Limpiar selección
  // --------------------------------------------------------------------
  const clearSelection = () => {
    if (scene) {
      selectionMarkers.forEach(m => {
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });

      selectionLines.forEach(l => {
        scene.remove(l);
        if (l.geometry) l.geometry.dispose();
        if (l.material) l.material.dispose();
      });
    }

    setSelectedPoints([]);
    setSelectionMarkers([]);
    setSelectionLines([]);
  };

  // --------------------------------------------------------------------
  // 3. Selector con puntos milimétricos y líneas conectadas
  // --------------------------------------------------------------------
  const handleCanvasClick = (event) => {
    if (!selectionMode || !currentMesh || !camera || !scene) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const hits = raycaster.current.intersectObject(currentMesh);
    if (!hits.length) return;

    const point = hits[0].point.clone();
    const updatedPoints = [...selectedPoints, point];
    setSelectedPoints(updatedPoints);

    // 🔴 Marcador pequeño y preciso (0.3mm de radio - milimétrico)
    const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    marker.renderOrder = 999; // Renderizar siempre encima
    scene.add(marker);
    setSelectionMarkers(prev => [...prev, marker]);

    // 🟡 Línea amarilla entre puntos consecutivos
    if (updatedPoints.length > 1) {
      const prevPoint = updatedPoints[updatedPoints.length - 2];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([prevPoint, point]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        linewidth: 2,
        depthTest: false,
        transparent: true,
        opacity: 0.9
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.renderOrder = 998;
      scene.add(line);
      setSelectionLines(prev => [...prev, line]);
    }

    // 🟢 Línea verde de cierre (del último al primero)
    if (updatedPoints.length >= 3) {
      // Remover línea de cierre anterior
      const oldClosingLines = selectionLines.filter(l => l.userData?.closing);
      oldClosingLines.forEach(l => {
        scene.remove(l);
        if (l.geometry) l.geometry.dispose();
        if (l.material) l.material.dispose();
      });

      // Crear nueva línea de cierre
      const closingGeometry = new THREE.BufferGeometry().setFromPoints([
        updatedPoints[updatedPoints.length - 1],
        updatedPoints[0]
      ]);
      const closingMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3,
        depthTest: false,
        transparent: true,
        opacity: 0.95
      });
      const closingLine = new THREE.Line(closingGeometry, closingMaterial);
      closingLine.userData.closing = true;
      closingLine.renderOrder = 998;
      scene.add(closingLine);

      // Actualizar array de líneas sin las de cierre antiguas
      setSelectionLines(prev => [
        ...prev.filter(l => !l.userData?.closing),
        closingLine
      ]);
    }
  };

  // --------------------------------------------------------------------
  // Encontrar caras dentro del polígono - OPTIMIZADO PARA PRÓTESIS CRANEAL
  // --------------------------------------------------------------------
  const getFacesInSelection = (mesh, points) => {
    if (points.length < 3) return new Set();

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const selectedFaces = new Set();

    // Calcular el plano del polígono de selección
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];

    const v1 = new THREE.Vector3().subVectors(p1, p0);
    const v2 = new THREE.Vector3().subVectors(p2, p0);
    const planeNormal = new THREE.Vector3().crossVectors(v1, v2).normalize();

    // Calcular centro del polígono
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    // Sistema de coordenadas local
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();

    if (Math.abs(planeNormal.y) < 0.9) {
      right.crossVectors(new THREE.Vector3(0, 1, 0), planeNormal).normalize();
    } else {
      right.crossVectors(new THREE.Vector3(1, 0, 0), planeNormal).normalize();
    }
    up.crossVectors(planeNormal, right).normalize();

    // Proyectar puntos del polígono a 2D
    const polygon2D = points.map(p => {
      const rel = new THREE.Vector3().subVectors(p, center);
      return new THREE.Vector2(rel.dot(right), rel.dot(up));
    });

    // Calcular radio máximo del polígono
    let maxDist = 0;
    polygon2D.forEach(p => {
      const dist = p.length();
      if (dist > maxDist) maxDist = dist;
    });

    // Función de punto en polígono
    const isPointInPolygon = (point2D, polygon) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point2D.y) !== (yj > point2D.y)) &&
          (point2D.x < (xj - xi) * (point2D.y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Verificar cada cara del modelo
    for (let i = 0; i < positions.length / 9; i++) {
      const v1 = new THREE.Vector3(positions[i * 9], positions[i * 9 + 1], positions[i * 9 + 2]);
      const v2 = new THREE.Vector3(positions[i * 9 + 3], positions[i * 9 + 4], positions[i * 9 + 5]);
      const v3 = new THREE.Vector3(positions[i * 9 + 6], positions[i * 9 + 7], positions[i * 9 + 8]);

      v1.applyMatrix4(mesh.matrixWorld);
      v2.applyMatrix4(mesh.matrixWorld);
      v3.applyMatrix4(mesh.matrixWorld);

      const faceCenter = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

      // FILTRO 1: Distancia al plano (más tolerante para capturar curvatura)
      const toFace = new THREE.Vector3().subVectors(faceCenter, center);
      const distToPlane = Math.abs(toFace.dot(planeNormal));

      // Aumentar tolerancia para capturar más profundidad (15mm para prótesis craneal)
      if (distToPlane > 15) continue;

      // FILTRO 2: Normal de la cara (más permisivo para superficies curvas)
      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      const alignment = faceNormal.dot(planeNormal);
      // Aceptar caras con orientación moderada (incluir curvaturas)
      if (alignment < -0.3) continue;

      // FILTRO 3: Proyección a 2D
      const relPos = new THREE.Vector3().subVectors(faceCenter, center);
      const point2D = new THREE.Vector2(relPos.dot(right), relPos.dot(up));

      if (point2D.length() > maxDist * 1.15) continue;

      // FILTRO 4: Dentro del polígono
      if (isPointInPolygon(point2D, polygon2D)) {
        selectedFaces.add(i);
      }
    }

    return selectedFaces;
  };

  // --------------------------------------------------------------------
  // Exportación STL solo de la región seleccionada - CORREGIDA
  // --------------------------------------------------------------------
  // --------------------------------------------------------------------
  // Exportación STL solo de la región seleccionada - CORREGIDA
  // --------------------------------------------------------------------
  const exportSelected = () => {
    if (!currentMesh || selectedPoints.length < 3) {
      alert("Selecciona al menos 3 puntos para definir el área.");
      return;
    }

    // Obtener caras dentro del polígono
    const selectedFaces = getFacesInSelection(currentMesh, selectedPoints);

    if (selectedFaces.size === 0) {
      alert("No se encontraron caras en el área seleccionada. Intenta con más puntos o un área más grande.");
      return;
    }

    // Extraer caras seleccionadas
    const geometry = currentMesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;

    const selectedPositions = [];
    const selectedNormals = [];

    // Crear matriz de transformación completa del mesh original
    const transformMatrix = new THREE.Matrix4();
    transformMatrix.compose(
      currentMesh.position,
      currentMesh.quaternion,
      currentMesh.scale
    );

    selectedFaces.forEach(faceIndex => {
      // Extraer los 3 vértices de la cara
      for (let j = 0; j < 3; j++) {
        const idx = faceIndex * 9 + j * 3;

        // Obtener posición del vértice
        const vertex = new THREE.Vector3(
          positions[idx],
          positions[idx + 1],
          positions[idx + 2]
        );

        // Aplicar transformaciones del mesh original
        vertex.applyMatrix4(transformMatrix);

        selectedPositions.push(vertex.x, vertex.y, vertex.z);

        // Obtener y transformar normales si existen
        if (normals) {
          const normal = new THREE.Vector3(
            normals[idx],
            normals[idx + 1],
            normals[idx + 2]
          );

          // Las normales solo necesitan rotación y escala, no traslación
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(transformMatrix);
          normal.applyMatrix3(normalMatrix).normalize();

          selectedNormals.push(normal.x, normal.y, normal.z);
        }
      }
    });

    // Crear geometría con las caras seleccionadas YA TRANSFORMADAS
    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(selectedPositions, 3));

    if (selectedNormals.length > 0) {
      newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(selectedNormals, 3));
    }

    // Recalcular normales para suavizado
    newGeometry.computeVertexNormals();

    // Crear mesh temporal SIN transformaciones adicionales (ya están aplicadas)
    const tempMesh = new THREE.Mesh(
      newGeometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    // NO aplicar transformaciones aquí porque ya están en los vértices

    // Exportar a STL
    const exporter = new STLExporter();
    const stlString = exporter.parse(tempMesh, { binary: false });

    const blob = new Blob([stlString], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "protesis_seleccionada.stl";
    a.click();
    URL.revokeObjectURL(a.href);

    // Limpiar mesh temporal
    tempMesh.geometry.dispose();
    tempMesh.material.dispose();

    alert(`✓ Prótesis exportada exitosamente!\n\n${selectedFaces.size} caras exportadas\n${selectedPoints.length} puntos de referencia\n\nArchivo: protesis_seleccionada.stl`);
  };
  // --------------------------------------------------------------------
  // Eliminar Modelo
  // --------------------------------------------------------------------
  const removeModel = () => {
    clearSelection();
    if (currentMesh && scene) {
      scene.remove(currentMesh);
      if (currentMesh.geometry) currentMesh.geometry.dispose();
      if (currentMesh.material) currentMesh.material.dispose();
      setCurrentMesh(null);
    }
    setModelDimensions(null);
  };

  // --------------------------------------------------------------------
  // Cargar STL
  // --------------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !scene) return;

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (ev) => {
      const geometry = loader.parse(ev.target.result);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      const bbox = geometry.boundingBox;
      const sizeVector = bbox.getSize(new THREE.Vector3());
      const size = sizeVector.length();

      geometry.center();

      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0xf2f2f2,
          roughness: 0.85,
          metalness: 0.1
        })
      );

      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.setScalar(80 / size);

      if (currentMesh) {
        scene.remove(currentMesh);
      }
      scene.add(mesh);

      setCurrentMesh(mesh);
      clearSelection();

      setModelDimensions({
        width: (bbox.max.x - bbox.min.x).toFixed(2),
        height: (bbox.max.y - bbox.min.y).toFixed(2),
        depth: (bbox.max.z - bbox.min.z).toFixed(2),
        size: size.toFixed(2)
      });

      if (controls && camera) {
        controls.target.set(0, 0, 0);
        camera.position.set(0, 0, 150);
        controls.update();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // --------------------------------------------------------------------
  // Listener - Permitir rotación en modo selección
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!renderer || !controls) return;

    const canvas = renderer.domElement;

    // Habilitar controles en modo selección
    if (selectionMode) {
      controls.enabled = true; // Siempre permitir rotar
    }

    canvas.addEventListener("click", handleCanvasClick);

    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [renderer, controls, currentMesh, selectionMode, selectedPoints, selectionLines, scene, camera]);

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div className="p-4 text-gray-300 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-1">Modelado 3D</h1>
      <p className="mb-3 text-gray-400">
        Sube un modelo STL para visualizar el cráneo y seleccionar la prótesis con precisión milimétrica.
      </p>

      {/* BOTONES */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded cursor-pointer text-sm text-white">
          📁 Subir modelo STL
          <input type="file" accept=".stl" className="hidden" onChange={handleFileUpload} />
        </label>

        <button
          onClick={removeModel}
          disabled={!currentMesh}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white"
        >
          🗑️ Eliminar Modelo
        </button>

        <button
          onClick={() => setSelectionMode(!selectionMode)}
          disabled={!currentMesh}
          className={`px-4 py-2 rounded text-sm font-medium transition ${selectionMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
            } ${!currentMesh ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {selectionMode ? "✓ Modo Selección ON" : "📍 Modo Selección OFF"}
        </button>

        <button
          onClick={clearSelection}
          disabled={selectedPoints.length === 0}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white"
        >
          🧹 Limpiar ({selectedPoints.length})
        </button>

        <button
          onClick={exportSelected}
          disabled={selectedPoints.length < 3}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white font-medium"
        >
          💾 Exportar Prótesis ({selectedPoints.length})
        </button>
      </div>

      {/* Instrucciones */}
      <div className="text-xs text-gray-400 mb-3">
        🖱 <strong>Controles:</strong> Rotar: clic izquierdo + arrastrar · Zoom: scroll · Pan: clic derecho
        {selectionMode && (
          <span className="text-green-400 ml-2">
            · <strong>Modo Activo:</strong> Clic simple para marcar puntos | Puedes rotar libremente con clic izquierdo
          </span>
        )}
      </div>

      {/* DIMENSIONES */}
      {modelDimensions && (
        <div className="mb-4 bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <h3 className="text-sm font-semibold mb-3 text-white">📏 Dimensiones del Modelo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-2 rounded-lg">
              <span className="text-purple-400 font-semibold block mb-1">Ancho:</span>
              <span className="text-white font-bold">{modelDimensions.width} mm</span>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-lg">
              <span className="text-indigo-400 font-semibold block mb-1">Alto:</span>
              <span className="text-white font-bold">{modelDimensions.height} mm</span>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg">
              <span className="text-blue-400 font-semibold block mb-1">Profundidad:</span>
              <span className="text-white font-bold">{modelDimensions.depth} mm</span>
            </div>

            <div className="bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg">
              <span className="text-green-400 font-semibold block mb-1">Tamaño Total:</span>
              <span className="text-white font-bold">{modelDimensions.size} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* VISOR 3D */}
      <div
        ref={mountRef}
        className="flex-1 min-h-[400px] bg-[#0a0a0a] border border-[#1f1f1f] rounded-md shadow-lg"
        style={{ cursor: selectionMode ? 'pointer' : 'grab' }}
      ></div>
    </div>
  );
}