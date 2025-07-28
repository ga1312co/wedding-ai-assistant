import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, delay = 100, onTypingEnd }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    if (typingComplete) return; // Stop if typing is already complete

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      setTypingComplete(true); // Mark typing as complete
      if (onTypingEnd) {
        onTypingEnd();
      }
    }
  }, [currentIndex, delay, text, onTypingEnd, typingComplete]);

  // If typing is complete, always return the full text
  if (typingComplete) {
    return <span>{text}</span>;
  }

  return <span>{currentText}</span>;
};

export default TypewriterText;
