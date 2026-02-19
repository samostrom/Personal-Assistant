import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllAudioFiles, deleteAudioFile, base64ToBlob } from '../utils/audioStorage';
import './AudioFiles.css';

function AudioFiles() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    try {
      const files = await getAllAudioFiles();
      // Sort by timestamp, newest first
      files.sort((a, b) => b.id - a.id);
      setAudioFiles(files);
    } catch (error) {
      console.error('Error loading audio files:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this audio file?')) {
      try {
        await deleteAudioFile(id);
        setAudioFiles(files => files.filter(file => file.id !== id));
      } catch (error) {
        console.error('Error deleting audio file:', error);
        alert('Failed to delete audio file');
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (base64) => {
    const bytes = Math.ceil((base64.length * 3) / 4);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="audio-files-page">
      <header className="audio-files-header">
        <Link to="/" className="back-button">← Back to Recorder</Link>
        <h1>Audio Files</h1>
        <div className="file-count">{audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''}</div>
      </header>

      <div className="audio-files-container">
        {audioFiles.length === 0 ? (
          <div className="empty-state">
            <p>No audio files yet.</p>
            <p>Start recording to create your first audio file!</p>
            <Link to="/" className="cta-button">Go to Recorder</Link>
          </div>
        ) : (
          <div className="audio-files-list">
            {audioFiles.map((file) => (
              <div key={file.id} className="audio-file-item">
                <div className="audio-file-header">
                  <div className="audio-file-info">
                    <h3>Recording #{file.id}</h3>
                    <div className="audio-meta">
                      <span className="timestamp">{file.timestamp}</span>
                      <span className="duration">{formatDuration(file.duration)}</span>
                      <span className="file-size">{formatFileSize(file.audioData)}</span>
                    </div>
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(file.id)}
                    title="Delete audio file"
                  >
                    🗑️
                  </button>
                </div>

                <div className="audio-player-container">
                  <audio
                    controls
                    src={URL.createObjectURL(base64ToBlob(file.audioData))}
                    onPlay={() => setPlayingId(file.id)}
                    onPause={() => setPlayingId(null)}
                    onEnded={() => setPlayingId(null)}
                  />
                </div>

                {file.transcriptId && (
                  <div className="transcript-link">
                    <Link to={`/?transcript=${file.transcriptId}`}>
                      View Transcript →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioFiles;
