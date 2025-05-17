import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // Menggunakan backend WebGL untuk TensorFlow.js
import React, { useEffect, useRef, useState } from "react";
import ButtonHandler from "./components/btn-handler"; // Komponen untuk meng-handle tombol aksi
import Loader from "./components/loader"; // Komponen untuk menampilkan loading state
import "./style/App.css"; // Gaya CSS aplikasi
import { detect } from "./utils/detect"; // Fungsi untuk deteksi gambar

const App = () => {
  document.title = "Rice Pest Detection"; // Set site title
  // State untuk menangani status loading model
  const [loading, setLoading] = useState({ loading: true, progress: 0 });

  // State untuk menyimpan model dan bentuk input
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });

  // Referensi ke elemen-elemen DOM
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Nama model yang digunakan
  const modelName = "yolov11s";

  useEffect(() => {
    if (
      imageShow &&
      imageRef.current &&
      imageRef.current.src &&
      imageRef.current.src !== "#" &&
      imageRef.current.complete && // Crucial: ensure image is loaded for naturalWidth/Height
      model &&
      inputOutputCanvasRef.current
    ) {
      // Set detection canvas dimensions to match the original image
      inputOutputCanvasRef.current.width = imageRef.current.naturalWidth;
      inputOutputCanvasRef.current.height = imageRef.current.naturalHeight;

      detect(
        imageRef.current,
        model,
        inputOutputCanvasRef.current,
        setLoading // detect function will call setLoading(true/false)
      ).catch(error => {
        console.error("Deteksi gagal:", error); // Indonesian error
        setLoading(false); // Fallback for safety, ensure loading indicator is turned off
      });
    } else if (!imageShow) {
      // Clear both canvases when no image is shown
      if (inputOutputCanvasRef.current) {
        const ctxDetect = inputOutputCanvasRef.current.getContext("2d");
        ctxDetect.clearRect(0, 0, inputOutputCanvasRef.current.width, inputOutputCanvasRef.current.height);
        // Optionally reset to default size, e.g., 640x640, if preferred when cleared
        // inputOutputCanvasRef.current.width = MODEL_WIDTH;
        // inputOutputCanvasRef.current.height = MODEL_HEIGHT;
      }
      if (originalImageCanvasRef.current) {
        const ctxOrig = originalImageCanvasRef.current.getContext("2d");
        ctxOrig.clearRect(0, 0, originalImageCanvasRef.current.width, originalImageCanvasRef.current.height);
      }
    }
  }, [imageShow, model, imageRef.current?.complete, imageRef.current?.src]); // Dependencies updated

  return (
    <div className="App">
      <header className="navbar">
        <h1>Deteksi Hama Beras</h1>
      </header>
      {loading.loading && (
        <Loader>Memuat model... {(loading.progress * 100).toFixed(2)}%</Loader>
      )}
      <main className="dashboard-content">
        <div className="image-display-area">
          <div className="image-container">
            <h2>Gambar Asli</h2>
            <img
              src="#"
              ref={imageRef}
              onLoad={() => {
                detect(imageRef.current, model, canvasRef.current);
                // Display the original image as well
                const originalImageCanvas = document.getElementById('originalImageCanvas');
                if (originalImageCanvas && imageRef.current.src !== '#') {
                  const ctx = originalImageCanvas.getContext('2d');
                  originalImageCanvas.width = imageRef.current.naturalWidth;
                  originalImageCanvas.height = imageRef.current.naturalHeight;
                  ctx.drawImage(imageRef.current, 0, 0, imageRef.current.naturalWidth, imageRef.current.naturalHeight);
                }
              }}
              style={{ display: 'none' }} // Initially hidden, shown by ButtonHandler
            />
            <canvas id="originalImageCanvas" style={{ maxWidth: '100%', maxHeight: '400px' }}></canvas>
          </div>
          <div className="image-container">
            <h2>Gambar Terdeteksi</h2>
            {/* Canvas untuk menampilkan hasil deteksi */}
            <canvas
              width={model.inputShape[1]}
              height={model.inputShape[2]}
              ref={canvasRef}
              style={{ maxWidth: '100%', maxHeight: '400px' }}
            />
          </div>
        </div>
        <div className="controls-area">
          <p>
            Deteksi hama beras Sitophilus dan Oryzaephilus menggunakan YOLOv11s.
          </p>
          <p>
            Model: <code className="code">{modelName}</code>
          </p>
          {/* Komponen tombol untuk meng-handle aksi */}
          <ButtonHandler
            imageRef={imageRef}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
