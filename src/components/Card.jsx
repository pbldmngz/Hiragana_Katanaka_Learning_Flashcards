import { useState } from 'react';
import './Card.css';

function Card({ english, hiragana, katakana, visible, onAction }) {
    const [showBack, setShowBack] = useState(false);

    // Handle button clicks by checking disabled conditions before forwarding the answer type
    const handleButtonClick = (type) => {
        if (
            (type === 'hiragana' && !visible.hiragana) ||
            (type === 'katakana' && !visible.katakana) ||
            (type === 'both' && (!visible.hiragana || !visible.katakana))
        ) {
            return;
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
            {showBack ? (<div className="buttons">
                <div>I know:</div>
                <div className="buttons-above">
                    <div
                        className={`button hiragana ${!visible.hiragana ? 'disabled' : ''}`}
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
                        className={`button katakana ${!visible.katakana ? 'disabled' : ''}`}
                        onClick={() => handleButtonClick('katakana')}
                    >
                        Katakana
                    </div>
                </div>
                <div className="buttons-below">
                    <div
                        className={`button none`}
                        onClick={() => handleButtonClick('none')}
                    >
                        None
                    </div>
                </div>
            </div>) : null}
        </div>
    );
}



export default Card;