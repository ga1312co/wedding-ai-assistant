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
  const [isSleeping, setIsSleeping] = useState(false);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [sleepRequested, setSleepRequested] = useState(false); // new
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
    const raw = input.trim().toLowerCase();

    // If bot previously asked to sleep and user answers affirmatively
    if (sleepRequested && !isSleeping && !rateLimitReached) {
      // Expanded affirmative logic: any affirmative token present and no negation
      const affirmativeTokenRegex = /\b(ja|japp|ok|okej|okay|yes|sure|absolut|gärna|visst|kör|gör det|låter bra|ta en tupplur|ta tupplur|sov)\b/i;
      const negativeRegex = /\b(nej|inte|ej|vill inte|no|nope)\b/i;
      if (affirmativeTokenRegex.test(raw) && !negativeRegex.test(raw)) {
        setSleepRequested(false);
        setIsSleeping(true);
        const systemMsg = { text: 'Zzz...', sender: 'model' };
        setMessages(prev => [...prev, { text: input, sender: 'user' }, systemMsg]);
        setLastUserMessage(input);
        setInput('');
        setBotMessage(systemMsg.text);
        return;
      } else {
        // User declined or unclear
        setSleepRequested(false);
      }
    }

    // Manual sleep command still supported
    if (raw === 'sov' && !isSleeping && !rateLimitReached) {
      setSleepRequested(false);
      setIsSleeping(true);
      const systemMsg = { text: 'Zzz...', sender: 'model' };
      setMessages(prev => [...prev, { text: input, sender: 'user' }, systemMsg]);
      setLastUserMessage(input);
      setInput('');
      setBotMessage(systemMsg.text);
      return;
    }

    if (isSleeping && !rateLimitReached) {
      setIsSleeping(false);
    }

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setLastUserMessage(input);
    setInput('');
    setSpeechBubbleVisible(false);
    setIsTyping(false);

    if (rateLimitReached) {
      return;
    }

    try {
      const response = await sendMessage(
        userMessage.text,
        messages.map(msg => ({ text: msg.text, sender: msg.sender })),
        sessionIdRef.current
      );
      setBotMessage(response.text);
      setMessages(prev => [...prev, { text: response.text, sender: 'model' }]);

      // Detect if bot is asking permission to sleep
      if (!isSleeping && !rateLimitReached) {
        const sleepPromptRegex = /(tupplur|får jag.*sova|kan jag.*sova|ska jag.*sova|sova nu|får jag ta en liten tupplur|får jag vila)/i;
        if (sleepPromptRegex.test(response.text)) {
          setSleepRequested(true);
        } else {
          setSleepRequested(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error?.response?.status === 429) {
        setIsSleeping(true);
        setRateLimitReached(true);
        setSleepRequested(false);
      }
      const serverMsg = error?.response?.status === 429
        ? (error.response.data?.message || 'Du har nått gränsen för idag. Jag sover nu.')
        : 'Error: Could not connect to the chatbot.';
      setBotMessage(serverMsg);
      setMessages(prev => [...prev, { text: serverMsg, sender: 'model' }]);
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
            isSleeping={isSleeping} // new prop
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