import React from 'react';
import './Chat.css'; // Assuming Chat.css contains styles for input-area

function ChatInput({ input, setInput, handleSendMessage }) {
  return (
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
  );
}

export default ChatInput;
