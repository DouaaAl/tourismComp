'use client';

import React, { useState } from 'react';
import { MapPin, Volume2, AlertTriangle, Send, Mic, Globe } from 'lucide-react';
import "./tour.css"

export default function TourGuide() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Waiting for permission...');

  // Helper to ensure we use the current or provided text
  const handleAsk = async (queryText = input) => {
    if (!queryText.trim()) return;

    setInput(queryText); 
    setLoading(true);
    setResponse(null);

    // 1. Get Browser Location
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported.");
      sendMessage(queryText, null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationStatus(`Located: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        sendMessage(queryText, latitude, longitude);
      },
      (error) => {
        console.error("Loc Error:", error);
        setLocationStatus("Location denied. Using AI defaults.");
        sendMessage(queryText, null, null);
      }
    );
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setLocationStatus("Voice input not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
      setInput('');
      setLocationStatus("Listening... speak clearly.");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
      setLocationStatus("Speech error, please type.");
    };

    recognition.onend = () => {
      setIsListening(false);
      if (input === '') {
        setLocationStatus("Ready to search or listen again.");
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleAsk(transcript);
    };

    recognition.start();
  };

  const sendMessage = async (text, lat, lng) => {
    try {
      // ---------------------------------------------------------
      // CHANGE 1: Point to your live Vercel Server
      // ---------------------------------------------------------
      const res = await fetch('https://tourism-ai-virid.vercel.app/chat_web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lat, lng }),
      });

      if (!res.ok) throw new Error("Failed to connect to API");

      const data = await res.json();
      setResponse(data);

      // ---------------------------------------------------------
      // CHANGE 2: Play Audio from Base64 String (Serverless compatible)
      // ---------------------------------------------------------
      if (data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        audio.play().catch(e => console.log("Audio play failed:", e));
      }

    } catch (error) {
      console.error("Server Error:", error);
      setLocationStatus("Error connecting to AI server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="headerTitleWrapper">
            <MapPin size={24} />
            <h2 className="headerTitle">AI Tour Guide</h2>
          </div>
          <p className="headerSubtitle">Safety, Transit, and Local Knowledge System</p>
        </div>

        <div className="body">
          {/* Location Status Bar */}
          <div className="locationStatus">
            <div 
              className={`statusDot ${locationStatus.includes('Located') ? 'statusDotActive' : locationStatus.includes('Listening') ? 'statusDotInactive' : 'statusDotInactive'}`}
            ></div>
            {locationStatus}
          </div>

          {/* Input Area */}
          <div className="inputWrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder={isListening ? "Listening..." : "Ask about prices, hotels, or safety..."}
              className="inputField"
              disabled={isListening || loading}
            />
            
            <button 
              onClick={() => handleAsk()}
              disabled={loading || isListening || !input.trim()}
              className="sendButton"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <Send size={20} />
              )}
            </button>

            {/* Microphone Button */}
            <button
              onClick={handleVoiceInput}
              disabled={loading}
              className={`micButton ${isListening ? 'listening' : ''}`}
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Response Area */}
          {response && (
            <div className="responseContainer">
              
              {/* Danger Alert */}
              {response.safety_status && !response.safety_status.includes("Safe zone") && (
                <div className="dangerAlert">
                  <div className="dangerTitle">
                    <AlertTriangle size={20} />
                    <span>Warning Issued</span>
                  </div>
                  <p className="dangerText">{response.safety_status}</p>
                </div>
              )}

              {/* AI Text Bubble */}
              <div className="aiBubble">
                {response.response_text}

                {/* Grounding Sources */}
                {response.sources && response.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {response.sources.map((source, index) => (
                      <a 
                        key={index} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="sourcePill"
                      >
                        <Globe size={12} />
                        {source.title || source.uri}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------- */}
              {/* CHANGE 3: Check for audio_base64 to show the indicator */}
              {/* --------------------------------------------------------- */}
              {response.audio_base64 && (
                <div className="audioIndicator">
                  <Volume2 className="audioIcon" />
                  <span>Playing voice response...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}