import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ConversationsList from './ConversationsList';
import ConversationArea from './ConversationArea';
import RightPanel from './RightPanel';
import TopPanel from './TopPanel';
import '../styles/Dashboard.css'; // Main dashboard styles
import '../styles/ResponsiveDashboard.css'; // Add this new CSS file for responsive styles

// Simple Burger Icon component (or use an icon library)
const BurgerIcon = ({ onClick, className }) => (
    <button onClick={onClick} className={`burger-menu ${className || ''}`}>
        <span></span>
        <span></span>
        <span></span>
    </button>
);

function Dashboard({ token, onLogout }) {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [currentPdf, setCurrentPdf] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State for panel visibility and screen size
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 721);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(!isSmallScreen); // Open by default on large screens
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(!isSmallScreen); // Open by default on large screens


    // --- Existing useEffect and functions (fetchConversations, handlePdfUpload, etc.) ---
    // Keep your existing functions like fetchConversations, handlePdfUpload,
    // handleNewChat, handleSelectConversation, handleSendQuestion, handleSubmitFeedback

    // Add window resize listener
    const checkScreenSize = useCallback(() => {
        const small = window.innerWidth < 721;
        setIsSmallScreen(small);
        // Automatically open panels if resizing back to large screen, close if resizing to small
        if (!small) {
            setIsLeftPanelOpen(true);
            setIsRightPanelOpen(true);
        } else {
             // Optional: close panels when resizing to small screen if they were open
             // setIsLeftPanelOpen(false);
             // setIsRightPanelOpen(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', checkScreenSize);
        checkScreenSize(); // Initial check

        // Cleanup listener on component unmount
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [checkScreenSize]);


    // Toggle functions for panels
    const toggleLeftPanel = () => {
        if (isSmallScreen) {
            setIsLeftPanelOpen(!isLeftPanelOpen);
            // Optionally close the right panel if the left one is opened on small screens
            if (!isLeftPanelOpen && isRightPanelOpen) {
                setIsRightPanelOpen(false);
            }
        }
    };

    const toggleRightPanel = () => {
        if (isSmallScreen) {
            setIsRightPanelOpen(!isRightPanelOpen);
             // Optionally close the left panel if the right one is opened on small screens
             if (!isRightPanelOpen && isLeftPanelOpen) {
                setIsLeftPanelOpen(false);
            }
        }
    };

    // --- Fetch Conversations ---
    const fetchConversations = useCallback(async () => {
        setIsLoading(true);
        try {
          const response = await axios.get('/api/conversations', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setConversations(response.data);
          if (response.data.length > 0 && !currentConversation) { // Select first only if none selected
            // Don't automatically select on mobile if panels start closed
             if (!isSmallScreen) {
                 setCurrentConversation(response.data[0]);
             }
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
      }, [token, onLogout, isSmallScreen, currentConversation]); // Add dependencies

    useEffect(() => {
      fetchConversations();
    }, [fetchConversations]); // Use the memoized fetchConversations

    // --- Other Handlers (handlePdfUpload, handleNewChat, etc.) ---
    // Ensure these functions remain largely the same, but consider UX on small screens
    // e.g., after handleNewChat or handleSelectConversation, maybe close the left panel on small screens.

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
          // Potentially create a new conversation automatically or switch view
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
        if(isSmallScreen) setIsLeftPanelOpen(false); // Close panel after action on small screens
      };

      const handleSelectConversation = (conversation) => {
        setCurrentConversation(conversation);
         if(isSmallScreen) setIsLeftPanelOpen(false); // Close panel after action on small screens
      };

      const handleSendQuestion = async (question) => {
        if (!currentConversation) return;

        const tempMessage = {
          id: `temp-${Date.now()}`,
          content: question,
          type: 'question',
          timestamp: new Date().toISOString()
        };

        // Find the conversation to update (handle temp IDs)
        const conversationIdToUpdate = currentConversation.id.toString().startsWith('temp-') ? currentConversation.id : parseInt(currentConversation.id, 10);

        // Optimistically update UI
         const updatedConversation = {
           ...currentConversation,
           messages: [...(currentConversation.messages || []), tempMessage]
         };
        setCurrentConversation(updatedConversation); // Update current view immediately

        // Update the main list as well
        setConversations(prevConversations =>
            prevConversations.map(c =>
              c.id === conversationIdToUpdate ? updatedConversation : c
            )
          );


        try {
          const response = await axios.post('/api/questions', {
            conversationId: currentConversation.id.toString().startsWith('temp-') ? null : currentConversation.id, // Send null for temp IDs
            question,
            documentId: currentPdf?.id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

           // API response includes the full updated conversation or just the new message/answer details
           const answerMessage = {
            id: response.data.messageId || `server-${Date.now()}`, // Use ID from response if available
            content: response.data.answer,
            type: 'answer',
            timestamp: new Date().toISOString(),
            citations: response.data.citations || []
          };

          // Use conversationId from response if it was a new chat
          const finalConversationId = response.data.conversationId || conversationIdToUpdate;

          // Update the specific conversation in the state with the server response
          setConversations(prevConversations =>
            prevConversations.map(c => {
              if (c.id === conversationIdToUpdate || (c.id.toString().startsWith('temp-') && finalConversationId === response.data.conversationId)) {
                 // Replace temp message with actual question if API provides it, otherwise keep temp
                 const messagesWithoutTemp = (updatedConversation.messages || []).filter(m => m.id !== tempMessage.id);
                return {
                  ...c,
                  id: finalConversationId, // Update ID if it was temporary
                  messages: [...messagesWithoutTemp, /* optional: real question data if returned */ answerMessage]
                };
              }
              return c;
            })
          );

          // Update the currently viewed conversation state
          setCurrentConversation(prev => ({
                ...prev,
                id: finalConversationId,
                 messages: [...(prev.messages || []).filter(m => m.id !== tempMessage.id), /* optional: real question data */ answerMessage]
          }));


        } catch (err) {
          setError('Failed to get answer');
          console.error('Error sending question:', err);
           // Revert optimistic update on error if desired
           setConversations(prevConversations =>
            prevConversations.map(c =>
              c.id === conversationIdToUpdate ? { ...c, messages: (c.messages || []).filter(m => m.id !== tempMessage.id) } : c
            )
          );
          setCurrentConversation(prev => ({ ...prev, messages: (prev.messages || []).filter(m => m.id !== tempMessage.id) }));
        }
      };


       const handleSubmitFeedback = async (feedback) => {
         if (!currentConversation || !currentConversation.messages || currentConversation.messages.length === 0) {
            setError('Cannot submit feedback without a conversation or messages.');
            return;
        }
        const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];

        try {
          await axios.post('/api/feedback', {
            feedback,
            conversationId: currentConversation?.id.toString().startsWith('temp-') ? null : currentConversation.id,
            lastMessageId: lastMessage?.id.toString().startsWith('temp-') || lastMessage?.id.toString().startsWith('server-') ? null : lastMessage?.id // Handle temp/server IDs
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Show success message (optional)
          alert('Feedback submitted!');
           if(isSmallScreen) setIsRightPanelOpen(false); // Close panel after action on small screens
        } catch (err) {
          setError('Failed to submit feedback');
          console.error('Error submitting feedback:', err);
        }
      };


    // --- Loading State ---
    if (isLoading && conversations.length === 0) {
        return <div className="loading">Loading...</div>;
    }

    // --- Render Logic ---
    return (
        <div className={`dashboard ${isSmallScreen ? 'small-screen' : ''}`}>
            {/* Pass toggle functions and panel states to TopPanel if needed */}
            <TopPanel onUploadPdf={handlePdfUpload} onLogout={onLogout} />

            <div className="main-content">
                {/* Left Burger Menu (only on small screens) */}
                {isSmallScreen && <BurgerIcon onClick={toggleLeftPanel} className="left-burger" />}

                {/* Left Panel (Conversations List) */}
                <div className={`left-panel-container ${isLeftPanelOpen ? 'open' : 'closed'}`}>
                    <ConversationsList
                        conversations={conversations}
                        currentConversation={currentConversation}
                        onSelectConversation={handleSelectConversation}
                        onNewChat={handleNewChat}
                    />
                </div>

                {/* Main Conversation Area */}
                <div className="conversation-area-container">
                    <ConversationArea
                        conversation={currentConversation}
                        onSendQuestion={handleSendQuestion}
                    />
                </div>

                {/* Right Panel (Feedback/Document Info) */}
                 <div className={`right-panel-container ${isRightPanelOpen ? 'open' : 'closed'}`}>
                    <RightPanel
                        onSubmitFeedback={handleSubmitFeedback}
                        currentPdf={currentPdf}
                    />
                </div>

                 {/* Right Burger Menu (only on small screens) */}
                 {isSmallScreen && <BurgerIcon onClick={toggleRightPanel} className="right-burger" />}
            </div>

            {error && <div className="error-toast">{error}</div>}
        </div>
    );
}

export default Dashboard;