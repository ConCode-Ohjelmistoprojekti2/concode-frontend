import { useCallback, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import "./App.css";
import {
  calculatePoints,
  DAILY_MAX_ATTEMPTS,
  getNextSurvivalLives,
  hasAttemptsRemaining,
  hasSurvivalGameEnded,
  SURVIVAL_MAX_LIVES,
} from "./gameLogic";


type ChallengeType = "random" | "daily";

type ChallengeResponse = {
  youtubeVideoId: string;
};

type GuessResult = {
  correctArtist: boolean;
  correctTitle: boolean;
  correctYear: boolean;
  correctGenre: boolean;
  answer: {
    artist: string;
    title: string;
    year: number | string;
    genre: string;
  };
};

type CorrectAnswers = {
  correctArtist: boolean;
  correctTitle: boolean;
  correctYear: boolean;
  correctGenre: boolean;
};

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const videoIdRef = useRef("");

  const [videoId, setVideoId] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [isClipPlaying, setIsClipPlaying] = useState(false);
  const [hasPlayedClip, setHasPlayedClip] = useState(false);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [survivalLives, setSurvivalLives] = useState(SURVIVAL_MAX_LIVES);
  const [challengeType, setChallengeType] = useState<ChallengeType>("random");
  const [gameStarted, setGameStarted] = useState(false);

  const [artistGuess, setArtistGuess] = useState("");
  const [titleGuess, setTitleGuess] = useState("");
  const [yearGuess, setYearGuess] = useState("");
  const [genreGuess, setGenreGuess] = useState("");

  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({
    correctArtist: false,
    correctTitle: false,
    correctYear: false,
    correctGenre: false,
  });

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const loadChallenge = useCallback(async (type: ChallengeType) => {
    let data;

    do {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenges/${type}`,
      );

      if (!response.ok) {
        console.error("Guess failed", response.status, await response.text());
        return;
      }

      data = (await response.json()) as ChallengeResponse;
    } while (type === "random" && data.youtubeVideoId === videoIdRef.current);

    setChallengeType(type);
    videoIdRef.current = data.youtubeVideoId;
    setVideoId(data.youtubeVideoId);
    setCorrectAnswers({
      correctArtist: false,
      correctTitle: false,
      correctYear: false,
      correctGenre: false,
    });
    setArtistGuess("");
    setTitleGuess("");
    setYearGuess("");
    setGenreGuess("");
    setHasGuessed(false);
    setUsedAttempts(0);
    setGuessResult(null);
    setShowVideo(false);
    setIsClipPlaying(false);
  }, []);

  const startGame = async (type: ChallengeType) => {
    setRound(1);
    setScore(0);
    setSurvivalLives(SURVIVAL_MAX_LIVES);
    setHasPlayedClip(false);
    setGameStarted(true);

    await loadChallenge(type);
  };

  const playClip = () => {
    setHasPlayedClip(true);
    setShowVideo(false);
    setIsClipPlaying(true);
    playerRef.current?.playVideo();

    setTimeout(() => {
      setShowVideo(true);
    }, 4850);

    setTimeout(() => {
      setShowVideo(false);
      setIsClipPlaying(false);
      playerRef.current?.pauseVideo();
    }, 9000);
  };

  const submitGuess = async () => {
    if (!artistGuess || !titleGuess) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenges/guess`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtubeVideoId: videoId,
            artistGuess: artistGuess,
            titleGuess: titleGuess,
            ...(challengeType === "daily" && {
              yearGuess: yearGuess ? Number(yearGuess) : null,
              genreGuess: genreGuess,
            }),
          }),
        },
      );

      const result = (await response.json()) as GuessResult;
      if (challengeType === "random") {
        setSurvivalLives((currentLives) =>
          getNextSurvivalLives(
            currentLives,
            result.correctArtist,
            result.correctTitle,
          ),
        );
      }
      setGuessResult(result);
      setScore((previousScore) =>
        previousScore +
        calculatePoints(result, challengeType, usedAttempts + 1, correctAnswers)
      );
      setCorrectAnswers((previous) => ({
        correctArtist: previous.correctArtist || result.correctArtist,
        correctTitle: previous.correctTitle || result.correctTitle,
        correctYear: previous.correctYear || result.correctYear,
        correctGenre: previous.correctGenre || result.correctGenre,
      }));


      const nextAttempts = usedAttempts + 1;
      setUsedAttempts(nextAttempts);

      const solvedChallenge =
        result.correctArtist &&
        result.correctTitle &&
        (challengeType !== "daily" ||
          (result.correctYear && result.correctGenre));

      if (
        challengeType !== "daily" ||
        solvedChallenge ||
        !hasAttemptsRemaining(nextAttempts)
      ) {
        setHasGuessed(true);
      }


    } catch (error) {
      console.error(error);
    }
  };

  const handleNextRound = () => {
    if (challengeType === "random" && hasSurvivalGameEnded(survivalLives)) {
      return;
    }

    setRound((prevRound) => prevRound + 1);
    loadChallenge(challengeType);
  };

  const returnToGameModes = () => {
    playerRef.current?.pauseVideo();
    setGameStarted(false);
  };

  if (!gameStarted) {
    return (
      <main className="main-menu">
        <div className="menu-content">
          <p className="eyebrow">MUSIC GUESSING GAME</p>
          <h1>Name The Video</h1>
          <p className="menu-intro">Guess the artist and song title from a short music video clip.</p>
          <div className="mode-grid">
            <section className="mode-card">
              <span className="mode-number">01 / ENDLESS</span>
              <h2>Survival Mode</h2>
              <p>Keep guessing songs, earn points and protect your lives.</p>
              <button onClick={() => startGame("random")}>Play Survival Mode</button>
            </section>
            <section className="mode-card">
              <span className="mode-number">02 / DAILY</span>
              <h2>Daily Song</h2>
              <p>One song each day. Guess the artist, title, year and genre.</p>
              <button onClick={() => startGame("daily")}>Play Daily Song</button>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="game-page">
      <header className="game-header">
        <button className="back-link" onClick={returnToGameModes}>← Game modes</button>
        <div className="game-heading">
          <p className="eyebrow">{challengeType === "random" ? "SURVIVAL MODE" : "DAILY SONG"}</p>
          <h1>Name The Video</h1>
        </div>
      </header>
      <section className="game-stats" aria-label="Game stats">
        <div className="stat-card"><span>Round</span><strong>{round}</strong></div>
        <div className="stat-card"><span>Score</span><strong>{Number(score.toFixed(2))}</strong></div>
        {challengeType === "random" ? (
          <div className="stat-card"><span>Lives</span><strong>{survivalLives}/{SURVIVAL_MAX_LIVES}</strong></div>
        ) : (
          <div className="stat-card"><span>Attempts left</span><strong>{DAILY_MAX_ATTEMPTS - usedAttempts}/{DAILY_MAX_ATTEMPTS}</strong></div>
        )}
      </section>
      <section className="play-panel">
        <div className="panel-heading"><div><p className="eyebrow">LISTEN AND GUESS</p><h2>Recognize this song?</h2></div><span className="round-tag">Round {round}</span></div>
        <div className="video-stage">
          <div
            className={`video-container ${isClipPlaying ? "visible" : "hidden"}`}
          >
            {videoId && (
              <YouTube
                key={videoId}
                videoId={videoId}
                onReady={onReady}
                opts={{
                  width: "640",
                  height: "360",
                  playerVars: {
                    controls: 0,
                    disablekb: 1,
                    cc_load_policy: 0,
                  },
                }}
              />
            )}
            <div
              aria-hidden="true"
              className={`video-title-mask ${showVideo ? "hidden" : "visible"}`}
            />
          </div>

        </div>
        {!hasGuessed && (
          <div className="play-controls">
            <button className="play-button" onClick={playClip}>{hasPlayedClip ? "Play hint" : "Start game"}</button>
          </div>
        )}
        {!hasGuessed ? (
          <div className="guess-card">
            <h3>Your answer</h3>
            <p className="form-help">Enter the artist and song title below.</p>
            <div className="guess-grid">
              <label className="guess-field">
                <span>Artist</span>
                <span className="input-holder">
                  <input type="text" value={artistGuess} onChange={(e) => setArtistGuess(e.target.value)} placeholder="Artist" />
                  {challengeType === "daily" && guessResult && <span className="answer-mark" role="img" aria-label={correctAnswers.correctArtist ? "Correct" : "Incorrect"}>{correctAnswers.correctArtist ? "✅" : "❌"}</span>}
                </span>
              </label>
              <label className="guess-field">
                <span>Song title</span>
                <span className="input-holder">
                  <input type="text" value={titleGuess} onChange={(e) => setTitleGuess(e.target.value)} placeholder="Song Title" />
                  {challengeType === "daily" && guessResult && <span className="answer-mark" role="img" aria-label={correctAnswers.correctTitle ? "Correct" : "Incorrect"}>{correctAnswers.correctTitle ? "✅" : "❌"}</span>}
                </span>
              </label>
              {challengeType === "daily" && (
                <>
                  <label className="guess-field">
                    <span>Release year</span>
                    <span className="input-holder">
                      <input type="text" value={yearGuess} onChange={(e) => setYearGuess(e.target.value)} placeholder="Release Year" inputMode="numeric" pattern="[0-9]*" maxLength={4} />
                      {guessResult && <span className="answer-mark" role="img" aria-label={correctAnswers.correctYear ? "Correct" : "Incorrect"}>{correctAnswers.correctYear ? "✅" : "❌"}</span>}
                    </span>
                  </label>
                  <label className="guess-field">
                    <span>Genre</span>
                    <span className="input-holder">
                      <input type="text" value={genreGuess} onChange={(e) => setGenreGuess(e.target.value)} placeholder="Genre" />
                      {guessResult && <span className="answer-mark" role="img" aria-label={correctAnswers.correctGenre ? "Correct" : "Incorrect"}>{correctAnswers.correctGenre ? "✅" : "❌"}</span>}
                    </span>
                  </label>
                </>
              )}
            </div>
            <div className="form-actions">
              <button className="submit-button" onClick={submitGuess}>Submit</button>
              <button className="secondary-button" onClick={returnToGameModes}>Back</button>
            </div>
          </div>
        ) : (
          <div className="result-card">
            <p className="eyebrow">ROUND SUMMARY</p>
            <h3>Results</h3>
            <div className="result-line"><span>Artist</span><strong>{guessResult?.answer?.artist}</strong><span>{correctAnswers.correctArtist ? "✅" : "❌"}</span></div>
            <div className="result-line"><span>Song</span><strong>{guessResult?.answer?.title}</strong><span>{correctAnswers.correctTitle ? "✅" : "❌"}</span></div>
            {challengeType === "daily" && (
              <>
                <div className="result-line"><span>Release year</span><strong>{guessResult?.answer?.year}</strong><span>{correctAnswers.correctYear ? "✅" : "❌"}</span></div>
                <div className="result-line"><span>Genre</span><strong>{guessResult?.answer?.genre}</strong><span>{correctAnswers.correctGenre ? "✅" : "❌"}</span></div>
              </>
            )}
            <button className="result-button" onClick={challengeType === "daily" || hasSurvivalGameEnded(survivalLives) ? returnToGameModes : handleNextRound}>
              {challengeType === "daily" || hasSurvivalGameEnded(survivalLives) ? "Back to start screen" : "Next Round"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
