// ButtonHandler.jsx
import React from "react";

const ButtonHandler = ({
  imageRef,
  cameraRef,
  videoRef,
  handleCameraToggle,
  switchCamera,
}) => {
  const [streaming, setStreaming] = React.useState(null);
  const inputImageRef = React.useRef(null);
  const inputVideoRef = React.useRef(null);

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
              `Can't handle more than 1 stream\nCurrently streaming : ${streaming}`
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
              `Can't handle more than 1 stream\nCurrently streaming : ${streaming}`
            );
          }
        }}
      >
        {streaming === "video" ? "Close" : "Open"} Video
      </button>

      <button onClick={handleCameraToggle}>
        {cameraActive ? "Close Webcam" : "Open Webcam"}
      </button>

      <button onClick={switchCamera} disabled={!cameraActive}>
        Switch Camera
      </button>
    </div>
  );
};

export default ButtonHandler;
