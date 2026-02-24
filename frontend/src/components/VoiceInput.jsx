import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import './VoiceInput.css';

const VoiceInput = ({ onTranscript, disabled = false, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('🎤 Listening...', { duration: 2000 });
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
        } else if (event.error === 'no-speech') {
          toast('No speech detected', { icon: '🤔' });
        } else {
          toast.error(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      toast('Stopped listening', { icon: '🛑' });
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <button
        className={`voice-input-btn not-supported ${className}`}
        disabled
        title="Speech recognition not supported in this browser"
      >
        <span className="voice-input-icon">🎤</span>
        <span>Not Supported</span>
      </button>
    );
  }

  return (
    <button
      className={`voice-input-btn ${isListening ? 'listening' : ''} ${className}`}
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      <span className="voice-input-icon">
        {isListening ? '🔴' : '🎤'}
      </span>
      <span>{isListening ? 'Listening...' : 'Voice'}</span>
    </button>
  );
};

export default VoiceInput;
