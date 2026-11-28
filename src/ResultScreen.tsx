import type { ChallengeType, CorrectAnswers, GuessResult } from "./gameTypes";
import type { Session } from "@supabase/supabase-js";
import { hasSurvivalGameEnded } from "./gameLogic";
type Props = {
  guessResult: GuessResult | null; correctAnswers: CorrectAnswers; challengeType: ChallengeType; gameCompleted: boolean; finalScore: number;
  session: Session | null; saveScore: () => void; isSavingScore: boolean; scoreMessage: string; openAuth: (mode: "login") => void; returnToGameModes: () => void; survivalLives: number; handleNextRound: () => void;
};

export function ResultScreen({ guessResult, correctAnswers, challengeType, gameCompleted, finalScore, session, saveScore, isSavingScore, scoreMessage, openAuth, returnToGameModes, survivalLives, handleNextRound }: Props) {
  return (
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
  );
}
