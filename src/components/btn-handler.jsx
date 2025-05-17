import { useState, useRef } from "react";

const ButtonHandler = ({ imageRef }) => {
  // State untuk menyimpan status streaming (image, video, webcam, atau null)
  const [streaming, setStreaming] = useState(null);

  // Referensi ke input file untuk gambar dan video
  const inputImageRef = useRef(null);
  const inputVideoRef = useRef(null);

  // Fungsi untuk menutup dan membersihkan tampilan gambar
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#"; // Mengembalikan source gambar ke placeholder
    URL.revokeObjectURL(url); // Menghapus URL blob untuk gambar

    setStreaming(null); // Mengatur streaming ke null
    inputImageRef.current.value = ""; // Mereset input file gambar
    imageRef.current.style.display = "none"; // Menyembunyikan gambar
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
          // imageRef.current.style.display = "block"; // Original image is now shown on a canvas
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
        {streaming === "image" ? "Tutup" : "Upload"} Gambar
      </button>
    </div>
  );
};

export default ButtonHandler;
