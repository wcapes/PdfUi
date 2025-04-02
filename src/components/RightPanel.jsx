import React, { useState } from 'react';
import '../styles/RightPanel.css';

function RightPanel({ onSubmitFeedback, currentPdf }) {
  const [feedback, setFeedback] = useState('');

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      onSubmitFeedback(feedback);
      setFeedback('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="right-panel">
      <div className="feedback-section">
        <h3>Provide Feedback</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your feedback..."
        />
        <button 
          className="submit-feedback-btn" 
          onClick={handleSubmitFeedback}
          disabled={!feedback.trim()}
        >
          Submit Feedback
        </button>
      </div>
      
      {currentPdf && (
        <div className="current-document">
          <h3>Current Document</h3>
          <div className="document-info">
            <div className="document-name">{currentPdf.name || 'requirements-spec.pdf'}</div>
            <div className="document-upload-date">
              Uploaded on {formatDate(currentPdf.uploadDate)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RightPanel;
