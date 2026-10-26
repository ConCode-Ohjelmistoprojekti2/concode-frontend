import { useCallback, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import "./App.css";

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

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const videoIdRef = useRef("");

  const [videoId, setVideoId] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [isClipPlaying, setIsClipPlaying] = useState(false);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [challengeType, setChallengeType] = useState<ChallengeType>("random");
  const [gameStarted, setGameStarted] = useState(false);

  const [artistGuess, setArtistGuess] = useState("");
  const [titleGuess, setTitleGuess] = useState("");
  const [yearGuess, setYearGuess] = useState("");
  const [genreGuess, setGenreGuess] = useState("");

  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);

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
    setArtistGuess("");
    setTitleGuess("");
    setYearGuess("");
    setGenreGuess("");
    setHasGuessed(false);
    setGuessResult(null);
    setShowVideo(false);
    setIsClipPlaying(false);
  }, []);

  const startGame = async (type: ChallengeType) => {
    setRound(1);
    setScore(0);
    setGameStarted(true);

    await loadChallenge(type);
  };

  const playClip = () => {
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
      setGuessResult(result);
      setHasGuessed(true);

      let points = 0;
      if (result.correctArtist) points += 1;
      if (result.correctTitle) points += 1;
      if (challengeType === "daily" && result.correctYear) points += 1;
      if (challengeType === "daily" && result.correctGenre) points += 1;
      setScore((prevScore) => prevScore + points);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNextRound = () => {
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
        <h2>Score: {score}</h2>
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
            Start game
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
            <input
              type="text"
              value={artistGuess}
              onChange={(e) => setArtistGuess(e.target.value)}
              placeholder="Artist"
              style={{ padding: "10px", marginRight: "10px", width: "200px" }}
            />
            <input
              type="text"
              value={titleGuess}
              onChange={(e) => setTitleGuess(e.target.value)}
              placeholder="Song Title"
              style={{ padding: "10px", marginRight: "10px", width: "200px" }}
            />
            {challengeType === "daily" && (
              <>
                <input
                  type="text"
                  value={yearGuess}
                  onChange={(e) => setYearGuess(e.target.value)}
                  placeholder="Release Year"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  style={{ padding: "10px", marginRight: "10px", width: "120px" }}
                />
                <input
                  type="text"
                  value={genreGuess}
                  onChange={(e) => setGenreGuess(e.target.value)}
                  placeholder="Genre"
                  style={{ padding: "10px", width: "160px" }}
                />
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
            {guessResult?.correctArtist ? "✅" : "❌"}
          </p>
          <p style={{ fontSize: "18px" }}>
            Song: <strong>{guessResult?.answer?.title}</strong>{" "}
            {guessResult?.correctTitle ? "✅" : "❌"}
          </p>
          {challengeType === "daily" && (
            <>
              <p style={{ fontSize: "18px" }}>
                Release year: <strong>{guessResult?.answer?.year}</strong>{" "}
                {guessResult?.correctYear ? "✅" : "❌"}
              </p>
              <p style={{ fontSize: "18px" }}>
                Genre: <strong>{guessResult?.answer?.genre}</strong>{" "}
                {guessResult?.correctGenre ? "✅" : "❌"}
              </p>
            </>
          )}
          <button
            onClick={handleNextRound}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginTop: "15px",
            }}
          >
            Next Round
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
