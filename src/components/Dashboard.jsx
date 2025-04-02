import React, { useState, useEffect, useCallback } from 'react'; // Ensure useCallback is imported
import axios from 'axios';
import ConversationsList from './ConversationsList';
import ConversationArea from './ConversationArea';
import RightPanel from './RightPanel';
import TopPanel from './TopPanel';
import '../styles/Dashboard.css'; // Main dashboard styles
import '../styles/ResponsiveDashboard.css'; // Import the responsive CSS file

// Simple Burger Icon component
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
    // Ensure isLoading starts true
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // --- START: State for panel visibility and screen size ---
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 721);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(window.innerWidth >= 721);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(window.innerWidth >= 721);
    // --- END: State ---

    // --- START: Window resize listener ---
    const checkScreenSize = useCallback(() => {
        const currentlySmall = window.innerWidth < 721;
        if (currentlySmall !== isSmallScreen) {
            setIsSmallScreen(currentlySmall);
            setIsLeftPanelOpen(!currentlySmall);
            setIsRightPanelOpen(!currentlySmall);
        }
    }, [isSmallScreen]); // Dependency array is correct

    useEffect(() => {
        checkScreenSize(); // Initial check
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [checkScreenSize]); // Dependency array is correct
    // --- END: Window resize listener ---

    // --- START: Toggle functions for panels ---
    const toggleLeftPanel = () => {
        if (isSmallScreen) {
            setIsLeftPanelOpen(prev => !prev);
            if (!isLeftPanelOpen && isRightPanelOpen) {
                setIsRightPanelOpen(false);
            }
        }
    };
    const toggleRightPanel = () => {
        if (isSmallScreen) {
            setIsRightPanelOpen(prev => !prev);
             if (!isRightPanelOpen && isLeftPanelOpen) {
                setIsLeftPanelOpen(false);
            }
        }
    };
    // --- END: Toggle functions ---

    // --- START: Fetch Conversations (Optimized with useCallback) ---
    const fetchConversations = useCallback(async () => {
        // Removed the check for isLoading here, setting it unconditionally
        setIsLoading(true); // Set loading true at the start of fetch attempt
        setError(''); // Clear previous errors
        try {
          const response = await axios.get('/api/conversations', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fetchedConversations = response.data || [];
          setConversations(fetchedConversations);

          // Select first conversation only if none selected AND on a large screen
          // Check if currentConversation *still* doesn't exist after potential state updates
          if (fetchedConversations.length > 0 && !currentConversation && window.innerWidth >= 721) {
             setCurrentConversation(fetchedConversations[0]);
          } else if (fetchedConversations.length === 0) {
            setCurrentConversation(null); // Clear selection if no conversations
          }
          // If currentConversation *does* exist, don't change it here

        } catch (err) {
          setError('Failed to fetch conversations');
          console.error('Error fetching conversations:', err);
          if (err.response && err.response.status === 401) {
            onLogout(); // Logout on authorization failure
          }
        } finally {
          // CRITICAL: Ensure isLoading is set to false after fetch attempt completes
          setIsLoading(false);
        }
        // Dependencies for useCallback: token changes or logout function changes should trigger re-creation
        // Avoid adding 'currentConversation' or 'isLoading' here to prevent loops
      }, [token, onLogout]);

    // Effect to run fetchConversations on mount and when the function itself changes (due to token/onLogout change)
    useEffect(() => {
      fetchConversations();
    }, [fetchConversations]); // Dependency array is correct
    // --- END: Fetch Conversations ---

    // --- Other Handlers (handlePdfUpload, handleNewChat, etc. - Make sure these are complete) ---
      const handlePdfUpload = async (file) => {
        const formData = new FormData();
        formData.append('pdf', file);
        setError('');
        // Consider setting a specific loading state for upload if needed
        try {
          const response = await axios.post('/api/pdfs', formData, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          setCurrentPdf({ name: file.name, uploadDate: new Date().toISOString(), ...response.data });
          if(isSmallScreen) setIsRightPanelOpen(false);
        } catch (err) { setError('Failed to upload PDF'); console.error('Error uploading PDF:', err); }
        // Reset upload loading state here if used
      };

      const handleNewChat = () => {
        setError('');
        const newConversation = { id: `temp-${Date.now()}`, title: 'New Conversation', timestamp: new Date().toISOString(), messages: [] };
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversation(newConversation);
        setCurrentPdf(null);
        if(isSmallScreen) setIsLeftPanelOpen(false);
      };

      const handleSelectConversation = (conversation) => {
         setError('');
         if (currentConversation?.id !== conversation.id) {
             setCurrentConversation(conversation);
         }
         if(isSmallScreen) setIsLeftPanelOpen(false);
      };

      const handleSendQuestion = async (question) => {
        // Basic validation
        if (!currentConversation || !question.trim()) return;
        setError('');
        const tempMessageId = `temp-msg-${Date.now()}`;
        const tempMessage = { id: tempMessageId, content: question, type: 'question', timestamp: new Date().toISOString() };
        const conversationIdToUpdate = currentConversation.id;

        // Optimistic UI updates
        setCurrentConversation(prev => ({ ...prev, messages: [...(prev?.messages || []), tempMessage] }));
        setConversations(prevList => prevList.map(c => c.id === conversationIdToUpdate ? { ...c, messages: [...(c.messages || []), tempMessage] } : c ));

        // API call (ensure try/catch/finally handles errors)
        try {
          const response = await axios.post('/api/questions', {
            conversationId: conversationIdToUpdate.toString().startsWith('temp-') ? null : conversationIdToUpdate,
            question,
            documentId: currentPdf?.id
          }, { headers: { Authorization: `Bearer ${token}` } });

          const answerMessage = { id: response.data.messageId || `server-ans-${Date.now()}`, content: response.data.answer, type: 'answer', timestamp: new Date().toISOString(), citations: response.data.citations || [] };
          const finalConversationId = response.data.conversationId || conversationIdToUpdate;

          // Update state with actual data
          setCurrentConversation(prev => {
            const messagesWithoutTemp = (prev?.messages || []).filter(m => m.id !== tempMessageId);
            return { ...prev, id: finalConversationId, messages: [...messagesWithoutTemp, answerMessage] };
          });
          setConversations(prevList => prevList.map(c => {
            if (c.id === conversationIdToUpdate || (c.id.toString().startsWith('temp-') && finalConversationId === response.data.conversationId)) {
              const messagesWithoutTemp = (c.messages || []).filter(m => m.id !== tempMessageId);
              return { ...c, id: finalConversationId, messages: [...messagesWithoutTemp, answerMessage] };
            } return c;
          }));
        } catch (err) {
          setError('Failed to get answer'); console.error('Error sending question:', err);
          // Revert optimistic update on error
          setCurrentConversation(prev => ({ ...prev, messages: (prev?.messages || []).filter(m => m.id !== tempMessageId) }));
          setConversations(prevList => prevList.map(c => c.id === conversationIdToUpdate ? { ...c, messages: (c.messages || []).filter(m => m.id !== tempMessageId) } : c ));
        }
        // No finally block needed here unless specific cleanup is required
      };

      const handleSubmitFeedback = async (feedback) => {
         if (!currentConversation || !feedback.trim()) { setError('Please select a conversation and enter feedback.'); return; }
         const lastAnswerMessage = [...(currentConversation.messages || [])].reverse().find(m => m.type === 'answer');
         setError('');
         try {
           await axios.post('/api/feedback', {
             feedback,
             conversationId: currentConversation.id.toString().startsWith('temp-') ? null : currentConversation.id,
             lastMessageId: lastAnswerMessage?.id.toString().startsWith('server-') ? null : lastAnswerMessage?.id
           }, { headers: { Authorization: `Bearer ${token}` } });
           alert('Feedback submitted!');
            if(isSmallScreen) setIsRightPanelOpen(false);
         } catch (err) { setError('Failed to submit feedback'); console.error('Error submitting feedback:', err); }
       };
    // --- End Other Handlers ---


    // --- START: Modified Loading Condition ---
    // Show loading message *only* while isLoading is true.
    // It's okay if conversations is empty initially, the main area will show a message.
    if (isLoading) {
        // Changed the text slightly for clarity
        return <div className="loading">Loading conversations...</div>;
    }
    // --- END: Modified Loading Condition ---


    // --- Render Logic (Ensure panel containers and classes are present) ---
    return (
        <div className={`dashboard ${isSmallScreen ? 'small-screen' : ''}`}>
            <TopPanel onUploadPdf={handlePdfUpload} onLogout={onLogout} />
            <div className="main-content">
                 {isSmallScreen && <BurgerIcon onClick={toggleLeftPanel} className="left-burger" />}
                {/* Panel container with dynamic class */}
                <div className={`left-panel-container ${isLeftPanelOpen ? 'open' : 'closed'}`}>
                    <ConversationsList conversations={conversations} currentConversation={currentConversation} onSelectConversation={handleSelectConversation} onNewChat={handleNewChat}/>
                </div>
                <div className="conversation-area-container">
                     {!currentConversation && (<div className="no-conversation-selected">{conversations.length > 0 ? 'Select or start a conversation.' : 'Start a new conversation.'}</div>)}
                    <ConversationArea key={currentConversation?.id || 'new'} conversation={currentConversation} onSendQuestion={handleSendQuestion}/>
                </div>
                 {/* Panel container with dynamic class */}
                 <div className={`right-panel-container ${isRightPanelOpen ? 'open' : 'closed'}`}>
                    <RightPanel key={currentPdf?.id || currentConversation?.id || 'default'} onSubmitFeedback={handleSubmitFeedback} currentPdf={currentPdf} conversationId={currentConversation?.id}/>
                </div>
                 {isSmallScreen && <BurgerIcon onClick={toggleRightPanel} className="right-burger" />}
            </div>
            {error && (<div className="error-toast" onClick={() => setError('')}>{error} <span style={{ cursor: 'pointer', marginLeft: '15px', fontWeight: 'bold'}}>X</span></div>)}
        </div>
    );
}

export default Dashboard;