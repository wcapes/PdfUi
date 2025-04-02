import React, { useRef } from 'react';
import '../styles/TopPanel.css';

function TopPanel({ onUploadPdf, onLogout }) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      onUploadPdf(file);
    } else {
      alert('Please select a valid PDF file');
    }
    // Reset input value to allow selecting the same file again
    e.target.value = null;
  };

  return (
    <div className="top-panel">
      <div className="logo">
        <img src="/pdf-icon.svg" alt="PDF Q&A" />
        <span>PDF Q&A</span>
      </div>
      
      <div className="actions">
        <button className="upload-btn" onClick={handleUploadClick}>
          <i className="upload-icon"></i> Upload PDF
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="application/pdf" 
          style={{ display: 'none' }} 
        />
        
        <button className="logout-btn" onClick={onLogout}>
          <i className="logout-icon"></i> Logout
        </button>
      </div>
    </div>
  );
}

export default TopPanel;
