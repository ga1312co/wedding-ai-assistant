import React from 'react';
import TypewriterText from './TypewriterText';

function SpeechBubble({ children, isVisible, isTyping, type, onTypingEnd, className = '' }) {
  const renderContent = () => {
    if (isTyping && type === 'ai') {
      return <TypewriterText text={children} delay={50} onTypingEnd={onTypingEnd} />;
    } else {
      return children;
    }
  };

  return (
    <div className={`speech-bubble ${type === 'ai' ? 'ai-bubble' : 'user-bubble'} ${isVisible ? 'visible' : 'fade-out'} ${className}`}>
      {renderContent()}
    </div>
  );
}

export default SpeechBubble;
