import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/api';
import './Chat.css';
import catsImage from '../assets/cats.png';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [botMessage, setBotMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setBotMessage(null);

    try {
      const response = await sendMessage(input, messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })));
      setBotMessage(response.text);
    } catch (error) {
      console.error('Error sending message:', error);
      setBotMessage('Error: Could not connect to the chatbot.');
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
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {renderMessageContent(msg.text)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="cats-image-container">
        {botMessage && (
          <div className="speech-bubble visible">
            {renderMessageContent(botMessage)}
          </div>
        )}
        <img src={catsImage} alt="Cats" className="cats-image" />
      </div>
      <div className="floor"></div>
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
    </div>
  );
}

export default Chat;
