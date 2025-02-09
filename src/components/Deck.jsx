import { useEffect, useState } from 'react';
import Card from './Card';
import kanaData from '../data/kana.json';
import './Deck.css';

function Deck({ showBaseOnly, wavesMode, hiraganaOnly, katakanaOnly }) {
    // The deck holds the queue of cards with additional metadata.
    const [deck, setDeck] = useState([]);
    const [roundsCount, setRoundsCount] = useState(0);
    const [masteredCount, setMasteredCount] = useState(0);
    const [initialCount, setInitialCount] = useState(0);
    // New state variables for waves mode
    const [allFilteredCards, setAllFilteredCards] = useState([]);
    const [waveOrder, setWaveOrder] = useState([]);
    const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
    // Flag to indicate the deck has been properly initialized
    const [initialized, setInitialized] = useState(false);

    // Function to determine the order of waves.
    // It prioritizes the "HA" group (if available) then orders remaining groups alphabetically.
    const getWaveOrder = (cards) => {
        const uniqueRoots = Array.from(new Set(cards.map(card => card.root)));
        let order = [];
        if (uniqueRoots.includes("HA")) {
            order.push("HA");
            uniqueRoots.splice(uniqueRoots.indexOf("HA"), 1);
        }
        uniqueRoots.sort(); // sort remaining alphabetically
        order = order.concat(uniqueRoots);
        return order;
    };

    // Helper function to shuffle an array randomly using the Fisher-Yates algorithm
    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    useEffect(() => {
        const savedProgressJson = localStorage.getItem('flashcardProgress');
        if (savedProgressJson) {
            try {
                const progress = JSON.parse(savedProgressJson);
                // Only load progress if the session is active AND
                // the saved settings match the current ones.
                if (
                    progress.inProgress &&
                    progress.settings &&
                    progress.settings.showBaseOnly === showBaseOnly &&
                    progress.settings.wavesMode === wavesMode &&
                    progress.settings.hiraganaOnly === hiraganaOnly &&
                    progress.settings.katakanaOnly === katakanaOnly
                ) {
                    setDeck(progress.deck);
                    setRoundsCount(progress.roundsCount);
                    setMasteredCount(progress.masteredCount);
                    setInitialCount(progress.initialCount);
                    setAllFilteredCards(progress.allFilteredCards);
                    setWaveOrder(progress.waveOrder);
                    setCurrentWaveIndex(progress.currentWaveIndex);
                    setInitialized(true);
                    return;
                } else {
                    // Mismatch in settings from saved progress:
                    localStorage.removeItem('flashcardProgress');
                }
            } catch (e) {
                console.error("Error parsing flashcardProgress:", e);
            }
        }

        // No valid saved progress exists: initialize new deck and reset counters.
        setRoundsCount(0);
        setMasteredCount(0);

        const filteredCards = showBaseOnly ? kanaData.filter(card => card.base) : kanaData;

        // Compute the default visible state based on mode:
        const defaultVisible = hiraganaOnly
            ? { hiragana: true, katakana: false }
            : katakanaOnly
                ? { hiragana: false, katakana: true }
                : { hiragana: true, katakana: true };

        if (wavesMode) {
            setAllFilteredCards(filteredCards);
            const waves = getWaveOrder(filteredCards);
            setWaveOrder(waves);
            // Choose initial wave: prefer "HA" if available, else the first wave in order.
            const initialWave = waves.includes("HA") ? "HA" : waves[0];
            setCurrentWaveIndex(waves.indexOf(initialWave));
            const waveCards = filteredCards.filter(card => card.root === initialWave);
            const initialDeck = waveCards.map((card, index) => ({
                ...card,
                bothCount: 0,
                failCount: 0,
                visible: { ...defaultVisible },
                id: index,
            }));
            const shuffledDeck = shuffleArray(initialDeck);
            setDeck(shuffledDeck);
            setInitialCount(shuffledDeck.length);
        } else {
            const initialDeck = filteredCards.map((card, index) => ({
                ...card,
                bothCount: 0,
                failCount: 0,
                visible: { ...defaultVisible },
                id: index, // optional identifier
            }));
            const shuffledDeck = shuffleArray(initialDeck);
            setDeck(shuffledDeck);
            setInitialCount(shuffledDeck.length);
        }
        setInitialized(true);
    }, [showBaseOnly, wavesMode, hiraganaOnly, katakanaOnly]);

    // New function to move to the next wave when the current wave is mastered.
    const handleNextWave = () => {
        if (currentWaveIndex < waveOrder.length - 1) {
            const nextIndex = currentWaveIndex + 1;
            const nextWaveRoot = waveOrder[nextIndex];
            const nextWaveCards = allFilteredCards
                .filter(card => card.root === nextWaveRoot)
                .map((card, index) => ({
                    ...card,
                    bothCount: 0,
                    failCount: 0,
                    visible: { hiragana: true, katakana: true },
                    id: index,
                }));
            setDeck(nextWaveCards);
            setInitialCount(nextWaveCards.length);
            setCurrentWaveIndex(nextIndex);
            // Optionally, you can reset roundsCount and masteredCount for the new wave.
            setRoundsCount(0);
            setMasteredCount(0);
        }
    };

    // Process the outcome from the Card component
    const handleCardAction = (type) => {
        if (deck.length === 0) return; // No cards to process

        // Compute default visible state based on mode:
        const defaultVisible = hiraganaOnly
            ? { hiragana: true, katakana: false }
            : katakanaOnly
                ? { hiragana: false, katakana: true }
                : { hiragana: true, katakana: true };

        // Get the current (first) card from the queue
        const currentCard = { ...deck[0] };
        let newDeck = deck.slice(1); // Remove the first card

        if (type === 'both') {
            currentCard.bothCount += 1;
            // If the card has been answered "both" twice, it is mastered.
            if (currentCard.bothCount >= 2) {
                setMasteredCount(prev => prev + 1);
                // Remove any duplicate copies of this mastered card from the deck.
                newDeck = newDeck.filter(c => c.id !== currentCard.id);
            } else {
                // Otherwise, reset the visible state to default (based on mode) and reinsert the card.
                currentCard.visible = { ...defaultVisible };
                newDeck.push(currentCard);
            }
        } else if (type === 'hiragana') {
            // For a "hiragana" action: if the card is currently showing only katakana (i.e. missing hiragana),
            // then the user now knows the missing side so reset to default.
            // Otherwise, hide the hiragana side (i.e. force only katakana visible).
            if (!currentCard.visible.katakana) {
                currentCard.visible = { ...defaultVisible };
            } else {
                // In non-single-mode, hide hiragana. In "hiragana only" mode, defaultVisible is already set.
                currentCard.visible = hiraganaOnly ? { ...defaultVisible } : { hiragana: false, katakana: true };
            }
            currentCard.failCount = 0; // Reset failure counter
            const midIndex = Math.floor(newDeck.length / 2);
            newDeck.splice(midIndex, 0, currentCard);
        } else if (type === 'katakana') {
            // For a "katakana" action: if the card is currently showing only hiragana (i.e. missing katakana),
            // then the user now knows the missing side so reset to default.
            // Otherwise, hide the katakana side (i.e. force only hiragana visible).
            if (!currentCard.visible.hiragana) {
                currentCard.visible = { ...defaultVisible };
            } else {
                currentCard.visible = katakanaOnly ? { ...defaultVisible } : { hiragana: true, katakana: false };
            }
            currentCard.failCount = 0;
            const midIndex = Math.floor(newDeck.length / 2);
            newDeck.splice(midIndex, 0, currentCard);
        } else if (type === 'none') {
            // The user doesn't know the card – show default state on next appearance.
            currentCard.visible = { ...defaultVisible };
            currentCard.failCount = Math.min(currentCard.failCount + 1, 3);
            // Insert the card at least 3 cards away, or at the end if deck is smaller.
            const insertionIndex = newDeck.length <= 3 ? newDeck.length : 3;
            newDeck.splice(insertionIndex, 0, currentCard);
        }

        setRoundsCount(prev => prev + 1);
        setDeck(newDeck);
    };

    // Compute progress percentages (blue = rounds seen, green = mastered cards)
    const blueWidth = initialCount > 0 ? Math.min((roundsCount / initialCount) * 100, 100) : 0;
    const greenWidth = initialCount > 0 ? (masteredCount / initialCount) * 100 : 0;

    // Persist flashcard progress to localStorage whenever relevant state changes
    useEffect(() => {
        if (!initialized) return;
        // Include the current settings in the progress.
        const progress = {
            deck,
            roundsCount,
            masteredCount,
            initialCount,
            allFilteredCards,
            waveOrder,
            currentWaveIndex,
            inProgress: deck.length > 0,
            settings: { showBaseOnly, wavesMode, hiraganaOnly, katakanaOnly }
        };
        localStorage.setItem('flashcardProgress', JSON.stringify(progress));
    }, [
        initialized,
        deck,
        roundsCount,
        masteredCount,
        initialCount,
        allFilteredCards,
        waveOrder,
        currentWaveIndex,
        showBaseOnly,
        wavesMode,
        hiraganaOnly,
        katakanaOnly
    ]);

    return (
        <div className="deck">
            <div className="progress-info">
                {masteredCount}/{initialCount} mastered | {roundsCount} cards reviewed
            </div>
            <div style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <div className="progress-bar">

                    <div
                        className="progress-bar-blue"
                        style={{ width: `${blueWidth}%` }}
                    ></div>
                    <div
                        className="progress-bar-green"
                        style={{ width: `${greenWidth}%` }}
                    ></div>
                </div>
            </div>
            {deck.length > 0 ? (
                <Card {...deck[0]} onAction={handleCardAction} />
            ) : (
                wavesMode ? (
                    <div className="completion-message">
                        {currentWaveIndex < waveOrder.length - 1 ? (
                            <>
                                <p>You've mastered the "{waveOrder[currentWaveIndex]}" wave!</p>
                                <button onClick={handleNextWave}>Next Wave</button>
                            </>
                        ) : (
                            <p>You've mastered all waves!</p>
                        )}
                    </div>
                ) : (
                    <div className="completion-message">
                        You've mastered all cards!
                    </div>
                )
            )}
        </div>
    );
}

export default Deck;