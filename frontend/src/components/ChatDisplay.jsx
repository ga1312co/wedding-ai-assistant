import React from 'react';
import SpeechBubble from './SpeechBubble';
import './Chat.css';
import catsImage from '../assets/cats.png';

function ChatDisplay({
  botMessage,
  displayBotMessage,
  speechBubbleVisible,
  isTyping,
  handleTypingEnd,
  lastUserMessage,
  setIsChatHistoryExpanded,
  renderMessageContent,
}) {
  return (
    <>
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
          {renderMessageContent(lastUserMessage)}
        </SpeechBubble>
      )}
    </>
  );
}

export default ChatDisplay;
