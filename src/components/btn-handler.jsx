import React, { useRef, useState } from "react";
import { Webcam } from "../utils/webcam"; // Import handler webcam dari utils

const ButtonHandler = ({ imageRef, cameraRef, videoRef, switchCamera }) => {
  const [streaming, setStreaming] = useState(null);
  const inputImageRef = useRef(null);
  const inputVideoRef = useRef(null);

  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#";
    URL.revokeObjectURL(url);
    setStreaming(null);
    inputImageRef.current.value = "";
    imageRef.current.style.display = "none";
  };

  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = "";
    URL.revokeObjectURL(url);
    setStreaming(null);
    inputVideoRef.current.value = "";
    videoRef.current.style.display = "none";
  };

  const openCamera = async () => {
    if (streaming === "image") closeImage();
    if (streaming === "video") closeVideo();
    cameraRef.current.style.display = "block";
    setStreaming("camera");
  };

  const closeCamera = () => {
    const stream = cameraRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraRef.current.srcObject = null;
    }
    cameraRef.current.style.display = "none";
    setStreaming(null);
  };

  return (
    <div className="btn-container">
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]);
          imageRef.current.src = url;
          imageRef.current.style.display = "block";
          setStreaming("image");
        }}
        ref={inputImageRef}
      />
      <button
        onClick={() => {
          if (streaming === null) {
            inputImageRef.current.click();
          } else if (streaming === "image") {
            closeImage();
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming: ${streaming}`
            );
          }
        }}
      >
        {streaming === "image" ? "Close" : "Open"} Image
      </button>

      <input
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (streaming === "image") closeImage();
          const url = URL.createObjectURL(e.target.files[0]);
          videoRef.current.src = url;
          videoRef.current.addEventListener("ended", () => closeVideo());
          videoRef.current.style.display = "block";
          setStreaming("video");
        }}
        ref={inputVideoRef}
      />
      <button
        onClick={() => {
          if (streaming === null || streaming === "image") {
            inputVideoRef.current.click();
          } else if (streaming === "video") {
            closeVideo();
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming: ${streaming}`
            );
          }
        }}
      >
        {streaming === "video" ? "Close" : "Open"} Video
      </button>

      <button
        onClick={() => {
          if (
            streaming === null ||
            streaming === "image" ||
            streaming === "video"
          ) {
            openCamera();
          } else if (streaming === "camera") {
            closeCamera();
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming: ${streaming}`
            );
          }
        }}
      >
        {streaming === "camera" ? "Close" : "Open"} Webcam
      </button>

      <button onClick={switchCamera}>Switch Camera</button>
    </div>
  );
};

export default ButtonHandler;
