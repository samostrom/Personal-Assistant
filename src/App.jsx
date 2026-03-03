import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { saveAudioFile, blobToBase64 } from './utils/audioStorage';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentAudioId, setCurrentAudioId] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // Load transcripts from localStorage
    const savedTranscripts = localStorage.getItem('transcripts');
    if (savedTranscripts) {
      setTranscripts(JSON.parse(savedTranscripts));
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save transcripts to localStorage whenever they change
  useEffect(() => {
    if (transcripts.length > 0) {
      localStorage.setItem('transcripts', JSON.stringify(transcripts));
    }
  }, [transcripts]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);

        // Save audio to IndexedDB
        try {
          const audioId = Date.now();
          const base64Audio = await blobToBase64(audioBlob);
          await saveAudioFile({
            id: audioId,
            audioData: base64Audio,
            timestamp: new Date().toLocaleString(),
            duration: recordingTime,
            transcriptId: null // Will be linked when transcript is created
          });
          setCurrentAudioId(audioId);
          setShowConfirmation(true);
        } catch (error) {
          console.error('Error saving audio:', error);
          alert('Failed to save audio file');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleSendToWhisper = async () => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || 'Transcription failed');
      }

      const { transcript } = await response.json();

      const newTranscript = {
        id: Date.now(),
        audioId: currentAudioId,
        timestamp: new Date().toLocaleString(),
        text: transcript,
        duration: recordingTime,
      };

      setTranscripts(prev => [newTranscript, ...prev]);
      setShowConfirmation(false);
      setAudioBlob(null);
      setCurrentAudioId(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Transcription error:', error);
      alert(`Transcription failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancelSend = () => {
    setShowConfirmation(false);
    setAudioBlob(null);
    setCurrentAudioId(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Awaiting your command, Samos</h1>

        <div className="status-bar">
          <Link to="/audio-files" className="audio-files-link">
            🎵 Audio Files
          </Link>
          <div className="status-indicator">
            {isOnline ? (
              <span className="online">🟢 Online</span>
            ) : (
              <span className="offline">🔴 Offline</span>
            )}
          </div>
        </div>

        {/* Giant Record Button */}
        <div className="record-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''} ${isPaused ? 'paused' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={showConfirmation}
          >
            <div className="record-button-inner">
              {isRecording ? (
                <>
                  <div className="stop-icon"></div>
                  <span className="record-text">Stop</span>
                </>
              ) : (
                <>
                  <div className="mic-icon">🎤</div>
                  <span className="record-text">Record</span>
                </>
              )}
            </div>
          </button>

          {/* Recording State Indicator */}
          <div className="recording-state">
            {isRecording && (
              <div className="state-info">
                <div className="recording-indicator">
                  <span className="pulse-dot"></span>
                  <span className="state-text">
                    {isPaused ? 'Paused' : 'Recording'}
                  </span>
                </div>
                <div className="recording-time">{formatTime(recordingTime)}</div>
                <button
                  className="pause-button"
                  onClick={togglePauseResume}
                >
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              </div>
            )}
            {!isRecording && !showConfirmation && (
              <p className="instruction-text">Tap to start recording</p>
            )}
          </div>
        </div>

        {/* Send Confirmation Modal */}
        {showConfirmation && (
          <div className="modal-overlay">
            <div className="confirmation-modal">
              <h2>Send Recording?</h2>
              <p>Do you want to send this {formatTime(recordingTime)} recording to OpenAI Whisper for transcription?</p>

              <div className="audio-preview">
                <audio
                  controls
                  src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
                />
              </div>

              <div className="modal-info">
                <p className="info-text">
                  💾 Audio file saved! You can find it in <Link to="/audio-files">Audio Files</Link>
                </p>
              </div>

              <div className="modal-buttons">
                <button
                  className="cancel-button"
                  onClick={handleCancelSend}
                  disabled={isTranscribing}
                >
                  Cancel
                </button>
                <button
                  className="send-button"
                  onClick={handleSendToWhisper}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? 'Transcribing...' : 'Send to Whisper'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Display Area */}
        <div className="transcript-section">
          <h2>Transcripts</h2>
          <div className="transcript-container">
            {transcripts.length === 0 ? (
              <p className="empty-state">No transcripts yet. Start recording to create your first transcript!</p>
            ) : (
              transcripts.map(transcript => (
                <div key={transcript.id} className="transcript-item">
                  <div className="transcript-header">
                    <span className="transcript-timestamp">{transcript.timestamp}</span>
                    <div className="transcript-actions">
                      <span className="transcript-duration">{formatTime(transcript.duration)}</span>
                      {transcript.audioId && (
                        <Link
                          to="/audio-files"
                          className="audio-link"
                          title="View audio file"
                        >
                          🎵
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="transcript-text">{transcript.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
