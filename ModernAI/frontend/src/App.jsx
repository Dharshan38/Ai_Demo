import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';

const App = () => {
    const [status, setStatus] = useState("IDLE"); // IDLE, LISTENING, PROCESSING, SPEAKING
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("Say 'Hey Bell' or click to start");
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop after one command usually
            recognition.lang = 'en-US';
            recognition.interimResults = true;

            recognition.onstart = () => {
                setStatus("LISTENING");
                setTranscript("");
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognition.onend = () => {
                // Determine if we should process or go back to idle
                // We'll handle processing in a separate effect or manual trigger check?
                // For now, let's assume if we have a transcript, we process it.
            };

            recognitionRef.current = recognition;
        } else {
            setResponse("Browser not supported. Use Chrome or Edge.");
        }
    }, []);

    // Effect to trigger processing when recognition stops and we have text
    // A better way is to call process inside onend, but getting state there is tricky with closures.
    // We'll use a manual stop trigger.

    const startListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.log("Already started", e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            // Allow a brief moment for final result then process
            setTimeout(() => {
                handleProcess();
            }, 500);
        }
    };

    const handleProcess = async () => {
        if (!transcript) {
            setStatus("IDLE");
            return;
        }

        setStatus("PROCESSING");
        try {
            // Send to Backend
            const res = await axios.post('http://localhost:5000/process_command', {
                command: transcript
            });

            const reply = res.data.response;
            setResponse(reply);
            speak(reply);
        } catch (error) {
            console.error(error);
            setResponse("Error connecting to system.");
            setStatus("IDLE");
        }
    };

    const speak = (text) => {
        setStatus("SPEAKING");
        const utterance = new SpeechSynthesisUtterance(text);

        // Optional: Select a specific voice
        const voices = window.speechSynthesis.getVoices();
        // Try to find a nice female voice
        const preferredVoice = voices.find(v => v.name.includes("Zira") || v.name.includes("Female") || v.name.includes("Google US English"));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            setStatus("IDLE");
            // Optional: Auto-listen again?
            // startListening(); 
        };

        window.speechSynthesis.speak(utterance);
    };

    // To handle "onend" processing correctly without deps issues:
    // We attach a specific handler to the ref instance that calls the function with current state refs if needed
    // Or just simple button logic for now. "Click to speak" is safest for MVP.
    // "Bixby" usually wakes on voice, but that requires continuous listening which is noisy in specific web apps.
    // Let's implement a "Wake Word" simulation or just button for now.

    const handleMicClick = () => {
        if (status === "LISTENING") {
            stopListening();
        } else {
            startListening();
        }
    };

    // Auto-process when silence detected?
    // SpeechRecognition usually stops automatically on silence. 
    // We can hook into onend to trigger process if (status === LISTENING)
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = () => {
                // If we were listening, now we stopped.
                // We need to check if we have a transcript to process.
                // We can't access 'transcript' state directly here if closed over.
                // But we can trigger a state change or use a ref for transcript.
                // For MVP, relies on user clicking or auto-stop (which triggers onend).
                // We need to bridge 'onend' to 'handleProcess'.
                // Let's use a timeout/ref approach or just rely on the user or the fact that result comes before end.
            };
        }
    }, []);

    // Better Approach: Use useEffect on status to trigger logic
    // But 'transcript' changes frequently. 

    // Quick Fix: modifying onResult to debounce auto-send?
    // Or just putting handleProcess in proper scope or ref.

    // Let's just make the orb clickable to toggle.
    // And add a helper to auto-submit on end.

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        const handleEnd = () => {
            // We need the LATEST transcript.
            // This is tricky in hook.
            // Dispatch a custom event or check a ref.
            document.dispatchEvent(new Event('recognitionEnded'));
        };

        recognition.onend = handleEnd;

        const processListener = () => {
            if (status === 'LISTENING') { // Only if we were listening
                // We need to grab logic here. 
                // Actually, simpler:
                // Update status to PROCESSING immediately, which triggers an effect?
                // No, we need to KNOW the transcript.
            }
        };

        // Let's settle for: Button Click = Start. Silence = End -> Process.
        // We need a ref for transcript to access inside onEnd.
    }, [status]);

    // Ref for transcript to access in callbacks
    const transcriptRef = useRef("");
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = () => {
                if (transcriptRef.current.trim().length > 0) {
                    handleProcessDirectly(transcriptRef.current);
                } else {
                    setStatus("IDLE");
                }
            };
        }
    }, []);

    const handleProcessDirectly = async (text) => {
        setStatus("PROCESSING");
        try {
            const res = await axios.post('http://localhost:5000/process_command', {
                command: text
            });
            const reply = res.data.response;
            setResponse(reply);
            speak(reply);
        } catch (e) {
            console.error(e);
            setStatus("IDLE");
        }
    }

    return (
        <div className="orb-container">
            <div className={`orb ${status.toLowerCase()}`} onClick={handleMicClick}></div>
            <div className="status-text">{status}</div>
            <div className="transcript">
                {status === "LISTENING" || status === "PROCESSING" ? transcript : response}
            </div>

            {/* Visualizer Waves (Decoration) */}
            {status === "SPEAKING" && (
                <div style={{ display: 'flex', gap: '5px', height: '30px', alignItems: 'center' }}>
                    <div style={{ width: '5px', background: 'white', animation: 'wave 1s infinite' }}></div>
                    <div style={{ width: '5px', background: 'white', animation: 'wave 1.2s infinite' }}></div>
                    <div style={{ width: '5px', background: 'white', animation: 'wave 0.8s infinite' }}></div>
                </div>
            )}
        </div>
    );
};

export default App;
