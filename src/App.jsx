import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setInstallPrompt(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Personal Assistant Application</h1>

        <div className="status-indicator">
          {isOnline ? (
            <span className="online">🟢 Online</span>
          ) : (
            <span className="offline">🔴 Offline</span>
          )}
        </div>

        {installPrompt && (
          <button onClick={handleInstallClick} className="install-button">
            Install App
          </button>
        )}

        <div className="content">
          <p>Welcome to your Personal Assistant PWA!</p>
          <p>This app works offline and can be installed on your device.</p>
        </div>
      </header>
    </div>
  );
}

export default App;
