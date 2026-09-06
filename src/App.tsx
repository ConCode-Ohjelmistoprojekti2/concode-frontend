import { useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import "./App.css";

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

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
        <YouTube
          videoId="dQw4w9WgXcQ"
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
      </div>

      <button onClick={playClip}>Play clip</button>
    </div>
  );
}

export default App;