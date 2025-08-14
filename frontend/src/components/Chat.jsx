import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { sendMessage } from '../services/api';
import ChatInput from './ChatInput';
import ChatDisplay from './ChatDisplay';
import ExpandedChatHistory from './ExpandedChatHistory';
import Rsvp from './Rsvp';
import './Chat.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [botMessage, setBotMessage] = useState(null);
  const [displayBotMessage, setDisplayBotMessage] = useState(null);
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);

  if (!sessionIdRef.current) {
    sessionIdRef.current = `sess_${Math.random().toString(16).slice(2)}${Date.now().toString(36)}`;
  }

  // Initial welcome message (no API call)
  useEffect(() => {
    if (messages.length === 0) {
      const initial = { text: 'Hej! Jag är Cleo. Fråga mig vad du vill om bröllopet. Du skriver ditt meddelande i rutan nedanför.', sender: 'model' };
      setMessages([initial]);
      setBotMessage(initial.text);
    }
  }, []); // run once

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (botMessage) {
      setDisplayBotMessage(null);
      setSpeechBubbleVisible(true);
      setIsTyping(true);
    } else {
      setSpeechBubbleVisible(false);
      setIsTyping(false);
      const fadeOutDuration = 300;
      setTimeout(() => {
        setDisplayBotMessage(null);
      }, fadeOutDuration);
    }
  }, [botMessage]);

  const handleTypingEnd = () => {
    setIsTyping(false);
    setDisplayBotMessage(botMessage);
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLastUserMessage(input);
    setInput('');

    setSpeechBubbleVisible(false);
    setIsTyping(false);

    try {
      const response = await sendMessage(
        input,
        messages.map(msg => ({ text: msg.text, sender: msg.sender })),
        sessionIdRef.current
      );
      setBotMessage(response.text);
      setMessages((prevMessages) => [...prevMessages, { text: response.text, sender: 'model' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      const serverMsg = error?.response?.status === 429
        ? (error.response.data?.message || 'Du har nått gränsen för idag.')
        : 'Error: Could not connect to the chatbot.';
      setBotMessage(serverMsg);
      setMessages((prevMessages) => [...prevMessages, { text: serverMsg, sender: 'model' }]);
    }
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    let content = text;

    // 1. Convert Markdown links [text](url) to plain anchor once
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
      // If label equals url (common duplication), show just the URL once
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label === url ? url : label}</a>`;
    });

    // 2. Extract existing anchors to avoid double-linkifying their URLs
    const anchorTokens = [];
    content = content.replace(/<a\b[^>]*>.*?<\/a>/gi, (m) => {
      const token = `__ANCHOR_${anchorTokens.length}__`;
      anchorTokens.push(m);
      return token;
    });

    // 3. Linkify remaining plain URLs (not already linked)
    content = content.replace(/(?<!["'=])(https?:\/\/[^\s)<>"']+)/g, (m) => {
      return `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`;
    });

    // 4. Restore anchors
    anchorTokens.forEach((a, i) => {
      content = content.replace(`__ANCHOR_${i}__`, a);
    });

    return <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />;
  };

  return (
    <div className="chat-container">
      {!isChatHistoryExpanded && (
        <>
          <div className="messages">
            <div ref={messagesEndRef} />
          </div>
          <ChatDisplay
            botMessage={botMessage}
            displayBotMessage={displayBotMessage}
            speechBubbleVisible={speechBubbleVisible}
            isTyping={isTyping}
            handleTypingEnd={handleTypingEnd}
            lastUserMessage={lastUserMessage}
            setIsChatHistoryExpanded={setIsChatHistoryExpanded}
            renderMessageContent={renderMessageContent}
          />
          <div className="input-container">
            <button className="rsvp-button" onClick={() => setIsRsvpOpen(true)}>OSA</button>
            <ChatInput
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
            />
          </div>
        </>
      )}

      {isChatHistoryExpanded && (
        <ExpandedChatHistory
          messages={messages}
          minimizeChatHistory={() => setIsChatHistoryExpanded(false)}
          renderMessageContent={renderMessageContent}
        />
      )}

      {isRsvpOpen && <Rsvp onClose={() => setIsRsvpOpen(false)} />}
    </div>
  );
}

export default Chat;