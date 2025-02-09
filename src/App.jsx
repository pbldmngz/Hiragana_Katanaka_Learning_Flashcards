import { useState, useEffect } from 'react';
import './App.css';
import Deck from './components/Deck';

function App() {
  const [started, setStarted] = useState(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return JSON.parse(stored).started;
      } catch (e) { }
    }
    return false;
  });
  const [showBaseOnly, setShowBaseOnly] = useState(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return JSON.parse(stored).showBaseOnly;
      } catch (e) { }
    }
    return true;
  });
  const [wavesMode, setWavesMode] = useState(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return JSON.parse(stored).wavesMode;
      } catch (e) { }
    }
    return true;
  });
  const [hiraganaOnly, setHiraganaOnly] = useState(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return JSON.parse(stored).hiraganaOnly;
      } catch (e) { }
    }
    return false;
  });
  const [katakanaOnly, setKatakanaOnly] = useState(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        return JSON.parse(stored).katakanaOnly;
      } catch (e) { }
    }
    return false;
  });

  // Save state to localStorage whenever these values change
  useEffect(() => {
    const settings = { started, showBaseOnly, wavesMode, hiraganaOnly, katakanaOnly };
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [started, showBaseOnly, wavesMode, hiraganaOnly, katakanaOnly]);

  const handleStart = () => {
    setStarted(true);
  };

  const handleReset = () => {
    // Wipe out all saved data
    localStorage.removeItem('settings');
    localStorage.removeItem('flashcardProgress');

    setStarted(false);
    setShowBaseOnly(true);
    setWavesMode(true);
    setHiraganaOnly(false);
    setKatakanaOnly(false);
  };

  // Compute the start button label based on saved flashcard progress.
  // It will be "Continue" if saved progress exists (with a non-empty deck); otherwise "Start".
  const savedProgressStr = localStorage.getItem('flashcardProgress');
  let startButtonLabel = "Start";
  let continueAvailable = true;
  if (savedProgressStr) {
    try {
      const progress = JSON.parse(savedProgressStr);
      // Only label as "Continue" if the session is active
      if (progress.inProgress) {
        startButtonLabel = "Continue";
        // Disable "Continue" if the waves mode setting in saved progress mismatches the current one.
        if (!progress.settings || progress.settings.wavesMode !== wavesMode) {
          continueAvailable = false;
        }
      }
    } catch (e) {
      console.error("Error parsing saved progress:", e);
    }
  }

  return (
    <div className="app">
      {!started ? (
        <div className="start-screen">
          <h1>Hiragana &amp; Katakana Flashcards</h1>
          <div className="checkboxes">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showBaseOnly}
                onChange={() => setShowBaseOnly(!showBaseOnly)}
              />
              Hide ぴ, ぎ, きょ, etc...
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={wavesMode}
                onChange={() => setWavesMode(!wavesMode)}
              />
              Waves Mode (recommended)
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={hiraganaOnly}
                onChange={() => {
                  setHiraganaOnly(prev => {
                    if (!prev) {
                      setKatakanaOnly(false);
                      return true;
                    }
                    return false;
                  });
                }}
                disabled={katakanaOnly}
              />
              Hiragana Only
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={katakanaOnly}
                onChange={() => {
                  setKatakanaOnly(prev => {
                    if (!prev) {
                      setHiraganaOnly(false);
                      return true;
                    }
                    return false;
                  });
                }}
                disabled={hiraganaOnly}
              />
              Katakana Only
            </label>
          </div>
          <p className="mastered-hint">
            {hiraganaOnly ? (
              <>Remember <i>Hiragana</i> for a Syllable <i>twice</i> and it will be tagged as mastered</>
            ) : katakanaOnly ? (
              <>Remember <i>Katakana</i> for a Syllable <i>twice</i> and it will be tagged as mastered</>
            ) : (
              <>Remember <i>both</i> Hiragana and Katakana for a Syllable <i>twice</i> and it will be tagged as mastered</>
            )}
          </p>
          <div className="button-row">
            <button
              className="start-button"
              onClick={handleStart}
              disabled={startButtonLabel === "Continue" && !continueAvailable}
            >
              {startButtonLabel}
            </button>
            <button
              className={`reset-button ${startButtonLabel === "Continue" && !continueAvailable ? "primary" : ""}`}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <Deck
          showBaseOnly={showBaseOnly}
          wavesMode={wavesMode}
          hiraganaOnly={hiraganaOnly}
          katakanaOnly={katakanaOnly}
        />
      )}
      {/* Only show the home icon when in game */}
      {started && (
        <div
          className="home-icon"
          onClick={() => setStarted(false)}
          title="Back to Home"
        >
          <span role="img" aria-label="home">⚙️</span>
        </div>
      )}
    </div>
  );
}

export default App;
