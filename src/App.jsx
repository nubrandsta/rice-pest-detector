import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // Menggunakan backend WebGL untuk TensorFlow.js
import React, { useEffect, useRef, useState } from "react";
import ButtonHandler from "./components/btn-handler"; // Komponen untuk meng-handle tombol aksi
import Loader from "./components/loader"; // Komponen untuk menampilkan loading state
import "./style/App.css"; // Gaya CSS aplikasi
import { detect } from "./utils/detect"; // Fungsi untuk deteksi gambar
import { loadAndWarmUpModel } from "./utils/tfUtils"; // Helper for model loading and warmup

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
  const [imageShow, setImageShow] = useState(false); // State to control image visibility

  // Nama model yang digunakan
  const modelName = "yolov11s";

  // Effect hook for loading the TensorFlow.js model
  useEffect(() => {
    setLoading({ loading: true, progress: 0 });
    loadAndWarmUpModel(`yolov11s_web_model/model.json`, {
      onProgress: (fractions) => {
        setLoading({ loading: true, progress: fractions });
      },
    })
      .then((loadedModel) => {
        setModel({
          net: loadedModel,
          inputShape: loadedModel.inputs[0].shape,
        });
        setLoading({ loading: false, progress: 1 });
      })
      .catch((error) => {
        console.error("Gagal memuat model:", error); // Indonesian error
        setLoading({ loading: false, progress: 0 }); // Ensure loading state is fully reset
        // You might want to show an error message to the user here
      });
  }, [modelName]); // Re-run if modelName changes (though it's constant here)


  // Effect hook for running detection when image and model are ready
  useEffect(() => {
    if (
      imageShow &&
      imageRef.current &&
      imageRef.current.src &&
      imageRef.current.src !== "#" &&
      imageRef.current.complete &&
      model && model.net && // Crucially, check model.net is loaded
      canvasRef.current // Use the defined canvasRef
    ) {
      // Set detection canvas dimensions to match the original image
      canvasRef.current.width = imageRef.current.naturalWidth;
      canvasRef.current.height = imageRef.current.naturalHeight;

      detect(
        imageRef.current,
        model, // Pass the whole model state (which includes .net and .inputShape)
        canvasRef.current,
        (newLoadingState) => setLoading(prev => ({...prev, ...newLoadingState, loading: newLoadingState.loading === undefined ? prev.loading : newLoadingState.loading})) // Pass setLoading to detect
      ).catch(error => {
        console.error("Deteksi gagal:", error); // Indonesian error
        setLoading({ loading: false, progress: 0 }); // Fallback for safety
      });
    } else if (!imageShow) {
      // Clear detection canvas when no image is shown
      if (canvasRef.current) {
        const ctxDetect = canvasRef.current.getContext("2d");
        ctxDetect.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      // Clearing for originalImageCanvas (if needed when imageShow is false)
      const originalCanvas = document.getElementById('originalImageCanvas');
      if (originalCanvas) {
        const ctxOrig = originalCanvas.getContext('2d');
        ctxOrig.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      }
    }
  }, [imageShow, model, model.net, imageRef.current?.src, imageRef.current?.complete, canvasRef]); // Dependencies updated

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
                // Display the original image on its canvas
                const originalImageCanvas = document.getElementById('originalImageCanvas');
                if (originalImageCanvas && imageRef.current && imageRef.current.src && imageRef.current.src !== '#') {
                  originalImageCanvas.width = imageRef.current.naturalWidth;
                  originalImageCanvas.height = imageRef.current.naturalHeight;
                  const ctx = originalImageCanvas.getContext('2d');
                  ctx.drawImage(imageRef.current, 0, 0, imageRef.current.naturalWidth, imageRef.current.naturalHeight);
                }

                // Trigger detection if model is loaded
                if (model && model.net && canvasRef.current && imageRef.current) {
                  // This detect call might be redundant if the useEffect for detection covers it
                  // Consider if this specific onLoad detection is still needed or if useEffect is sufficient
                  // For now, keeping it but ensuring model.net is checked
                  detect(imageRef.current, model, canvasRef.current, (newLoadingState) => setLoading(prev => ({...prev, ...newLoadingState, loading: newLoadingState.loading === undefined ? prev.loading : newLoadingState.loading})));
                } 
                setImageShow(true); // Show image and trigger detection via useEffect
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
            setImageShow={setImageShow} // Pass setImageShow to ButtonHandler
          />
        </div>
      </main>
    </div>
  );
};

export default App;
