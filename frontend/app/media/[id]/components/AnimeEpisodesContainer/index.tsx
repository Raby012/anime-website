"use client";
import React, { useState, useEffect } from "react";
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

type Source = {
  name: string;
  getUrl: (imdbId: string, season: number, episode: number, isMovie: boolean) => string;
};

const SOURCES: Source[] = [
  {
    name: "VidSrc 1",
    getUrl: (id, s, e, movie) => movie
      ? `https://vidsrcme.ru/embed/movie/${id}`
      : `https://vidsrcme.ru/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc 2",
    getUrl: (id, s, e, movie) => movie
      ? `https://vidsrcme.su/embed/movie/${id}`
      : `https://vidsrcme.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc 3",
    getUrl: (id, s, e, movie) => movie
      ? `https://vidsrc-me.ru/embed/movie/${id}`
      : `https://vidsrc-me.ru/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc 4",
    getUrl: (id, s, e, movie) => movie
      ? `https://vsrc.su/embed/movie/${id}`
      : `https://vsrc.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSrc 5",
    getUrl: (id, s, e, movie) => movie
      ? `https://vidsrc.to/embed/movie/${id}`
      : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
];

const EPISODES_PER_PAGE = 100;

type TmdbSeason = {
  season_number: number;
  episode_count: number;
  name: string;
};

export default function EpisodesContainer({
  imdb,
  mediaInfo,
  crunchyrollInitialEpisodes,
  episodesWatchedOnAnilist,
}: EpisodesContainerTypes) {

  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [currPage, setCurrPage] = useState<number>(0);
  const [selectedSource, setSelectedSource] = useState<number>(0);
  const [tmdbSeasons, setTmdbSeasons] = useState<TmdbSeason[]>([]);
  const [currSeasonEpisodes, setCurrSeasonEpisodes] = useState<number>(0);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState<boolean>(false);

  // Get IMDB ID from external links
  const imdbLink = (mediaInfo as any).externalLinks?.find(
    (link: { site: string; url: string }) =>
      link.site === "IMDb" || link.url?.includes("imdb.com")
  );
  const imdbId = imdbLink?.url?.match(/tt\d+/)?.[0];

  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // Fetch TMDB seasons info
  useEffect(() => {
    if (!imdbId || !TMDB_KEY || mediaInfo.format === "MOVIE") return;

    async function fetchTmdbSeasons() {
      setIsLoadingSeasons(true);
      try {
        // First find TMDB ID from IMDB ID
        const findRes = await fetch(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`
        );
        const findData = await findRes.json();
        const tmdbId = findData.tv_results?.[0]?.id;

        if (!tmdbId) {
          setIsLoadingSeasons(false);
          return;
        }

        // Get show details with seasons
        const showRes = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_KEY}`
        );
        const showData = await showRes.json();

        const seasons = showData.seasons?.filter(
          (s: TmdbSeason) => s.season_number > 0
        ) || [];

        setTmdbSeasons(seasons);
        if (seasons.length > 0) {
          setCurrSeasonEpisodes(seasons[0].episode_count);
        }
      } catch (err) {
        console.error("TMDB fetch error:", err);
      }
      setIsLoadingSeasons(false);
    }

    fetchTmdbSeasons();
  }, [imdbId, TMDB_KEY]);

  // Update episode count when season changes
  useEffect(() => {
    if (tmdbSeasons.length > 0) {
      const season = tmdbSeasons.find(s => s.season_number === selectedSeason);
      if (season) {
        setCurrSeasonEpisodes(season.episode_count);
        setSelectedEpisode(1);
        setCurrPage(0);
      }
    }
  }, [selectedSeason, tmdbSeasons]);

  // Total episodes for current season
  const totalEpisodes = currSeasonEpisodes ||
    (mediaInfo as any).episodes ||
    crunchyrollInitialEpisodes.length ||
    imdb.episodesList.length ||
    12;

  // Build embed URL
  const embedUrl = imdbId
    ? SOURCES[selectedSource].getUrl(
        imdbId,
        selectedSeason,
        selectedEpisode,
        mediaInfo.format === "MOVIE"
      )
    : null;

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
      <div style={{
        padding: "8px 16px",
        display: "flex",
        gap: "6px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <span style={{ color: "#aaa", fontSize: "13px" }}>Server:</span>
        {SOURCES.map((source, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedSource(idx)}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              border: "none",
              background: selectedSource === idx ? "#E11D48" : "#333",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              transition: "background 0.2s"
            }}
          >
            {source.name}
          </button>
        ))}
      </div>

      {/* Season Selector */}
      {mediaInfo.format !== "MOVIE" && tmdbSeasons.length > 1 && (
        <div style={{
          padding: "8px 16px",
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <span style={{ color: "#aaa", fontSize: "13px" }}>Season:</span>
          {tmdbSeasons.map((season) => (
            <button
              key={season.season_number}
              onClick={() => setSelectedSeason(season.season_number)}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                background: selectedSeason === season.season_number ? "#E11D48" : "#333",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                transition: "background 0.2s"
              }}
            >
              S{season.season_number}
            </button>
          ))}
        </div>
      )}

      {/* IMDB seasons fallback */}
      {mediaInfo.format !== "MOVIE" && tmdbSeasons.length === 0 && imdb.mediaSeasons && imdb.mediaSeasons.length > 1 && (
        <div style={{
          padding: "8px 16px",
          display: "flex",
          gap: "6px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
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
                background: selectedSeason === (season.season_number || key + 1) ? "#E11D48" : "#333",
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
            key={`${embedUrl}-${selectedSource}`}
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
              No streaming source found. This anime may not have an IMDB link in AniList.
            </p>
          </div>
        )}
      </div>

      {/* Episode List */}
      {mediaInfo.format !== "MOVIE" && totalEpisodes > 0 && (
        <div style={{ padding: "0 16px 16px" }}>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              Season {selectedSeason} • Episode {selectedEpisode} / {totalEpisodes}
              {isLoadingSeasons && " • Loading season info..."}
            </p>
          </div>

          {/* Page navigation for long series like Shin-chan */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginBottom: "12px"
            }}>
              <span style={{ color: "#aaa", fontSize: "12px", alignSelf: "center" }}>Episodes:</span>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrPage(i);
                    setSelectedEpisode(i * EPISODES_PER_PAGE + 1);
                  }}
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
