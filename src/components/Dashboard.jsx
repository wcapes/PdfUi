import '../styles/ResponsiveDashboard.css'; // Import the responsive CSS file

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import axios from 'axios';
import ConversationsList from './ConversationsList';
import ConversationArea from './ConversationArea';
import RightPanel from './RightPanel';
import TopPanel from './TopPanel';
import '../styles/Dashboard.css'; // Main dashboard styles

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

    // --- START: State for panel visibility and screen size ---
    // Initialize based on current window width
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 721);
    // Default panels to closed on small screens, open on large screens
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(window.innerWidth >= 721);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(window.innerWidth >= 721);
    // --- END: State ---


    // --- START: Window resize listener ---
    const checkScreenSize = useCallback(() => {
        const currentlySmall = window.innerWidth < 721;
        // Check if the screen size state *needs* to change
        if (currentlySmall !== isSmallScreen) {
            setIsSmallScreen(currentlySmall);
            // Explicitly set panel states based on the *new* screen size state
            // If it just became small (currentlySmall is true), close panels (!currentlySmall is false)
            // If it just became large (currentlySmall is false), open panels (!currentlySmall is true)
            setIsLeftPanelOpen(!currentlySmall);
            setIsRightPanelOpen(!currentlySmall);
        }
    }, [isSmallScreen]); // Re-run checker only when isSmallScreen state changes

    useEffect(() => {
        // Run the check once on mount in case the initial state is wrong
        checkScreenSize();

        window.addEventListener('resize', checkScreenSize);
        // Cleanup listener on component unmount
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [checkScreenSize]); // Depend on the memoized checker function
    // --- END: Window resize listener ---


    // --- START: Toggle functions for panels (only work on small screens) ---
    const toggleLeftPanel = () => {
        if (isSmallScreen) {
            setIsLeftPanelOpen(prev => !prev); // Toggle current state
            // Close right panel if opening left on small screen
            if (!isLeftPanelOpen && isRightPanelOpen) { // Check *before* state update finishes
                setIsRightPanelOpen(false);
            }
        }
    };

    const toggleRightPanel = () => {
        if (isSmallScreen) {
            setIsRightPanelOpen(prev => !prev); // Toggle current state
             // Close left panel if opening right on small screen
             if (!isRightPanelOpen && isLeftPanelOpen) { // Check *before* state update finishes
                setIsLeftPanelOpen(false);
            }
        }
    };
     // --- END: Toggle functions ---

    // --- Fetch Conversations (Using useCallback) ---
    const fetchConversations = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        try {
          const response = await axios.get('/api/conversations', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fetchedConversations = response.data || [];
          setConversations(fetchedConversations);
          // Select first conversation only if none selected AND on a large screen initially
          if (fetchedConversations.length > 0 && !currentConversation && window.innerWidth >= 721) {
             setCurrentConversation(fetchedConversations[0]);
          } else if (fetchedConversations.length === 0) {
            setCurrentConversation(null);
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
      }, [token, onLogout, currentConversation, isLoading]); // Correct dependencies

    useEffect(() => {
      fetchConversations();
      // Fetch conversations on mount or if token changes
    }, [token, fetchConversations]); // Use memoized fetchConversations

    // --- Other Handlers (handlePdfUpload, handleNewChat, etc. - Include previous versions) ---
      const handlePdfUpload = async (file) => {
        const formData = new FormData();
        formData.append('pdf', file);
        setError('');
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
          if(isSmallScreen) setIsRightPanelOpen(false);
        } catch (err) {
          setError('Failed to upload PDF');
          console.error('Error uploading PDF:', err);
        }
      };

      const handleNewChat = () => {
        setError('');
        const newConversation = {
          id: `temp-${Date.now()}`,
          title: 'New Conversation',
          timestamp: new Date().toISOString(),
          messages: []
        };
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
        if (!currentConversation || !question.trim()) return;
        setError('');
        const tempMessageId = `temp-msg-${Date.now()}`;
        const tempMessage = { id: tempMessageId, content: question, type: 'question', timestamp: new Date().toISOString() };
        const conversationIdToUpdate = currentConversation.id;

        setCurrentConversation(prev => ({ ...prev, messages: [...(prev?.messages || []), tempMessage] }));
        setConversations(prevList => prevList.map(c => c.id === conversationIdToUpdate ? { ...c, messages: [...(c.messages || []), tempMessage] } : c ));

        try {
          const response = await axios.post('/api/questions', {
            conversationId: conversationIdToUpdate.toString().startsWith('temp-') ? null : conversationIdToUpdate,
            question,
            documentId: currentPdf?.id
          }, { headers: { Authorization: `Bearer ${token}` } });

          const answerMessage = { id: response.data.messageId || `server-ans-${Date.now()}`, content: response.data.answer, type: 'answer', timestamp: new Date().toISOString(), citations: response.data.citations || [] };
          const finalConversationId = response.data.conversationId || conversationIdToUpdate;

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
          setCurrentConversation(prev => ({ ...prev, messages: (prev?.messages || []).filter(m => m.id !== tempMessageId) }));
          setConversations(prevList => prevList.map(c => c.id === conversationIdToUpdate ? { ...c, messages: (c.messages || []).filter(m => m.id !== tempMessageId) } : c ));
        }
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


    // --- Loading State ---
    if (isLoading && conversations.length === 0) {
        return <div className="loading">Loading initial data...</div>;
    }

    // --- Render Logic ---
    return (
        <div className={`dashboard ${isSmallScreen ? 'small-screen' : ''}`}>
            <TopPanel onUploadPdf={handlePdfUpload} onLogout={onLogout} />
            <div className="main-content">
                 {isSmallScreen && <BurgerIcon onClick={toggleLeftPanel} className="left-burger" />}
                {/* Apply open/closed class based on state */}
                <div className={`left-panel-container ${isLeftPanelOpen ? 'open' : 'closed'}`}>
                    <ConversationsList conversations={conversations} currentConversation={currentConversation} onSelectConversation={handleSelectConversation} onNewChat={handleNewChat} isLoading={isLoading && conversations.length > 0}/>
                </div>
                <div className="conversation-area-container">
                     {!currentConversation && (<div className="no-conversation-selected">{conversations.length > 0 ? 'Select or start a conversation.' : 'Start a new conversation.'}</div>)}
                    <ConversationArea key={currentConversation?.id || 'new'} conversation={currentConversation} onSendQuestion={handleSendQuestion}/>
                </div>
                 {/* Apply open/closed class based on state */}
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