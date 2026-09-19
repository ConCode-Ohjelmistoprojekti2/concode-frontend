import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);

  const [videoId, setVideoId] = useState("");
  const [showVideo, setShowVideo] = useState(false);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);

  const [artistGuess, setArtistGuess] = useState("");
  const [titleGuess, setTitleGuess] = useState("");

  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessResult, setGuessResult] = useState<any>(null);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const loadNextSong = async () => {
    const response = await fetch("http://localhost:8080/api/challenges/random");
    const data = await response.json();
    setVideoId(data.youtubeVideoId);
    setArtistGuess("");
    setTitleGuess("");
    setHasGuessed(false);
    setGuessResult(null);
    setShowVideo(false);
  };

  useEffect(() => {
    loadNextSong();
  }, []);

  const playClip = () => {
    setShowVideo(false);
    playerRef.current?.playVideo();

    setTimeout(() => {
      setShowVideo(true);
    }, 4350);

    setTimeout(() => {
      setShowVideo(false);
      playerRef.current?.pauseVideo();
    }, 9000);
  };

  const submitGuess = async () => {
    if (!artistGuess || !titleGuess) return;

    try {
      const response = await fetch(
        "http://localhost:8080/api/challenges/guess",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtubeVideoId: videoId,
            artistGuess: artistGuess,
            titleGuess: titleGuess,
          }),
        },
      );

      const result = await response.json();
      setGuessResult(result);
      setHasGuessed(true);

      let points = 0;
      if (result.correctArtist) points += 1;
      if (result.correctTitle) points += 1;
      setScore(score + points);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNextRound = () => {
    setRound(round + 1);
    loadNextSong();
  };

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
        style={{
          visibility: showVideo ? "visible" : "hidden",
          height: showVideo ? "auto" : "0",
        }}
      >
        {videoId && (
          <YouTube
            videoId={videoId}
            onReady={onReady}
            opts={{
              width: "640",
              height: "360",
              playerVars: {
                controls: 0,
                disablekb: 1,
              },
            }}
          />
        )}
      </div>

      {!hasGuessed && (
        <div style={{ margin: "20px" }}>
          <button
            onClick={playClip}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Play Hint
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
          </div>
          <button
            onClick={submitGuess}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Submit
          </button>
        </div>
      ) : (
        <div
          style={{
            margin: "20px 0",
            padding: "20px",
            backgroundColor: "#e8f5e9",
            display: "inline-block",
            borderRadius: "8px",
          }}
        >
          <h3>Results</h3>
          <p style={{ fontSize: "18px" }}>
            Artist: <strong>{guessResult?.answer?.artist}</strong>{" "}
            {guessResult?.correctArtist ? "✅" : "❌"}
          </p>
          <p style={{ fontSize: "18px" }}>
            Song: <strong>{guessResult?.answer?.title}</strong>{" "}
            {guessResult?.correctTitle ? "✅" : "❌"}
          </p>
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
