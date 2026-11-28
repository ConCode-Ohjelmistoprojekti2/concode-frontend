import YouTube, { type YouTubeEvent } from "react-youtube";

type Props = {
  videoId: string;
  isClipPlaying: boolean;
  showVideo: boolean;
  onReady: (event: YouTubeEvent) => void;
};

export function VideoPlayer({ videoId, isClipPlaying, showVideo, onReady }: Props) {
  return (
    <div className="video-stage">
      <div className={`video-container ${isClipPlaying ? "visible" : "hidden"}`}>
        {videoId && <YouTube key={videoId} videoId={videoId} onReady={onReady} opts={{
          width: "640", height: "360",
          playerVars: { controls: 0, disablekb: 1, cc_load_policy: 0 },
        }} />}
        <div aria-hidden="true" className={`video-title-mask ${showVideo ? "hidden" : "visible"}`} />
      </div>
    </div>
  );
}
