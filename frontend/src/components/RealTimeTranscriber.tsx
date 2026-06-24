import React, { useEffect, useRef, useState } from 'react';

// Simple utility to map transcript text to gloss sequence (uppercase words)
const textToGlosses = (text: string): string[] => {
  if (!text) return [];
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());
};
interface RealTimeTranscriberProps {
  onGlossChange: (glosses: string[]) => void;
  language?: string; // ISO language code, e.g., 'en', 'hi'
  onEmotionChange?: (emotion: string) => void;
}
const RealTimeTranscriber: React.FC<RealTimeTranscriberProps> = ({ onGlossChange, language = 'en', onEmotionChange }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Initialize WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/transcribe?lang=${language}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      console.log('WebSocket ASR connection opened');
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          setTranscript((prev) => {
            const updated = prev ? `${prev} ${data.text}` : data.text;
            onGlossChange(textToGlosses(updated));
            return updated;
          });
        }
        if (data.emotion && onEmotionChange) {
          onEmotionChange(data.emotion);
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
    ws.onclose = () => console.log('WebSocket closed');
    ws.onerror = (err) => console.error('WebSocket error', err);
    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [onGlossChange]);

  // Capture microphone audio and stream to WS
  useEffect(() => {
    const startCapture = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to 16-bit PCM
        const buffer = new ArrayBuffer(channelData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < channelData.length; i++) {
          let s = Math.max(-1, Math.min(1, channelData[i]));
          s = s < 0 ? s * 0x8000 : s * 0x7fff;
          view.setInt16(i * 2, s, true);
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(buffer);
        }
      };
    };
    startCapture().catch((err) => console.error('Audio capture error', err));
    // Cleanup will be handled by returning from the effect (close WS)
  }, []);

  return (
    <div className="glass p-4 rounded-xl border border-white/10 mb-4">
      <h3 className="text-sm font-medium text-white mb-2">Live Transcript</h3>
      <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{transcript}</pre>
    </div>
  );
};

export default RealTimeTranscriber;
