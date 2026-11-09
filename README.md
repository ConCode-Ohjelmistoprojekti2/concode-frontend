
# Music Video Guessing Game – Con Code

[![CI](https://github.com/ConCode-Ohjelmistoprojekti2/concode-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ConCode-Ohjelmistoprojekti2/concode-frontend/actions/workflows/ci.yml)

## Project Description

Con Code is a music video guessing game where players identify songs and artists from short YouTube video clips.

The frontend is built using React, TypeScript and Vite, and communicates with a Java Spring Boot backend.

## Game Modes

### Survival Mode
- Guess song titles and artists.
- Earn points for correct guesses.
- Continue playing while you have lives remaining.

### Daily Song
- Play a daily song challenge.
- Guess the artist, song title, release year and genre.
- Earn points based on correct answers and attempts.

## Technologies

- React
- TypeScript
- Vite
- CSS
- YouTube Player API
- Vitest and React Testing Library

## Running the Application

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The frontend runs locally at:

http://localhost:5173

The application requires a running backend. Configure the backend URL in a `.env` file:

```env
VITE_BACKEND_URL=http://localhost:8080
```

## Tests

Frontend tests use Vitest and React Testing Library.

The tests verify:
- Both game modes can be opened.
- Random and daily challenges load correctly.
- Empty guesses are not submitted.
- Points are calculated correctly for different guess results.

Run tests:

```bash
npm test
```

Build the application:

```bash
npm run build
```

Automated CI checks run through GitHub Actions.

## Deployment

The frontend is deployed on Rahti.

The production build is generated using:

```bash
npm run build
```

The `VITE_BACKEND_URL` environment variable must point to the deployed backend API.

## Backend

The frontend communicates with a Java Spring Boot backend.

Backend repository:
https://github.com/ConCode-Ohjelmistoprojekti2/concode-backend

## Future Development

Potential improvements include:
- User registration and login
- Personal game statistics
- Global leaderboards
- Customizable Survival Mode
- Improved loading and error handling
