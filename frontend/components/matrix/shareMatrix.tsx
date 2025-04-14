"use client";

import { useState, useRef } from "react";
import { toast } from "react-toastify";

interface ShareMatrixProps {
  matrixId: string;
  buttonText?: string;
  className?: string;
}

const ShareMatrix = ({ matrixId, buttonText = "Bagikan", className = "" }: ShareMatrixProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fungsi untuk memeriksa ketersediaan Clipboard API dengan lebih akurat
  const isClipboardAvailable = () => {
    return typeof navigator !== 'undefined' && 
           typeof navigator.clipboard !== 'undefined' && 
           typeof navigator.clipboard.writeText === 'function';
  };

  // Fungsi fallback yang lebih robust
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      // Buat elemen textarea untuk menyalin teks
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Styling yang lebih baik untuk memastikan elemen terlihat dan dapat dipilih
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.zIndex = '9999';
      
      document.body.appendChild(textArea);
      textAreaRef.current = textArea;
      
      // Fokus dan pilih teks
      textArea.focus();
      textArea.select();
      
      // Eksekusi perintah copy
      const successful = document.execCommand('copy');
      
      // Bersihkan setelah selesai
      document.body.removeChild(textArea);
      textAreaRef.current = null;
      
      return successful;
    } catch (err) {
      console.error('Fallback: Tidak dapat menyalin teks ke clipboard', err);
      return false;
    }
  };

  // Fungsi untuk menampilkan dialog manual copy jika semua metode gagal
  const showManualCopyDialog = (url: string) => {
    // Tampilkan pesan dengan URL yang dapat disalin
    toast.info(
      <div>
        <p>Silakan salin link ini secara manual:</p>
        <input 
          type="text" 
          value={url} 
          readOnly 
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-full p-2 mt-2 border border-gray-300 rounded bg-gray-50"
        />
      </div>,
      { autoClose: false, closeOnClick: false }
    );
    console.log("Link untuk disalin:", url);
  };

  // Fungsi untuk menangani pembagian matrix
  const handleShareMatrix = async () => {
    setIsCopying(true);
    const shareUrl = `${window.location.origin}/matrix/${matrixId}`;
    
    try {
      let copySuccess = false;
      
      // Coba gunakan Clipboard API modern terlebih dahulu
      if (isClipboardAvailable()) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copySuccess = true;
        } catch (err) {
          console.warn('Clipboard API gagal:', err);
          // Jika gagal, coba fallback
          copySuccess = fallbackCopyTextToClipboard(shareUrl);
        }
      } else {
        // Jika Clipboard API tidak tersedia, gunakan fallback
        copySuccess = fallbackCopyTextToClipboard(shareUrl);
      }
      
      if (copySuccess) {
        toast.success("Link berhasil disalin ke clipboard!");
      } else {
        // Jika semua metode gagal, tampilkan pesan untuk menyalin manual
        showManualCopyDialog(shareUrl);
      }
    } catch (error) {
      console.error("Error saat membagikan matrix:", error);
      toast.error("Gagal menyalin link. Silakan coba lagi.");
      // Tampilkan dialog manual copy sebagai fallback terakhir
      showManualCopyDialog(shareUrl);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      onClick={handleShareMatrix}
      disabled={isCopying}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    >
      {isCopying ? "Menyalin..." : buttonText}
    </button>
  );
};

export default ShareMatrix;