import React from 'react';
import './Chat.css'; // Assuming Chat.css contains styles for expanded-chat-history

function ExpandedChatHistory({
  messages,
  minimizeChatHistory,
  renderMessageContent,
}) {
  return (
    <div className="expanded-chat-history">
      <button className="minimize-button" onClick={minimizeChatHistory}>✕</button>
      <h2>Chat History</h2>
      <div className="history-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`history-message ${msg.sender}`}>
            <strong>{msg.sender === 'user' ? 'You:' : 'AI:'}</strong> {renderMessageContent(msg.text)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpandedChatHistory;
