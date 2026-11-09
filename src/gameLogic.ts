type ChallengeType = "random" | "daily";
export const DAILY_MAX_ATTEMPTS = 3;
export const SURVIVAL_MAX_LIVES = 3;

type GuessResult = {
    correctArtist: boolean;
    correctTitle: boolean;
    correctYear: boolean;
    correctGenre: boolean;

};

type CorrectAnswers = {
    correctArtist: boolean;
    correctTitle: boolean;
    correctYear: boolean;
    correctGenre: boolean;
};

export function getNextSurvivalLives(
    currentLives: number,
    correctArtist: boolean,
    correctTitle: boolean,
): number {
    if (correctArtist && correctTitle) {
        return Math.min(SURVIVAL_MAX_LIVES, currentLives + 1);
    }

    if (correctArtist || correctTitle) {
        return Math.min(SURVIVAL_MAX_LIVES, currentLives + 0.5);
    }

    return Math.max(0, currentLives - 1);
}

export function hasSurvivalGameEnded(lives: number): boolean {
    return lives <= 0;
}


export function calculatePoints(
    result: GuessResult,
    challengeType: ChallengeType,
    attemptNumber: number,
    alreadyCorrect: CorrectAnswers,
): number {
    const multiplier = challengeType !== "daily" || attemptNumber === 1
        ? 1
        : attemptNumber === 2
            ? 2 / 3
            : 1 / 3;

    let points = 0;


    if (result.correctArtist && !alreadyCorrect.correctArtist) points += multiplier;
    if (result.correctTitle && !alreadyCorrect.correctTitle) points += multiplier;
    if (challengeType === "daily" && result.correctYear && !alreadyCorrect.correctYear) {
        points += 0.5 * multiplier;
    }
    if (challengeType === "daily" && result.correctGenre && !alreadyCorrect.correctGenre) {
        points += 0.5 * multiplier;
    }

    return points;
}


export function hasAttemptsRemaining(usedAttempts: number): boolean {
    return usedAttempts < DAILY_MAX_ATTEMPTS;
}