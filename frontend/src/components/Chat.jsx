import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/api';
import SpeechBubble from './SpeechBubble'; // Import SpeechBubble
import './Chat.css';
import catsImage from '../assets/cats.png';

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
          <div className="cats-image-container">
            <SpeechBubble
              isVisible={speechBubbleVisible}
              isTyping={isTyping}
              type="ai"
              onTypingEnd={handleTypingEnd}
            >
              {botMessage && isTyping ? botMessage : displayBotMessage && renderMessageContent(displayBotMessage)}
            </SpeechBubble>
            <img src={catsImage} alt="Cats" className="cats-image" />
          </div>
          <div className="floor"></div>
          {lastUserMessage && (
            <SpeechBubble isVisible={true} type="user" className="user-last-message-bubble-position">
              <button className="expand-button" onClick={() => setIsChatHistoryExpanded(true)}>☰</button>
              <div className="user-message-text">{renderMessageContent(lastUserMessage)}</div>
            </SpeechBubble>
          )}
          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Fråga mig om bröllopet..."
            />
            <button onClick={handleSendMessage}>➾</button>
          </div>
        </>
      )}

      {isChatHistoryExpanded && (
        <div className="expanded-chat-history">
          <button className="minimize-button" onClick={() => setIsChatHistoryExpanded(false)}>✕</button>
          <h2>Chat History</h2>
          <div className="history-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`history-message ${msg.sender}`}>
                <strong>{msg.sender === 'user' ? 'You:' : 'AI:'}</strong> {renderMessageContent(msg.text)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
