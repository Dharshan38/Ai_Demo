import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';

const App = () => {
    const [status, setStatus] = useState("IDLE"); // IDLE, LISTENING, PROCESSING, SPEAKING
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("Say 'Hi Bell' to start...");
    const recognitionRef = useRef(null);
    const isWakingUp = useRef(false);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setResponse("Browser not supported. Use Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening for wake word
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            console.log("Voice Engine Started");
        };

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript.toLowerCase();
            setTranscript(transcriptText);

            // Wake Word Detection
            if (!isWakingUp.current && (status === "IDLE" || status === "MONITORING")) {
                if (transcriptText.includes("hi bell") || transcriptText.includes("hello bell") || transcriptText.includes("hey bell")) {
                    wakeup();
                }
            }
            // Active Command Listening
            else if (status === "LISTENING") {
                // We will handle the command in 'onend' or via a timeout silence detector if needed.
                // Actually for command phase, better to rely on end of speech or specific pause.
                // But since we are continuous, we need to manually decide when to stop.
                // Let's use a simpler approach: 
                // 1. Wake Detection Mode (Continuous)
                // 2. Command Mode (One-shot) -> switch recognition config?
            }
        };

        // Error handling to auto-restart listening
        recognition.onerror = (event) => {
            console.error("Speech error", event.error);
        };

        recognition.onend = () => {
            // Auto-restart if we shouldn't have stopped
            if (status === "IDLE" || status === "MONITORING") {
                startMonitoring();
            }
        };

        // Start listening immediately
        startMonitoring();

        return () => {
            recognition.stop();
        };

    }, []);

    const startMonitoring = () => {
        setStatus("IDLE");
        try {
            recognitionRef.current.continuous = true;
            recognitionRef.current.start();
        } catch (e) { /* ignore already started */ }
    };

    const wakeup = () => {
        isWakingUp.current = true;
        setStatus("LISTENING");
        speak("I'm listening", false); // Short feedback, false = don't set status to SPEAKING to avoid conflict

        // Reset recognition for Command Phase
        recognitionRef.current.stop(); // Stop continuous

        // Wait for stop, then start one-shot
        setTimeout(() => {
            isWakingUp.current = false;
            startOneShotListening();
        }, 1000);
    };

    const startOneShotListening = () => {
        try {
            const recognition = recognitionRef.current;
            recognition.continuous = false; // Stop after phrase
            recognition.start();
            setTranscript("");
        } catch (e) { console.log(e) }
    };

    // We need to hook into the one-shot result.
    // The main useEffect initializes it as continuous=true.
    // We need dynamic behavior.

    // REFACTOR: Use two separate recognition instances or re-config on fly is cleaner.
    // Let's use a standard pattern for Re-Config.

    return (
        <div className="orb-container">
            {/* Re-mount component to force clean logic or use better state management? 
                 For this snippet, let's just render the hook logic above. 
                 Actually, the logic above is a bit mixed. Let's fix it in the next step or do it right here.
             */}
            <BellLogic />
        </div>
    );
};


// Extracted for cleaner logic refresh
const BellLogic = () => {
    const [status, setStatus] = useState("MONITORING");
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("Say 'Hi Bell'...");
    const [sentiment, setSentiment] = useState("neutral"); // Add sentiment state

    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = true;
        }

        startMonitoring();

        return () => { if (recognitionRef.current) recognitionRef.current.stop(); }
    }, []);

    const startMonitoring = () => {
        if (!recognitionRef.current) return;
        setStatus("MONITORING");
        // Reset sentiment to neutral when monitoring starts again? 
        // Or keep it for a bit? Let's reset it to keep the UI fresh.
        setSentiment("neutral");

        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => console.log("Monitoring...");

        recognitionRef.current.onresult = (event) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript.toLowerCase();

            const wakeWords = ["hi bell", "hey bell", "hello bell"];
            const foundWakeWord = wakeWords.find(w => text.includes(w));

            if (foundWakeWord) {
                // Check if there is a command AFTER the wake word
                const commandPart = text.split(foundWakeWord)[1].trim();

                recognitionRef.current.stop(); // Stop monitoring in both cases

                if (commandPart.length > 2) {
                    // User said "Hi Bell Open Youtube" -> Process immediately
                    setStatus("PROCESSING");
                    // We need to set transcript for visual feedback
                    setTranscript(commandPart);
                    // Use a ref or state to pass this to the onend handler? 
                    // Or just handle it directly. But onend will trigger.
                    // Let's set a flag.
                    transcriptRef.current = commandPart;
                    // We rely on onend to call handleProcess if we have a transcript?
                    // The existing onend logic restarts monitoring if WAKING.
                    // Let's make onend smarter.
                    setStatus("PROCESSING_IMMEDIATE");
                } else {
                    // User said "Hi Bell" (pause) -> Switch to listening
                    setStatus("WAKING");
                }
            }
        };

        recognitionRef.current.onend = () => {
            if (status === "MONITORING") {
                try { recognitionRef.current.start(); } catch (e) { }
            } else if (status === "WAKING") {
                startCommandListening();
            } else if (status === "PROCESSING_IMMEDIATE") {
                handleProcess();
            }
        };

        try { recognitionRef.current.start(); } catch (e) { }
    };

    // Timer reference for silence detection
    const silenceTimer = useRef(null);

    const startCommandListening = () => {
        setStatus("LISTENING");
        setTranscript("");

        // Use continuous=true to prevent browser from auto-stopping too early
        recognitionRef.current.continuous = true;

        recognitionRef.current.onresult = (event) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);

            // Reset silence timer on every new word detected
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            // Set a 2-second silence timeout
            silenceTimer.current = setTimeout(() => {
                recognitionRef.current.stop(); // This will trigger onend -> process
            }, 2000);
        };

        recognitionRef.current.onend = () => {
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
            // Command finished
            handleProcess();
        };

        try { recognitionRef.current.start(); } catch (e) { }
    };

    // We need a ref to access transcript in onend closure
    const transcriptRef = useRef("");
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    const handleProcess = async () => {
        const text = transcriptRef.current;
        if (!text) {
            // Back to sleep
            startMonitoring();
            return;
        }

        setStatus("PROCESSING");
        try {
            const res = await axios.post('http://localhost:5000/process_command', { command: text });
            const reply = res.data.response;
            const sentimentData = res.data.sentiment; // Get sentiment

            setResponse(reply);
            if (sentimentData) setSentiment(sentimentData); // Update sentiment

            speak(reply);
        } catch (e) {
            setResponse("Connection Error");
            startMonitoring();
        }
    };

    const speak = (text) => {
        setStatus("SPEAKING");
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Zira") || v.name.includes("Female"));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            startMonitoring(); // Go back to sleep loop
        };

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className={`orb ${status.toLowerCase()} ${sentiment}`} onClick={() => {
            if (status === "MONITORING") { recognitionRef.current.stop(); setStatus("WAKING"); }
        }}>
            {/* Visuals handled by parent styling based on class */}
            <div style={{ position: 'absolute', bottom: '-50px', width: '300px', textAlign: 'center', color: 'white' }}>
                <div className="status-text">{status}</div>
                <div className="transcript">{status === "LISTENING" || status === "PROCESSING" ? transcript : response}</div>
            </div>

            {/* Visualizer Waves */}
            {status === "SPEAKING" && (
                <div style={{ position: 'absolute', display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <div style={{ width: '5px', height: '30px', background: 'white', animation: 'wave 1s infinite' }}></div>
                    <div style={{ width: '5px', height: '50px', background: 'white', animation: 'wave 1.2s infinite' }}></div>
                    <div style={{ width: '5px', height: '30px', background: 'white', animation: 'wave 0.8s infinite' }}></div>
                </div>
            )}
        </div>
    );
}

export default App;
