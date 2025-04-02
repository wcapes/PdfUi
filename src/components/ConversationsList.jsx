import React from 'react';
import '../styles/ConversationsList.css';

function ConversationsList({ conversations, currentConversation, onSelectConversation, onNewChat }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} minutes ago`;
    } else {
      return 'Yesterday';
    }
  };

  return (
    <div className="conversations-list">
      <button className="new-chat-btn" onClick={onNewChat}>
        <i className="new-chat-icon"></i> New Chat
      </button>
      
      <div className="conversations">
        {conversations.map(conversation => (
          <div 
            key={conversation.id} 
            className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="conversation-title">{conversation.title || 'Untitled Conversation'}</div>
            <div className="conversation-time">{formatDate(conversation.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConversationsList;
