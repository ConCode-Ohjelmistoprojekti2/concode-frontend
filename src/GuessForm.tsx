import type { ChallengeType, CorrectAnswers, GuessResult } from "./gameTypes";
import type { Dispatch, SetStateAction } from "react";
type Props = {
  challengeType: ChallengeType; guessResult: GuessResult | null; correctAnswers: CorrectAnswers;
  artistGuess: string; titleGuess: string; yearGuess: string; genreGuess: string;
  setArtistGuess: Dispatch<SetStateAction<string>>; setTitleGuess: Dispatch<SetStateAction<string>>; setYearGuess: Dispatch<SetStateAction<string>>; setGenreGuess: Dispatch<SetStateAction<string>>;
  isLoadingGenres: boolean; genres: string[]; genreLoadMessage: string; submitGuess: () => void; returnToGameModes: () => void;
};

export function GuessForm({ challengeType, guessResult, correctAnswers, artistGuess, setArtistGuess, titleGuess, setTitleGuess, yearGuess, setYearGuess, genreGuess, setGenreGuess, isLoadingGenres, genres, genreLoadMessage, submitGuess, returnToGameModes }: Props) {
  return (
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
                          disabled={correctAnswers.correctYear}
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
  );
}
