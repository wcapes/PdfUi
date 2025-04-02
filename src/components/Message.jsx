import React from 'react';
import '../styles/Message.css';

function Message({ message }) {
  return (
    <div className={`message ${message.type}`}>
      <div className="message-avatar">
        {message.type === 'question' ? (
          <div className="user-avatar">👤</div>
        ) : (
          <div className="ai-avatar">🤖</div>
        )}
      </div>
      
      <div className="message-content">
        <div className="message-text">{message.content}</div>
        
        {message.type === 'answer' && message.citations && message.citations.length > 0 && (
          <div className="citations">
            <div className="citations-title">Citations:</div>
            {message.citations.map((citation, index) => (
              <div key={index} className="citation">
                {citation.document}, Page {citation.page}: "{citation.text}"
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
