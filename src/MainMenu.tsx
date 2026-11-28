import type { Session } from "@supabase/supabase-js";
import type { ChallengeType } from "./gameTypes";

type Props = { session: Session | null; signOut: () => void; openAuth: (mode: "login") => void; startGame: (type: ChallengeType) => void; openLeaderboard: () => void };

export function MainMenu({ session, signOut, openAuth, startGame, openLeaderboard }: Props) {
  return (
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
  );
}
