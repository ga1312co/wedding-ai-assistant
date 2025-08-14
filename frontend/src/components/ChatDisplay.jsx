import React from 'react';
import SpeechBubble from './SpeechBubble';
import './Chat.css';
import sofaImage from '../assets/sofa.png';
import cleoImage from '../assets/cleo.png';
import cleoSleepingImage from '../assets/cleosleeping.png';

function ChatDisplay({
  botMessage,
  displayBotMessage,
  speechBubbleVisible,
  isTyping,
  handleTypingEnd,
  lastUserMessage,
  setIsChatHistoryExpanded,
  renderMessageContent,
  isSleeping,
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
        <img src={sofaImage} alt="Soffa" className="sofa-image" />
        <img
          src={isSleeping ? cleoSleepingImage : cleoImage}
          alt="Cleo"
          className={`cleo-image ${isSleeping ? 'cleo-sleeping-image' : ''}`}
        />
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
