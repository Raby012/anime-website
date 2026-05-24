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

const EPISODES_PER_PAGE = 100;

export default function EpisodesContainer({
  imdb,
  mediaInfo,
  crunchyrollInitialEpisodes,
  episodesWatchedOnAnilist,
}: EpisodesContainerTypes) {

  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [currPage, setCurrPage] = useState<number>(0);
  const [selectedSource, setSelectedSource] = useState<"vidsrc" | "vidsrc2">("vidsrc");

  // Get total episodes - use all available sources
  const totalEpisodes = 
    (mediaInfo as any).episodes ||
    (mediaInfo as any).nextAiringEpisode?.episode - 1 ||
    imdb.episodesList.length ||
    crunchyrollInitialEpisodes.length ||
    12;

  // MAL ID for anime streaming (most reliable for anime)
  const malId = (mediaInfo as any).idMal;

  // IMDB ID fallback
  const imdbLink = (mediaInfo as any).externalLinks?.find(
    (link: { site: string; url: string }) =>
      link.site === "IMDb" || link.url?.includes("imdb.com")
  );
  const imdbId = imdbLink?.url?.match(/tt\d+/)?.[0];

  // Build embed URLs
  const getEmbedUrl = () => {
    if (mediaInfo.format === "MOVIE") {
      if (imdbId) return `https://vidsrc.to/embed/movie/${imdbId}`;
      return null;
    }

    // Use MAL ID for anime - vidsrc.to supports this!
    if (malId) {
      if (selectedSource === "vidsrc") {
        return `https://vidsrc.to/embed/anime/${malId}/${selectedEpisode}`;
      } else {
        return `https://vidsrc.net/embed/anime/${malId}/${selectedEpisode}`;
      }
    }

    // Fallback to IMDB ID
    if (imdbId) {
      return `https://vidsrc.to/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  // Pagination
  const totalPages = Math.ceil(totalEpisodes / EPISODES_PER_PAGE);
  const startEp = currPage * EPISODES_PER_PAGE + 1;
  const endEp = Math.min((currPage + 1) * EPISODES_PER_PAGE, totalEpisodes);
  const currentPageEpisodes = Array.from(
    { length: endEp - startEp + 1 },
    (_, i) => startEp + i
  );

  return (
    <div>
      <div id={styles.episodes_heading}>
        <h2 className={styles.heading_style}>EPISODES</h2>
      </div>

      {/* Source Selector */}
      {mediaInfo.format !== "MOVIE" && (
        <div style={{
          padding: "8px 16px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <span style={{ color: "#aaa", fontSize: "13px" }}>Source:</span>
          {["vidsrc", "vidsrc2"].map((source) => (
            <button
              key={source}
              onClick={() => setSelectedSource(source as "vidsrc" | "vidsrc2")}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                background: selectedSource === source ? "#E11D48" : "#333",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              {source === "vidsrc" ? "VidSrc" : "VidSrc 2"}
            </button>
          ))}
        </div>
      )}

      {/* Season selector */}
      {imdb.mediaSeasons && imdb.mediaSeasons.length > 1 && (
        <div style={{ padding: "8px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "#aaa", fontSize: "13px" }}>Season:</span>
          {imdb.mediaSeasons.map((season: any, key: number) => (
            <button
              key={key}
              onClick={() => {
                setSelectedSeason(season.season_number || key + 1);
                setSelectedEpisode(1);
                setCurrPage(0);
              }}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                background: selectedSeason === (season.season_number || key + 1)
                  ? "#E11D48"
                  : "#333",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              S{season.season_number || key + 1}
            </button>
          ))}
        </div>
      )}

      {/* Video Player */}
      <div style={{ padding: "16px" }}>
        {embedUrl ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            width="100%"
            height="480px"
            allowFullScreen
            allow="fullscreen; autoplay"
            style={{ border: "none", borderRadius: "8px", background: "#000" }}
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
              No streaming source found for this anime.
            </p>
          </div>
        )}
      </div>

      {/* Episode List */}
      {mediaInfo.format !== "MOVIE" && totalEpisodes > 0 && (
        <div style={{ padding: "0 16px 16px" }}>

          {/* Episode range info */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px"
          }}>
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              Now watching: Episode {selectedEpisode} | Total: {totalEpisodes} eps
            </p>
          </div>

          {/* Page navigation for long series */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "12px"
            }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrPage(i)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    border: "none",
                    background: currPage === i ? "#E11D48" : "#222",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  {i * EPISODES_PER_PAGE + 1}-{Math.min((i + 1) * EPISODES_PER_PAGE, totalEpisodes)}
                </button>
              ))}
            </div>
          )}

          {/* Episode buttons */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))",
            gap: "6px",
            maxHeight: "320px",
            overflowY: "auto",
            padding: "4px"
          }}>
            {currentPageEpisodes.map((epNum) => (
              <button
                key={epNum}
                onClick={() => setSelectedEpisode(epNum)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedEpisode === epNum
                    ? "#E11D48"
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
