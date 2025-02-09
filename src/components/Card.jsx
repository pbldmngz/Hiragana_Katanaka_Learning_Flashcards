import { useState } from 'react';
import './Card.css';

function Card({ english, hiragana, katakana, visible, onAction }) {
    const [showBack, setShowBack] = useState(false);
    // Compute if the card is in single mode (only one side is visible)
    const isSingleMode = visible.hiragana !== visible.katakana;

    // Updated handleButtonClick: in single-mode, a click on the visible side is treated as "both"
    const handleButtonClick = (originalType) => {
        let type = originalType;

        // Return early if the clicked button corresponds to a side that's not visible
        if (
            (originalType === 'hiragana' && !visible.hiragana) ||
            (originalType === 'katakana' && !visible.katakana)
        ) {
            return;
        }

        // Check if card is in single mode (only one side is visible)
        const isSingleMode = (visible.hiragana !== visible.katakana);

        if (isSingleMode) {
            // In single mode, if the user clicks the button for the visible side, treat it as "both"
            if (
                (visible.hiragana && originalType === 'hiragana') ||
                (visible.katakana && originalType === 'katakana')
            ) {
                type = 'both';
            }
        } else {
            // In dual mode, for "both" answer ensure both sides are visible
            if (type === 'both' && (!visible.hiragana || !visible.katakana)) {
                return;
            }
        }

        onAction(type);
        // Reset the flip state so each new card starts with the front side
        setShowBack(false);
    };

    return (
        <div className="card-container">
            <div className="card" onClick={() => setShowBack(!showBack)}>
                {showBack ? (
                    <div className="card-back">
                        <div className="kana-container">
                            {visible.hiragana && <p>{hiragana}</p>}
                            {visible.katakana && <p>{katakana}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="card-front">
                        <p>{english}</p>
                    </div>
                )}
            </div>
            {showBack ? (
                <div className="buttons">
                    <div>I know:</div>
                    <div className="buttons-above">
                        <div
                            className={`button hiragana ${!visible.hiragana ? 'disabled' : (isSingleMode && visible.hiragana ? 'active' : '')}`}
                            onClick={() => handleButtonClick('hiragana')}
                        >
                            Hiragana
                        </div>
                        <div
                            className={`button both ${(!visible.hiragana || !visible.katakana) ? 'disabled' : ''}`}
                            onClick={() => handleButtonClick('both')}
                        >
                            Both
                        </div>
                        <div
                            className={`button katakana ${!visible.katakana ? 'disabled' : (isSingleMode && visible.katakana ? 'active' : '')}`}
                            onClick={() => handleButtonClick('katakana')}
                        >
                            Katakana
                        </div>
                    </div>
                    <div className="buttons-below">
                        <div
                            className="button none"
                            onClick={() => handleButtonClick('none')}
                        >
                            None
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default Card;