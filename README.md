
# Con Code – Music Video Guessing Game

[![CI](https://github.com/ConCode-Ohjelmistoprojekti2/concode-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ConCode-Ohjelmistoprojekti2/concode-frontend/actions/workflows/ci.yml)

Con Code is a music video guessing game where players try to identify songs and artists from short YouTube music video clips.

Unlike traditional music guessing games, Con Code uses both audio and visual clues to make the gameplay more interactive.

## Play the Game

**[Play The Game Online](https://concode-frontend.onrender.com)**

The game is deployed on Render and can be played directly in your browser. No installation is required.

## Game Modes

### Survival Mode

In Survival Mode, players try to recognize as many songs as possible.

- Guess the song title and artist.
- Start with three lives.
- Earn points for correct guesses.
- Gain lives for fully or partially correct answers.
- Lose a life when both answers are incorrect.
- Continue playing until all lives are lost.

### Daily Song

Daily Song offers a challenge based on the song of the day.

- Guess the artist and song title.
- Guess the release year and genre.
- Players have three attempts to complete the challenge.
- Earn points based on correct guesses and the number of attempts.

## Technologies

The frontend is built using:

- React
- TypeScript
- Vite
- CSS
- react-youtube
- Vitest
- React Testing Library
- GitHub Actions

The frontend communicates with a Java Spring Boot REST API.

## Running the Application Locally

### Requirements

- Node.js and npm
- Access to a running Con Code backend

### Installation

Clone the repository:

```bash
git clone https://github.com/ConCode-Ohjelmistoprojekti2/concode-frontend.git
```

Navigate to the project folder:

```bash
cd concode-frontend
```

Install dependencies:

```bash
npm ci
```

### Environment Configuration

Create a `.env` file in the project root.

If your backend is running locally, add:

```env
VITE_BACKEND_URL=http://localhost:8080
```

The backend must be running and accessible for the application to load challenges and validate guesses.

### Start the Application

Run:

```bash
npm run dev
```

Open the frontend at:

http://localhost:5173

## Testing

The frontend uses Vitest and React Testing Library for automated testing.

The tests verify that:

- Both game modes are displayed on the main menu.
- Survival Mode starts and loads a random song.
- Daily Song starts and loads the daily challenge.
- Empty guesses are not submitted.
- Two points are awarded when both artist and song title are correct.
- One point is awarded when only the song title is correct.
- One point is awarded when only the artist is correct.

Run the tests:

```bash
npm test
```

Automated CI checks are run using GitHub Actions.

The current frontend test suite contains seven tests.

## Production Build

Create a production build using:

```bash
npm run build
```

This runs TypeScript compilation and builds the frontend with Vite.

The production files are generated in the `dist` directory.

## Deployment

The frontend is deployed on Render as a static web application.

**Live website: [https://concode-frontend.onrender.com](https://concode-frontend.onrender.com)**

Render builds the application using:

```bash
npm run build
```

The generated `dist` directory is published as the website.

The `VITE_BACKEND_URL` environment variable must point to the deployed backend API so the application can load songs and submit guesses.

## Backend

The backend is built using Java 21 and Spring Boot.

Song information is stored in a PostgreSQL database hosted on Supabase. The backend provides REST API endpoints for loading challenges and validating player guesses.

**Backend repository:**

https://github.com/ConCode-Ohjelmistoprojekti2/concode-backend

## Future Development

Possible future improvements include:

- User registration and login
- Personal game statistics
- Global leaderboards
- Customizable Survival Mode challenges
- Improved loading and error handling
- Additional gameplay features

## Project Goal

The goal of Con Code is to create an interactive and entertaining music guessing game where players identify songs using both audio and visual clues.

The project is developed as part of a software development team project at Haaga-Helia University of Applied Sciences.
