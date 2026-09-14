import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import "./App.css";

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoId, setVideoId] = useState("");

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const getRandomSong = async () => {
    const response = await fetch("http://localhost:8080/api/songs/random");
    const data = await response.json();
    setVideoId(data.youtubeVideoId);
  };

  useEffect(() => {
    getRandomSong();
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

  return (
    <div>
      <h1>Music Video Prototype</h1>

      <div className={`video-container ${showVideo ? "visible" : "hidden"}`}>
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

      <button onClick={playClip}>Play clip</button>
      <button onClick={getRandomSong}>New random song</button>
    </div>
  );
}

export default App;