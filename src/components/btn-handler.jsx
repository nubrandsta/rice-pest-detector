import { useState, useRef } from "react";
import { Webcam } from "../utils/webcam"; // Import handler webcam dari utils

const ButtonHandler = ({ imageRef, cameraRef, videoRef }) => {
  // State untuk menyimpan status streaming (image, video, webcam, atau null)
  const [streaming, setStreaming] = useState(null);

  // Referensi ke input file untuk gambar dan video
  const inputImageRef = useRef(null);
  const inputVideoRef = useRef(null);

  // Instansiasi objek Webcam
  const webcam = new Webcam();

  // Fungsi untuk menutup dan membersihkan tampilan gambar
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#"; // Mengembalikan source gambar ke placeholder
    URL.revokeObjectURL(url); // Menghapus URL blob untuk gambar

    setStreaming(null); // Mengatur streaming ke null
    inputImageRef.current.value = ""; // Mereset input file gambar
    imageRef.current.style.display = "none"; // Menyembunyikan gambar
  };

  // Fungsi untuk menutup dan membersihkan tampilan video
  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = ""; // Mengembalikan source video ke kosong
    URL.revokeObjectURL(url); // Menghapus URL blob untuk video

    setStreaming(null); // Mengatur streaming ke null
    inputVideoRef.current.value = ""; // Mereset input file video
    videoRef.current.style.display = "none"; // Menyembunyikan video
  };

  return (
    <div className="btn-container">
      {/* Input untuk memilih gambar */}
      <input
        type="file"
        accept="image/*" // Hanya menerima file gambar
        style={{ display: "none" }} // Menyembunyikan input file
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]); // Membuat URL blob untuk gambar
          imageRef.current.src = url; // Menetapkan source gambar
          imageRef.current.style.display = "block"; // Menampilkan gambar
          setStreaming("image"); // Mengatur status streaming ke image
        }}
        ref={inputImageRef}
      />
      <button
        onClick={() => {
          if (streaming === null) {
            // Jika tidak ada streaming, buka input file gambar
            inputImageRef.current.click();
          } else if (streaming === "image") {
            // Jika sedang streaming gambar, tutup gambar
            closeImage();
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming : ${streaming}`
            ); // Peringatan jika ada streaming lain aktif
          }
        }}
      >
        {streaming === "image" ? "Close" : "Open"} Image
      </button>

      {/* Input untuk memilih video */}
      <input
        type="file"
        accept="video/*" // Hanya menerima file video
        style={{ display: "none" }} // Menyembunyikan input file
        onChange={(e) => {
          if (streaming === "image") closeImage(); // Menutup streaming gambar jika ada
          const url = URL.createObjectURL(e.target.files[0]); // Membuat URL blob untuk video
          videoRef.current.src = url; // Menetapkan source video
          videoRef.current.addEventListener("ended", () => closeVideo()); // Menambahkan event listener untuk menutup video setelah selesai
          videoRef.current.style.display = "block"; // Menampilkan video
          setStreaming("video"); // Mengatur status streaming ke video
        }}
        ref={inputVideoRef}
      />
      <button
        onClick={() => {
          if (streaming === null || streaming === "image") {
            // Jika tidak ada streaming atau streaming gambar, buka input file video
            inputVideoRef.current.click();
          } else if (streaming === "video") {
            // Jika sedang streaming video, tutup video
            closeVideo();
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming : ${streaming}`
            ); // Peringatan jika ada streaming lain aktif
          }
        }}
      >
        {streaming === "video" ? "Close" : "Open"} Video
      </button>

      {/* Tombol untuk membuka atau menutup webcam */}
      <button
        onClick={() => {
          if (streaming === null || streaming === "image") {
            if (streaming === "image") closeImage(); // Menutup streaming gambar jika ada
            webcam.open(cameraRef.current); // Membuka webcam
            cameraRef.current.style.display = "block"; // Menampilkan webcam
            setStreaming("camera"); // Mengatur status streaming ke camera
          } else if (streaming === "camera") {
            webcam.close(cameraRef.current); // Menutup webcam
            cameraRef.current.style.display = "none"; // Menyembunyikan webcam
            setStreaming(null); // Mengatur status streaming ke null
          } else {
            alert(
              `Can't handle more than 1 stream\nCurrently streaming : ${streaming}`
            ); // Peringatan jika ada streaming lain aktif
          }
        }}
      >
        {streaming === "camera" ? "Close" : "Open"} Webcam
      </button>
    </div>
  );
};

export default ButtonHandler;
