"use client";
import React, { useState } from "react";
import styles from "./component.module.css";
import { MediaData, MediaDataFullInfo, EpisodesType } from "@/app/ts/interfaces/anilistMediaData";
import { ImdbEpisode, ImdbMediaInfo } from "@/app/ts/interfaces/imdb";

type EpisodesContainerTypes = {
  imdb: {
    mediaSeasons: ImdbMediaInfo["seasons"];
    episodesList: ImdbEpisode[];
  };
  mediaInfo: MediaData | MediaDataFullInfo;
  crunchyrollInitialEpisodes: EpisodesType[];
  episodesWatchedOnAnilist?: number;
};

export default function EpisodesContainer({
  imdb,
  mediaInfo,
  crunchyrollInitialEpisodes,
  episodesWatchedOnAnilist,
}: EpisodesContainerTypes) {

  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Get IMDB ID from external links
  const imdbLink = (mediaInfo as any).externalLinks?.find(
    (link: { site: string; url: string }) =>
      link.site === "IMDb" || link.url?.includes("imdb.com")
  );
  const imdbId = imdbLink?.url?.match(/tt\d+/)?.[0];

  // Total episodes count
  const totalEpisodes = mediaInfo.episodes ||
    crunchyrollInitialEpisodes.length ||
    imdb.episodesList.length ||
    12;

  // Build embed URL
  const embedUrl = imdbId
    ? mediaInfo.format === "MOVIE"
      ? `https://vidsrc.to/embed/movie/${imdbId}`
      : `https://vidsrc.to/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`
    : null;

  // Generate episode buttons
  const episodeNumbers = Array.from(
    { length: totalEpisodes },
    (_, i) => i + 1
  );

  // Get seasons from IMDB if available
  const seasons = imdb.mediaSeasons || [{ season_number: 1 }];

  return (
    <div>
      <div id={styles.episodes_heading}>
        <h2 className={styles.heading_style}>EPISODES</h2>
      </div>

      {/* Season selector if multiple seasons */}
      {seasons.length > 1 && (
        <div style={{ padding: "8px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {seasons.map((season: any, key: number) => (
            <button
              key={key}
              onClick={() => {
                setSelectedSeason(season.season_number || key + 1);
                setSelectedEpisode(1);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                border: "none",
                background: selectedSeason === (season.season_number || key + 1)
                  ? "var(--brand-color, #E11D48)"
                  : "#333",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Season {season.season_number || key + 1}
            </button>
          ))}
        </div>
      )}

      {/* Video Player */}
      <div style={{ padding: "16px" }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="480px"
            allowFullScreen
            allow="fullscreen; autoplay"
            style={{
              border: "none",
              borderRadius: "8px",
              background: "#000"
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "12px",
            background: "#111",
            borderRadius: "8px",
            color: "#fff"
          }}>
            <p style={{ fontSize: "32px" }}>😔</p>
            <h3>Streaming Unavailable</h3>
            <p style={{ color: "#aaa", textAlign: "center", maxWidth: "360px", fontSize: "14px" }}>
              No streaming source available for this anime yet.
            </p>
          </div>
        )}
      </div>

      {/* Episode List */}
      {mediaInfo.format !== "MOVIE" && (
        <div style={{ padding: "0 16px 16px" }}>
          <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "10px" }}>
            Now watching: Episode {selectedEpisode}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
            gap: "8px",
            maxHeight: "300px",
            overflowY: "auto",
            padding: "4px"
          }}>
            {episodeNumbers.map((epNum) => (
              <button
                key={epNum}
                onClick={() => setSelectedEpisode(epNum)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedEpisode === epNum
                    ? "var(--brand-color, #E11D48)"
                    : episodesWatchedOnAnilist && epNum <= episodesWatchedOnAnilist
                      ? "#1a5c2a"
                      : "#222",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: selectedEpisode === epNum ? "bold" : "normal",
                  transition: "background 0.2s"
                }}
              >
                {epNum}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
