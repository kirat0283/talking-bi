import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, SendHorizontal } from 'lucide-react';

const ChatInput = ({ onSend, isSending }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup web speech api
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoice = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    } else {
        if(recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
        } else {
            alert('Speech Recognition is not supported in this browser.');
        }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    onSend(text);
    setText('');
  };

  return (
    <div className="flex-none mt-auto pt-6 relative z-20">
      <form onSubmit={handleSubmit} className={`relative flex items-center shadow-lg rounded-full bg-black/80 border ${isSending ? 'border-cyan-400 shadow-cyan-500/50' : 'border-cyan-500/30'} overflow-hidden transition-all duration-300 hover:border-cyan-400/80`}>
        
        {/* Pulse effect when processing */}
        {isSending && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none"></div>}

        <button
            type="button"
            onClick={handleVoice}
            className={`p-4 focus:outline-none ${isListening ? 'text-rose-400 animate-pulse drop-shadow-md' : 'text-cyan-600 hover:text-cyan-300'} transition-colors z-10`}
            disabled={isSending}
        >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        
        <input
            className="flex-1 bg-transparent border-none text-white placeholder-cyan-800/60 focus:outline-none p-2 w-full font-mono text-[10px] tracking-[0.2em] relative z-10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="[ AWAITING_QUERY_INPUT ]"
            disabled={isSending}
        />
        
        <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="p-4 mr-1 focus:outline-none text-cyan-600 hover:text-cyan-300 disabled:opacity-40 disabled:hover:text-cyan-700 transition-colors z-10"
        >
            <SendHorizontal size={18} className={isSending ? 'animate-pulse text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
