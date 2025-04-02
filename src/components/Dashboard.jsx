import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConversationsList from './ConversationsList';
import ConversationArea from './ConversationArea';
import RightPanel from './RightPanel';
import TopPanel from './TopPanel';
import '../styles/Dashboard.css';

function Dashboard({ token, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [currentPdf, setCurrentPdf] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      if (response.data.length > 0) {
        setCurrentConversation(response.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
      if (err.response && err.response.status === 401) {
        onLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const response = await axios.post('/api/pdfs', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      setCurrentPdf({
        name: file.name,
        uploadDate: new Date().toISOString(),
        ...response.data
      });
      // Potentially create a new conversation automatically
    } catch (err) {
      setError('Failed to upload PDF');
      console.error('Error uploading PDF:', err);
    }
  };

  const handleNewChat = () => {
    const newConversation = {
      id: `temp-${Date.now()}`,
      title: 'New Conversation',
      timestamp: new Date().toISOString(),
      messages: []
    };
    
    setConversations([newConversation, ...conversations]);
    setCurrentConversation(newConversation);
  };

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleSendQuestion = async (question) => {
    if (!currentConversation) return;
    
    const tempMessage = { 
      id: `temp-${Date.now()}`, 
      content: question, 
      type: 'question', 
      timestamp: new Date().toISOString() 
    };
    
    // Optimistically update UI
    const updatedConversation = { 
      ...currentConversation, 
      messages: [...currentConversation.messages, tempMessage] 
    };
    setCurrentConversation(updatedConversation);
    
    try {
      const response = await axios.post('/api/questions', {
        conversationId: currentConversation.id !== `temp-${Date.now()}` ? currentConversation.id : null,
        question,
        documentId: currentPdf?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update with real data from API
      const actualAnswer = {
        id: response.data.id,
        content: response.data.answer,
        type: 'answer',
        timestamp: new Date().toISOString(),
        citations: response.data.citations || []
      };
      
      const finalConversation = {
        ...updatedConversation,
        id: response.data.conversationId, // In case it was a new conversation
        messages: [...updatedConversation.messages, actualAnswer]
      };
      
      // Update conversations list
      setConversations(conversations.map(c => 
        c.id === currentConversation.id ? finalConversation : c
      ));
      setCurrentConversation(finalConversation);
    } catch (err) {
      setError('Failed to get answer');
      console.error('Error sending question:', err);
    }
  };

  const handleSubmitFeedback = async (feedback) => {
    try {
      await axios.post('/api/feedback', {
        feedback,
        conversationId: currentConversation?.id,
        lastMessageId: currentConversation?.messages[currentConversation.messages.length - 1]?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Show success message
    } catch (err) {
      setError('Failed to submit feedback');
      console.error('Error submitting feedback:', err);
    }
  };

  if (isLoading && conversations.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <TopPanel onUploadPdf={handlePdfUpload} onLogout={onLogout} />
      
      <div className="main-content">
        <ConversationsList 
          conversations={conversations} 
          currentConversation={currentConversation} 
          onSelectConversation={handleSelectConversation} 
          onNewChat={handleNewChat}
        />
        
        <ConversationArea 
          conversation={currentConversation} 
          onSendQuestion={handleSendQuestion} 
        />
        
        <RightPanel 
          onSubmitFeedback={handleSubmitFeedback} 
          currentPdf={currentPdf}
        />
      </div>
      
      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}

export default Dashboard;
