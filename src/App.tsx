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
      <div className="main-menu">
        <h1>Music Video Guessing Game</h1>

        <p>Guess the artist and song title from a short music video clip</p>

        <button onClick={() => startGame("random")}>Survival Mode</button>

        <button onClick={() => startGame("daily")}>Daily Song</button>
      </div>
    );
  }
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Con Code</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          marginBottom: "20px",
        }}
      >
        <h2>Round: {round}</h2>
        <h2>Score: {score.toFixed(2)}</h2>
        {challengeType === "random" && (
          <h2>Lives: {survivalLives}/{SURVIVAL_MAX_LIVES}</h2>
        )}
        {challengeType === "daily" && (
          <h2>Attempts left: {DAILY_MAX_ATTEMPTS - usedAttempts}/{DAILY_MAX_ATTEMPTS}</h2>
        )}
      </div>

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

      {!hasGuessed && (
        <div style={{ margin: "20px" }}>
          <button
            onClick={playClip}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            {hasPlayedClip ? "Play hint" : "Start game"}
          </button>
        </div>
      )}

      {!hasGuessed ? (
        <div
          style={{
            margin: "20px 0",
            padding: "20px",
            backgroundColor: "#f0f0f0",
            display: "inline-block",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "15px" }}>
            <span style={{ display: "inline-block", position: "relative", marginRight: "10px" }}>
              <input
                type="text"
                value={artistGuess}
                onChange={(e) => setArtistGuess(e.target.value)}
                placeholder="Artist"
                style={{
                  padding: "10px",
                  paddingRight: guessResult && challengeType === "daily" ? "38px" : "10px",
                  width: "200px",
                  boxSizing: "border-box",
                }}
              />
              {challengeType === "daily" && guessResult && (
                <span
                  role="img"
                  aria-label={correctAnswers.correctArtist ? "Correct" : "Incorrect"}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                >
                  {correctAnswers.correctArtist ? "✅" : "❌"}
                </span>
              )}
            </span>
            <span style={{ display: "inline-block", position: "relative", marginRight: "10px" }}>
              <input
                type="text"
                value={titleGuess}
                onChange={(e) => setTitleGuess(e.target.value)}
                placeholder="Song Title"
                style={{
                  padding: "10px",
                  paddingRight: guessResult && challengeType === "daily" ? "38px" : "10px",
                  width: "200px",
                  boxSizing: "border-box",
                }}
              />
              {challengeType === "daily" && guessResult && (
                <span
                  role="img"
                  aria-label={correctAnswers.correctTitle ? "Correct" : "Incorrect"}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                >
                  {correctAnswers.correctTitle ? "✅" : "❌"}
                </span>
              )}
            </span>
            {challengeType === "daily" && (
              <>
                <span style={{ display: "inline-block", position: "relative", marginRight: "10px" }}>
                  <input
                    type="text"
                    value={yearGuess}
                    onChange={(e) => setYearGuess(e.target.value)}
                    placeholder="Release Year"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    style={{
                      padding: "10px",
                      paddingRight: guessResult ? "38px" : "10px",
                      width: "120px",
                      boxSizing: "border-box",
                    }}
                  />
                  {guessResult && (
                    <span
                      role="img"
                      aria-label={correctAnswers.correctYear ? "Correct" : "Incorrect"}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                    >
                      {correctAnswers.correctYear ? "✅" : "❌"}
                    </span>
                  )}
                </span>
                <span style={{ display: "inline-block", position: "relative" }}>
                  <input
                    type="text"
                    value={genreGuess}
                    onChange={(e) => setGenreGuess(e.target.value)}
                    placeholder="Genre"
                    style={{
                      padding: "10px",
                      paddingRight: guessResult ? "38px" : "10px",
                      width: "160px",
                      boxSizing: "border-box",
                    }}
                  />
                  {guessResult && (
                    <span
                      role="img"
                      aria-label={correctAnswers.correctGenre ? "Correct" : "Incorrect"}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}
                    >
                      {correctAnswers.correctGenre ? "✅" : "❌"}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
          <button
            onClick={submitGuess}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Submit
          </button>
          <button
            onClick={returnToGameModes}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginTop: "10px",
            }}
          >
            Back
          </button>
        </div>
      ) : (
        <div className="result-card">
          <h3>Results</h3>
          <p style={{ fontSize: "18px" }}>
            Artist: <strong>{guessResult?.answer?.artist}</strong>{" "}
            {correctAnswers.correctArtist ? "✅" : "❌"}
          </p>
          <p style={{ fontSize: "18px" }}>
            Song: <strong>{guessResult?.answer?.title}</strong>{" "}
            {correctAnswers.correctTitle ? "✅" : "❌"}
          </p>
          {challengeType === "daily" && (
            <>
              <p style={{ fontSize: "18px" }}>
                Release year: <strong>{guessResult?.answer?.year}</strong>{" "}
                {correctAnswers.correctYear ? "✅" : "❌"}
              </p>
              <p style={{ fontSize: "18px" }}>
                Genre: <strong>{guessResult?.answer?.genre}</strong>{" "}
                {correctAnswers.correctGenre ? "✅" : "❌"}
              </p>
            </>
          )}
          <button
            onClick={
              challengeType === "daily" ||
                hasSurvivalGameEnded(survivalLives)
                ? returnToGameModes
                : handleNextRound
            }
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginTop: "15px",
            }}
          >
            {challengeType === "daily" ||
              hasSurvivalGameEnded(survivalLives)
              ? "Back to start screen"
              : "Next Round"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
