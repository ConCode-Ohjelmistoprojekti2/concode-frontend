import type { ChallengeType, GuessResult, CorrectAnswers } from "./gameTypes";
import { MainMenu } from "./MainMenu";
import { ResultScreen } from "./ResultScreen";
import { GuessForm } from "./GuessForm";
import { useCallback, useEffect, useRef, useState } from "react";
import { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import { GameStats } from "./GameStats";
import { VideoPlayer } from "./VideoPlayer";
import type { Session } from "@supabase/supabase-js";
import "./App.css";
import confettiGif from "./assets/confetti.gif";
import skullGif from "./assets/skull.gif";
import { supabase, supabaseIsConfigured } from "./supabase";
import {
  calculatePoints,
  DAILY_MAX_ATTEMPTS,
  getNextSurvivalLives,
  hasAttemptsRemaining,
  hasSurvivalGameEnded,
  SURVIVAL_MAX_LIVES,
  getYearPoints
} from "./gameLogic";


type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

type LeaderboardScore = {
  playerName: string;
  score: number;
};

type ChallengeResponse = {
  youtubeVideoId: string;
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
    yearPointsAwarded: false
  });
  const [gameCompleted, setGameCompleted] = useState(false);
  const [endAnimation, setEndAnimation] = useState<"won" | "over" | null>(null);
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

  useEffect(() => {
    if (!endAnimation) return;

    const timer = window.setTimeout(() => setEndAnimation(null), 2500);
    return () => window.clearTimeout(timer);
  }, [endAnimation]);

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
      yearPointsAwarded: false
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
      const guessedYear = Number(yearGuess);
      const answerYear = Number(result.answer.year);
      const yearDifference =
        yearGuess !== "" && Number.isInteger(guessedYear) && Number.isFinite(answerYear)
          ? Math.abs(guessedYear - answerYear)
          : undefined;
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
        yearDifference,

      );
      setScore(nextScore);
      setCorrectAnswers((previous) => ({
        correctArtist: previous.correctArtist || result.correctArtist,
        correctTitle: previous.correctTitle || result.correctTitle,
        correctYear: previous.correctYear || result.correctYear,
        correctGenre: previous.correctGenre || result.correctGenre,
        yearPointsAwarded: previous.yearPointsAwarded ||
          result.correctYear ||
          (usedAttempts + 1 === DAILY_MAX_ATTEMPTS &&
            getYearPoints(yearDifference, false) > 0),
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
        setEndAnimation(
          challengeType === "daily" && solvedChallenge ? "won" : "over",
        );
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
    playerRef.current = null;
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
          score: Number(finalScore.toFixed(2)),
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
  const lives = challengeType === "random"
    ? survivalLives
    : DAILY_MAX_ATTEMPTS - usedAttempts;

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
                    <span>#{index + 1}</span><strong>{entry.playerName}</strong><span>{leaderboardMode === "daily" ? entry.score.toFixed(2) : entry.score} pts</span>
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
        <MainMenu session={session} signOut={signOut} openAuth={openAuth} startGame={startGame} openLeaderboard={openLeaderboard} />
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
        <GameStats round={round} score={score} lives={lives} />
        <section className={`play-panel ${gameCompleted ? "play-panel-completed" : ""}`}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LISTEN AND GUESS</p>
              <h2>Recognize this song?</h2>
            </div>
            <span className="round-tag">Round {round}</span>
          </div>
          {!gameCompleted && (
            <VideoPlayer videoId={videoId} isClipPlaying={isClipPlaying} showVideo={showVideo} onReady={onReady} />
          )}
          {!hasGuessed && (
            <div className="play-controls">
              <button className="play-button" onClick={playClip}>
                {hasPlayedClip ? "Play hint" : "Start game"}
              </button>
            </div>
          )}
          {!hasGuessed ? (
            <GuessForm challengeType={challengeType} guessResult={guessResult} correctAnswers={correctAnswers} artistGuess={artistGuess} setArtistGuess={setArtistGuess} titleGuess={titleGuess} setTitleGuess={setTitleGuess} yearGuess={yearGuess} setYearGuess={setYearGuess} genreGuess={genreGuess} setGenreGuess={setGenreGuess} isLoadingGenres={isLoadingGenres} genres={genres} genreLoadMessage={genreLoadMessage} submitGuess={submitGuess} returnToGameModes={returnToGameModes} />
          ) : (
            <ResultScreen guessResult={guessResult} correctAnswers={correctAnswers} challengeType={challengeType} gameCompleted={gameCompleted} finalScore={finalScore} session={session} saveScore={saveScore} isSavingScore={isSavingScore} scoreMessage={scoreMessage} openAuth={openAuth} returnToGameModes={returnToGameModes} survivalLives={survivalLives} handleNextRound={handleNextRound} />
          )}
        </section>
      </main>
      {endAnimation && (
        <div className="game-end-overlay" role="status">
          <img
            src={endAnimation === "won" ? confettiGif : skullGif}
            alt=""
          />
          <h2>{endAnimation === "won" ? "Game Won!" : "Game Over"}</h2>
        </div>
      )}
      {authDialog}
    </>
  );
}

export default App;
