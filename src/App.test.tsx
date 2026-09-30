
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("react-youtube", () => ({ default: () => null }));

const mockFetch = vi.fn();

beforeEach(() => {
    mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ youtubeVideoId: "test-video" }),
    });
    vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    mockFetch.mockReset();
});

describe("App start screen", () => {
    it("shows buttons for both game modes", () => {
        render(<App />);

        expect(
            screen.getByRole("button", { name: "Survival Mode" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Daily Song" }),
        ).toBeInTheDocument();
    });

    it("starts survival mode and loads a random song", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Survival Mode" }));

        expect(
            await screen.findByRole("heading", { name: "Con Code" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Round: 1" })).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/challenges/random"),
        );
    });

    it("starts daily song and loads daily song", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Daily Song" }));

        expect(
            await screen.findByRole("heading", { name: "Con Code" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Round: 1" })).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/challenges/daily"),
        );
    });

    it("user can't send an empty guess", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Survival Mode" }));
        await screen.findByRole("heading", { name: "Round: 1" });

        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/challenges/random"),
        );
    });

    it("gives two points when both artist and song title are right", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Survival Mode" }));
        await screen.findByRole("heading", { name: "Round: 1" });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                correctArtist: true,
                correctTitle: true,
                answer: { artist: "Test Artist", title: "Test Song" },
            }),
        });

        fireEvent.change(screen.getByPlaceholderText("Artist"), {
            target: { value: "Test Artist" },
        });
        fireEvent.change(screen.getByPlaceholderText("Song Title"), {
            target: { value: "Test Song" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await screen.findByRole("heading", { name: "Results" });
        expect(screen.getByRole("heading", { name: "Score: 2" })).toBeInTheDocument();
    });

    it("gives one point when only the song title is right", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Survival Mode" }));
        await screen.findByRole("heading", { name: "Round: 1" });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                correctArtist: false,
                correctTitle: true,
                answer: { artist: "Test Artist", title: "Test Song" },
            }),
        });

        fireEvent.change(screen.getByPlaceholderText("Artist"), {
            target: { value: "Wrong Artist" },
        });
        fireEvent.change(screen.getByPlaceholderText("Song Title"), {
            target: { value: "Test Song" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await screen.findByRole("heading", { name: "Results" });
        expect(screen.getByRole("heading", { name: "Score: 1" })).toBeInTheDocument();
    });

    it("gives one point when only the artist is right", async () => {
        render(<App />);

        fireEvent.click(screen.getByRole("button", { name: "Survival Mode" }));
        await screen.findByRole("heading", { name: "Round: 1" });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                correctArtist: true,
                correctTitle: false,
                answer: { artist: "Test Artist", title: "Test Song" },
            }),
        });

        fireEvent.change(screen.getByPlaceholderText("Artist"), {
            target: { value: "Test Artist" },
        });
        fireEvent.change(screen.getByPlaceholderText("Song Title"), {
            target: { value: "Wrong Song" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await screen.findByRole("heading", { name: "Results" });
        expect(screen.getByRole("heading", { name: "Score: 1" })).toBeInTheDocument();
    });
});