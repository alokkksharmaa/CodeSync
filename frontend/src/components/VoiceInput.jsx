import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Mic, MicOff, Square } from "lucide-react";
import "./VoiceInput.css";

const VoiceInput = ({ onTranscript, disabled = false, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Listening...", { duration: 2000, icon: "🎤" });
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }
        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          toast.error("Microphone access denied");
        } else if (event.error === "no-speech") {
          toast("No speech detected", { icon: "🤔" });
        } else if (event.error === "audio-capture") {
          toast.error("No microphone detected");
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
      toast("Stopped listening", { icon: "🛑" });
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={`voice-input-btn ${isListening ? "listening" : ""} ${className}`}
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? "Stop listening" : "Start voice input"}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      <span className="voice-input-icon">
        {isListening ? <Square size={14} /> : <Mic size={14} />}
      </span>
      {isListening ? <span>Listening</span> : null}
      {isListening && <span className="voice-input-wave" />}
    </button>
  );
};

export default VoiceInput;
