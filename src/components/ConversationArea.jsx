import React from 'react';
import Message from './Message';
import QuestionInput from './QuestionInput';
import '../styles/ConversationArea.css';

function ConversationArea({ conversation, onSendQuestion }) {
  if (!conversation) {
    return (
      <div className="conversation-area empty-state">
        <div className="empty-message">
          <i className="document-icon"></i>
          <p>Select a conversation or start a new chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-area">
      <div className="messages">
        {conversation.messages.map((message, index) => (
          <Message key={message.id || index} message={message} />
        ))}
      </div>
      
      <div className="question-input-container">
        <QuestionInput onSendQuestion={onSendQuestion} />
      </div>
    </div>
  );
}

export default ConversationArea;
