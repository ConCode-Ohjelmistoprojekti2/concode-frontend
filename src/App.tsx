import { useRef } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";

function App() {
  const playerRef = useRef<YouTubePlayer | null>(null);

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const playVideo = () => {
    playerRef.current?.playVideo();
  };

  const pauseVideo = () => {
    playerRef.current?.pauseVideo();
  };

  const playFiveSeconds = () => {
    playerRef.current?.playVideo();

    setTimeout(() => {
      playerRef.current?.pauseVideo();
    }, 5000);
  };

  return (
    <div>
      <h1>Music Video Prototype</h1>

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

      <div>
        <button onClick={playVideo}>Play</button>
        <button onClick={pauseVideo}>Pause</button>
        <button onClick={playFiveSeconds}>Play 5 seconds</button>
      </div>
    </div>
  );
}

export default App;