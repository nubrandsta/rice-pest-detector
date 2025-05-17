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
    // Menunggu TensorFlow.js siap
    tf.ready().then(async () => {
      // Memuat model YOLOv11s dari URL
      const yolov11s = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            // Mengupdate progress loading model
            setLoading({ loading: true, progress: fractions });
          },
        }
      );

      // Melakukan pemanasan model dengan input dummy
      const dummyInput = tf.ones(yolov11s.inputs[0].shape);
      const warmupResults = yolov11s.execute(dummyInput);

      // Mengupdate state setelah model siap
      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov11s,
        inputShape: yolov11s.inputs[0].shape,
      });

      // Membersihkan memori
      tf.dispose([warmupResults, dummyInput]);
    });
  }, []);

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
