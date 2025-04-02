import React, { useState } from 'react';
import '../styles/QuestionInput.css';

function QuestionInput({ onSendQuestion }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSendQuestion(question);
      setQuestion('');
    }
  };

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button type="submit" disabled={!question.trim()}>
        <i className="send-icon"></i> Send
      </button>
    </form>
  );
}

export default QuestionInput;
