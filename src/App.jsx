import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // Menggunakan backend WebGL untuk TensorFlow.js
import React, { useEffect, useRef, useState } from "react";
import ButtonHandler from "./components/btn-handler"; // Komponen untuk meng-handle tombol aksi
import Loader from "./components/loader"; // Komponen untuk menampilkan loading state
import "./style/App.css"; // Gaya CSS aplikasi
import { detect, detectVideo } from "./utils/detect"; // Fungsi untuk deteksi gambar dan video

const App = () => {
  // State untuk menangani status loading model
  const [loading, setLoading] = useState({ loading: true, progress: 0 });

  // State untuk menyimpan model dan bentuk input
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });

  // Referensi ke elemen-elemen DOM
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Nama model yang digunakan
  const modelName = "yolov11s";

  useEffect(() => {
    // Menunggu TensorFlow.js siap
    tf.ready().then(async () => {
      // Memuat model YOLOv8 dari URL
      const yolov11 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            // Mengupdate progress loading model
            setLoading({ loading: true, progress: fractions });
          },
        }
      );

      // Melakukan pemanasan model dengan input dummy
      const dummyInput = tf.ones(yolov11.inputs[0].shape);
      const warmupResults = yolov11.execute(dummyInput);

      // Mengupdate state setelah model siap
      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov11,
        inputShape: yolov11.inputs[0].shape,
      });

      // Membersihkan memori
      tf.dispose([warmupResults, dummyInput]);
    });
  }, []);

  return (
    <div className="App">
      {loading.loading && (
        <Loader>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>
      )}
      <div className="header">
        <h1>PROJECT SKRIPSI</h1>
        <p>
          Deteksi penggunaan alat pelindung diri (APD) pada pekerja berbasis web
          browser menggunakan YOLOv8 dan TensorFlow.js.
        </p>
        <p>
          Serving: <code className="code">{modelName}</code>
        </p>
      </div>

      <div className="content">
        {/* Gambar yang akan dideteksi */}
        <img
          src="#"
          ref={imageRef}
          onLoad={() => detect(imageRef.current, model, canvasRef.current)}
        />

        {/* Video dari webcam */}
        <video
          autoPlay
          muted
          ref={cameraRef}
          onPlay={() =>
            detectVideo(cameraRef.current, model, canvasRef.current)
          }
        />

        {/* Video dari sumber lain */}
        <video
          autoPlay
          muted
          ref={videoRef}
          onPlay={() => detectVideo(videoRef.current, model, canvasRef.current)}
        />

        {/* Canvas untuk menampilkan hasil deteksi */}
        <canvas
          width={model.inputShape[1]}
          height={model.inputShape[2]}
          ref={canvasRef}
        />
      </div>

      {/* Komponen tombol untuk meng-handle aksi */}
      <ButtonHandler
        imageRef={imageRef}
        cameraRef={cameraRef}
        videoRef={videoRef}
      />
    </div>
  );
};

export default App;
