import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import type { Session } from "@supabase/supabase-js";
import "./App.css";
import { supabase, supabaseIsConfigured } from "./supabase";
import {
  calculatePoints,
  DAILY_MAX_ATTEMPTS,
  getNextSurvivalLives,
  hasAttemptsRemaining,
  hasSurvivalGameEnded,
  SURVIVAL_MAX_LIVES,
} from "./gameLogic";

type ChallengeType = "random" | "daily";
type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

type LeaderboardScore = {
  playerName: string;
  score: number;
};

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [artistGuess, setArtistGuess] = useState("");
  const [titleGuess, setTitleGuess] = useState("");
  const [yearGuess, setYearGuess] = useState("");
  const [genreGuess, setGenreGuess] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(false);
  const [genreLoadMessage, setGenreLoadMessage] = useState("");

  const [hasGuessed, setHasGuessed] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [usedAttempts, setUsedAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({
    correctArtist: false,
    correctTitle: false,
    correctYear: false,
    correctGenre: false,
  });
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [scoreMessage, setScoreMessage] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<ChallengeType>("daily");
  const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setAuthMessage("");
        setAuthMode("reset-password");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
    setGameCompleted(false);
    setFinalScore(0);
    setScoreMessage("");
    setGameStarted(true);

    if (type === "daily") void loadGenres();
    await loadChallenge(type);
  };

  async function loadGenres() {
    setIsLoadingGenres(true);
    setGenreLoadMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/songs/genres`,
      );
      if (!response.ok) throw new Error("Could not load genres");

      const data: unknown = await response.json();
      if (!isStringArray(data)) throw new Error("Invalid genres response");

      setGenres(data);
    } catch (error) {
      console.error(error);
      setGenres([]);
      setGenreLoadMessage("Could not load genres.");
    } finally {
      setIsLoadingGenres(false);
    }
  }

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
      const nextLives = challengeType === "random"
        ? getNextSurvivalLives(
            survivalLives,
            result.correctArtist,
            result.correctTitle,
          )
        : survivalLives;

      if (challengeType === "random") setSurvivalLives(nextLives);
      setGuessResult(result);
      const nextScore = score + calculatePoints(
        result,
        challengeType,
        usedAttempts + 1,
        correctAnswers,
      );
      setScore(nextScore);
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
      const gameHasEnded = challengeType === "random"
        ? hasSurvivalGameEnded(nextLives)
        : solvedChallenge || !hasAttemptsRemaining(nextAttempts);

      if (
        challengeType !== "daily" ||
        solvedChallenge ||
        !hasAttemptsRemaining(nextAttempts)
      ) {
        setHasGuessed(true);
      }

      if (gameHasEnded) {
        setFinalScore(nextScore);
        setGameCompleted(true);
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
    setShowLeaderboard(false);
  };

  const loadLeaderboard = async (mode: ChallengeType) => {
    setLeaderboardMessage("Loading scores...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/scores/leaderboard/${mode}`,
      );
      if (!response.ok) throw new Error("Could not load leaderboard");

      const scores = (await response.json()) as LeaderboardScore[];
      setLeaderboard(scores);
      setLeaderboardMessage(scores.length ? "" : "No scores yet. Be the first!");
    } catch (error) {
      console.error(error);
      setLeaderboard([]);
      setLeaderboardMessage("Could not load the leaderboard.");
    }
  };

  const openLeaderboard = () => {
    setShowLeaderboard(true);
    void loadLeaderboard(leaderboardMode);
  };

  const selectLeaderboardMode = (mode: ChallengeType) => {
    setLeaderboardMode(mode);
    void loadLeaderboard(mode);
  };

  const saveScore = async () => {
    if (!session || !supabase) {
      setAuthMode("login");
      return;
    }

    setIsSavingScore(true);
    setScoreMessage("");
    try {
      const username = session.user.user_metadata.username;
      if (typeof username !== "string" || !username) {
        throw new Error("Your account does not have a username. Please contact support.");
      }
      const profileResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!profileResponse.ok) throw new Error(await profileResponse.text());

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          score: Math.round(finalScore),
          mode: challengeType.toUpperCase(),
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setScoreMessage("Score saved to the leaderboard.");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Could not save your score.";
      setScoreMessage(message.includes("already saved")
        ? "You have already registered this mode today."
        : message.includes("username") ? "That username is unavailable. Create a new account with another username."
          : "Could not save your score. Please try again.");
    } finally {
      setIsSavingScore(false);
    }
  };

  const openAuth = (mode: AuthMode = "login") => {
    setAuthMessage("");
    setAuthPassword("");
    setAuthMode(mode);
  };

  const submitAuth = async () => {
    if (!supabase) {
      setAuthMessage("Authentication is not configured yet.");
      return;
    }
    setIsAuthenticating(true);
    setAuthMessage("");
    try {
      if (authMode === "signup") {
        const username = authUsername.trim();
        if (!/^[A-Za-z0-9_-]{1,30}$/.test(username)) {
          throw new Error("Username: 1–30 letters, numbers, underscores or hyphens.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { emailRedirectTo: window.location.origin, data: { username } },
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          setAuthMode(null);
        } else {
          setAuthMessage("Check your email to confirm your account, then log in.");
        }
      } else if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(), password: authPassword,
        });
        if (error) throw error;
        setSession(data.session);
        setAuthMode(null);
      } else if (authMode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setAuthMessage("Check your email for a password-reset link.");
      } else if (authMode === "reset-password") {
        const { error } = await supabase.auth.updateUser({ password: authPassword });
        if (error) throw error;
        setAuthMessage("Password updated. You can continue playing.");
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not complete that request.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSession(null);
  };

  const authDialog = authMode && (
    <div className="auth-backdrop" role="presentation">
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="back-link" onClick={() => setAuthMode(null)}>× Close</button>
        <p className="eyebrow">ACCOUNT</p>
        <h2 id="auth-title">
          {authMode === "signup" ? "Create account" : authMode === "login" ? "Log in" : authMode === "forgot-password" ? "Reset password" : "Choose a new password"}
        </h2>
        {authMode === "signup" && <label className="guess-field"><span>Username</span><input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} maxLength={30} autoComplete="username" /></label>}
        {authMode !== "reset-password" && <label className="guess-field"><span>Email</span><input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" /></label>}
        {authMode !== "forgot-password" && <label className="guess-field"><span>{authMode === "reset-password" ? "New password" : "Password"}</span><input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} /></label>}
        <div className="form-actions">
          <button onClick={() => void submitAuth()} disabled={isAuthenticating || !supabaseIsConfigured}>{isAuthenticating ? "Please wait..." : authMode === "signup" ? "Create account" : authMode === "login" ? "Log in" : authMode === "forgot-password" ? "Send reset link" : "Update password"}</button>
        </div>
        {authMessage && <p className="form-help" role="status">{authMessage}</p>}
        {authMode === "login" && <p className="form-help"><button className="text-button" onClick={() => openAuth("forgot-password")}>Forgot password?</button> · <button className="text-button" onClick={() => openAuth("signup")}>Create an account</button></p>}
        {authMode === "signup" && <p className="form-help">Already have an account? <button className="text-button" onClick={() => openAuth("login")}>Log in</button></p>}
      </section>
    </div>
  );

  if (!gameStarted) {
    if (showLeaderboard) {
      return (
        <>
        <main className="main-menu leaderboard-screen">
          <div className="menu-content leaderboard-page">
            <button className="back-link" onClick={() => setShowLeaderboard(false)}>
              ← Game modes
            </button>
            <p className="eyebrow">TOP SCORES</p>
            <h1>Leaderboards</h1>
            <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard mode">
              <button role="tab" aria-selected={leaderboardMode === "daily"} className={leaderboardMode === "daily" ? "active-tab" : "secondary-button"} onClick={() => selectLeaderboardMode("daily")}>Daily</button>
              <button role="tab" aria-selected={leaderboardMode === "random"} className={leaderboardMode === "random" ? "active-tab" : "secondary-button"} onClick={() => selectLeaderboardMode("random")}>Survival</button>
            </div>
            <section className="leaderboard-list" aria-live="polite">
              {leaderboard.map((entry, index) => (
                <div className="leaderboard-row" key={`${entry.playerName}-${index}`}>
                  <span>#{index + 1}</span><strong>{entry.playerName}</strong><span>{entry.score} pts</span>
                </div>
              ))}
              {leaderboardMessage && <p className="form-help">{leaderboardMessage}</p>}
            </section>
          </div>
        </main>
        {authDialog}
        </>
      );
    }

    return (
      <>
      <main className="main-menu">
        <div className="menu-content">
          <div className="account-actions">
            {session ? <><span>Signed in as <strong>{typeof session.user.user_metadata.username === "string" ? session.user.user_metadata.username : session.user.email}</strong></span><button className="secondary-button" onClick={() => void signOut()}>Log out</button></> : <button className="secondary-button" onClick={() => openAuth("login")}>Log in</button>}
          </div>
          <p className="eyebrow">MUSIC GUESSING GAME</p>
          <h1>Name The Video</h1>
          <p className="menu-intro">
            Guess the artist and song title from a short music video clip.
          </p>
          <div className="mode-grid">
            <section className="mode-card">
              <span className="mode-number">01 / ENDLESS</span>
              <h2>Survival Mode</h2>
              <p>Keep guessing songs, earn points and protect your lives.</p>
              <button
                aria-label="Survival Mode"
                onClick={() => startGame("random")}
              >
                Play Survival Mode
              </button>
            </section>
            <section className="mode-card">
              <span className="mode-number">02 / DAILY</span>
              <h2>Daily Song</h2>
              <p>One song each day. Guess the artist, title, year and genre.</p>
              <button
                aria-label="Daily Song"
                onClick={() => startGame("daily")}
              >
                Play Daily Song
              </button>
            </section>
          </div>
          <section className="leaderboard-card">
            <div>
              <span className="mode-number">03 / SCORES</span>
              <h2>Leaderboards</h2>
              <p>See how your score compares with other players.</p>
            </div>
            <button className="leaderboard-link" onClick={openLeaderboard}>
              View leaderboards
            </button>
          </section>
        </div>
      </main>
      {authDialog}
      </>
    );
  }

  return (
    <>
    <main className="game-page">
      <header className="game-header">
        <button className="back-link" onClick={returnToGameModes}>
          ← Game modes
        </button>
        <div className="game-heading">
          <p className="eyebrow">
            {challengeType === "random" ? "SURVIVAL MODE" : "DAILY SONG"}
          </p>
          <h1 aria-label="Con Code">Name The Video</h1>
        </div>
      </header>
      <section className="game-stats" aria-label="Game stats">
        <div className="stat-card">
          <span>Round</span>
         <h2 aria-label={`Round: ${round}`}>{round}</h2>
        </div>
        <div className="stat-card">
          <span>Score</span>
          <h2 aria-label={`Score: ${Number(score.toFixed(2))}`}>
  {Number(score.toFixed(2))}
</h2>
        </div>
        {challengeType === "random" ? (
          <div className="stat-card">
            <span>Lives</span>
            <strong>
              {survivalLives}/{SURVIVAL_MAX_LIVES}
            </strong>
          </div>
        ) : (
          <div className="stat-card">
            <span>Attempts left</span>
            <strong>
              {DAILY_MAX_ATTEMPTS - usedAttempts}/{DAILY_MAX_ATTEMPTS}
            </strong>
          </div>
        )}
      </section>
      <section className="play-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">LISTEN AND GUESS</p>
            <h2>Recognize this song?</h2>
          </div>
          <span className="round-tag">Round {round}</span>
        </div>
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
            <button className="play-button" onClick={playClip}>
              {hasPlayedClip ? "Play hint" : "Start game"}
            </button>
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
                  <input
                    type="text"
                    value={artistGuess}
                    onChange={(e) => setArtistGuess(e.target.value)}
                    placeholder="Artist"
                  />
                  {challengeType === "daily" && guessResult && (
                    <span
                      className="answer-mark"
                      role="img"
                      aria-label={
                        correctAnswers.correctArtist ? "Correct" : "Incorrect"
                      }
                    >
                      {correctAnswers.correctArtist ? "✅" : "❌"}
                    </span>
                  )}
                </span>
              </label>
              <label className="guess-field">
                <span>Song title</span>
                <span className="input-holder">
                  <input
                    type="text"
                    value={titleGuess}
                    onChange={(e) => setTitleGuess(e.target.value)}
                    placeholder="Song Title"
                  />
                  {challengeType === "daily" && guessResult && (
                    <span
                      className="answer-mark"
                      role="img"
                      aria-label={
                        correctAnswers.correctTitle ? "Correct" : "Incorrect"
                      }
                    >
                      {correctAnswers.correctTitle ? "✅" : "❌"}
                    </span>
                  )}
                </span>
              </label>
              {challengeType === "daily" && (
                <>
                  <label className="guess-field">
                    <span>Release year</span>
                    <span className="input-holder">
                      <input
                        type="text"
                        value={yearGuess}
                        onChange={(e) => setYearGuess(e.target.value)}
                        placeholder="Release Year"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                      />
                      {guessResult && (
                        <span
                          className="answer-mark"
                          role="img"
                          aria-label={
                            correctAnswers.correctYear ? "Correct" : "Incorrect"
                          }
                        >
                          {correctAnswers.correctYear ? "✅" : "❌"}
                        </span>
                      )}
                    </span>
                  </label>
                  <label className="guess-field">
                    <span>Genre</span>
                    <span className="input-holder genre-holder">
                      <select
                        className={genreGuess ? "" : "genre-placeholder"}
                        value={genreGuess}
                        onChange={(e) => setGenreGuess(e.target.value)}
                        disabled={isLoadingGenres || genres.length === 0}
                      >
                        <option value="">Genre</option>
                        {genres.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre}
                          </option>
                        ))}
                      </select>
                      {guessResult && (
                        <span
                          className="answer-mark"
                          role="img"
                          aria-label={
                            correctAnswers.correctGenre
                              ? "Correct"
                              : "Incorrect"
                          }
                        >
                          {correctAnswers.correctGenre ? "✅" : "❌"}
                        </span>
                      )}
                    </span>
                    {genreLoadMessage && (
                      <span className="genre-error" role="alert">
                        {genreLoadMessage}
                      </span>
                    )}
                  </label>
                </>
              )}
            </div>
            <div className="form-actions">
              <button className="submit-button" onClick={submitGuess}>
                Submit
              </button>
              <button className="secondary-button" onClick={returnToGameModes}>
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="result-card">
            <p className="eyebrow">ROUND SUMMARY</p>
            <h3>Results</h3>
            <div className="result-line">
              <span>Artist</span>
              <strong>{guessResult?.answer?.artist}</strong>
              <span>{correctAnswers.correctArtist ? "✅" : "❌"}</span>
            </div>
            <div className="result-line">
              <span>Song</span>
              <strong>{guessResult?.answer?.title}</strong>
              <span>{correctAnswers.correctTitle ? "✅" : "❌"}</span>
            </div>
            {challengeType === "daily" && (
              <>
                <div className="result-line">
                  <span>Release year</span>
                  <strong>{guessResult?.answer?.year}</strong>
                  <span>{correctAnswers.correctYear ? "✅" : "❌"}</span>
                </div>
                <div className="result-line">
                  <span>Genre</span>
                  <strong>{guessResult?.answer?.genre}</strong>
                  <span>{correctAnswers.correctGenre ? "✅" : "❌"}</span>
                </div>
              </>
            )}
            {gameCompleted ? (
              <div className="score-entry">
                <p>Your final score: <strong>{Number(finalScore.toFixed(2))}</strong></p>
                <div className="form-actions">
                  {session ? <button onClick={() => void saveScore()} disabled={isSavingScore || scoreMessage === "Score saved to the leaderboard."}>
                    {isSavingScore ? "Saving..." : "Save score"}
                  </button> : <button onClick={() => openAuth("login")}>Log in or create account</button>}
                  <button className="secondary-button" onClick={returnToGameModes}>Back to start screen</button>
                </div>
                {session && <p className="form-help">Saving as <strong>{typeof session.user.user_metadata.username === "string" ? session.user.user_metadata.username : "your account"}</strong>.</p>}
                {scoreMessage && <p className="form-help" role="status">{scoreMessage}</p>}
              </div>
            ) : (
              <button className="result-button" onClick={challengeType === "daily" || hasSurvivalGameEnded(survivalLives) ? returnToGameModes : handleNextRound}>
                {challengeType === "daily" || hasSurvivalGameEnded(survivalLives) ? "Back to start screen" : "Next Round"}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
    {authDialog}
    </>
  );
}

export default App;
