import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/api';
import ChatInput from './ChatInput';
import ChatDisplay from './ChatDisplay';
import ExpandedChatHistory from './ExpandedChatHistory';
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
  const messagesEndRef = useRef(null);

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
      const response = await sendMessage(input, messages.map(msg => ({
        text: msg.text,
        sender: msg.sender
      })));
      setBotMessage(response.text);
      setMessages((prevMessages) => [...prevMessages, { text: response.text, sender: 'model' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setBotMessage('Error: Could not connect to the chatbot.');
      setMessages((prevMessages) => [...prevMessages, { text: 'Error: Could not connect to the chatbot.', sender: 'model' }]);
    }
  };

  const renderMessageContent = (text) => {
    let content = text;

    const imageMatch = content.match(/\[IMAGE:\s*(.*?) \]/);
    if (imageMatch) {
      const imageUrl = imageMatch[1];
      content = content.replace(imageMatch[0], `<img src="${imageUrl}" alt="Wedding Image" style="max-width:100%; height:auto; border-radius: 8px; margin-top: 10px;" />`);
    }

    const mapMatch = content.match(/\[MAP:\s*(.*?) \]/);
    if (mapMatch) {
      const address = mapMatch[1];
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      content = content.replace(mapMatch[0], `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">View Map for ${address}</a>`);
    }

    return <span dangerouslySetInnerHTML={{ __html: content }} />;
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
          <ChatInput
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
          />
        </>
      )}

      {isChatHistoryExpanded && (
        <ExpandedChatHistory
          messages={messages}
          minimizeChatHistory={() => setIsChatHistoryExpanded(false)}
          renderMessageContent={renderMessageContent}
        />
      )}
    </div>
  );
}

export default Chat;