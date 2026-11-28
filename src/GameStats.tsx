import heartGif from "./assets/heart.gif";

type Props = { round: number; score: number; lives: number };

export function GameStats({ round, score, lives }: Props) {
  const heartStates = [0, 1, 2].map((index) => {
    const remaining = lives - index;
    return remaining >= 1 ? "full" : remaining >= 0.5 ? "half" : "empty";
  });

  return (
    <section className="game-stats" aria-label="Game stats">
      <div className="stat-card"><span>Round</span><h2 aria-label={`Round: ${round}`}>{round}</h2></div>
      <div className="stat-card"><span>Score</span><h2 aria-label={`Score: ${Number(score.toFixed(2))}`}>{Number(score.toFixed(2))}</h2></div>
      <div className="stat-card">
        <span>Lives</span>
        <div className="lives-hearts" role="img" aria-label={`${lives} lives left`}>
          {heartStates.map((heartState, index) => (
            <span className={`heart ${heartState}`} key={index}>
              <img src={heartGif} alt="" />
              {heartState === "half" && <img className="heart-fill-half" src={heartGif} alt="" />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
