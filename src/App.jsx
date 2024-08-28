import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  });
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelName = "yolov8n";

  useEffect(() => {
    // Menunggu TensorFlow.js siap
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions });
          },
        }
      );
      const dummyInput = tf.ones(yolov8.inputs[0].shape);
      const warmupResults = yolov8.execute(dummyInput);
      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape,
      });
      tf.dispose([warmupResults, dummyInput]);
    });

    // Mengakses kamera
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (cameraRef.current) {
          cameraRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    };

    getCamera();
  }, []);

  const switchCamera = async () => {
    const videoTracks = cameraRef.current.srcObject?.getVideoTracks();
    if (videoTracks && videoTracks.length > 0) {
      const currentTrack = videoTracks[0];
      const facingMode =
        currentTrack.getSettings().facingMode === "user"
          ? "environment"
          : "user";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      cameraRef.current.srcObject?.getTracks().forEach((track) => track.stop()); // Stop previous tracks
      cameraRef.current.srcObject = stream;
    }
  };

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
        <img
          src="#"
          ref={imageRef}
          onLoad={() => detect(imageRef.current, model, canvasRef.current)}
        />
        <video
          autoPlay
          muted
          ref={cameraRef}
          onPlay={() =>
            detectVideo(cameraRef.current, model, canvasRef.current)
          }
        />
        <video
          autoPlay
          muted
          ref={videoRef}
          onPlay={() => detectVideo(videoRef.current, model, canvasRef.current)}
        />
        <canvas
          width={model.inputShape[2]} // Adjusted for proper bounding box
          height={model.inputShape[1]} // Adjusted for proper bounding box
          ref={canvasRef}
        />
      </div>
      <ButtonHandler
        imageRef={imageRef}
        cameraRef={cameraRef}
        videoRef={videoRef}
        switchCamera={switchCamera}
      />
    </div>
  );
};

export default App;
