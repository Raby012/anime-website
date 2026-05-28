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
    getUrl: (id, s, e, movie) =>
      movie ? "https://vidsrcme.ru/embed/movie/" + id : "https://vidsrcme.ru/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "VidSrc 2",
    getUrl: (id, s, e, movie) =>
      movie ? "https://vidsrcme.su/embed/movie/" + id : "https://vidsrcme.su/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "VidSrc 3",
    getUrl: (id, s, e, movie) =>
      movie ? "https://vidsrc-me.ru/embed/movie/" + id : "https://vidsrc-me.ru/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "VidSrc 4",
    getUrl: (id, s, e, movie) =>
      movie ? "https://vsrc.su/embed/movie/" + id : "https://vsrc.su/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "VidSrc 5",
    getUrl: (id, s, e, movie) =>
      movie ? "https://vidsrc.to/embed/movie/" + id : "https://vidsrc.to/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "2Embed",
    getUrl: (id, s, e, movie) =>
      movie ? "https://www.2embed.cc/embed/" + id : "https://www.2embed.cc/embedtv/" + id + "&s=" + s + "&e=" + e,
  },
  {
    name: "VidSrc CC",
    getUrl: (id, s, e, movie) =>
      movie ? "https://vidsrc.cc/v2/embed/movie/" + id : "https://vidsrc.cc/v2/embed/tv/" + id + "/" + s + "/" + e,
  },
  {
    name: "SmashyStream",
    getUrl: (id, s, e, movie) =>
      movie ? "https://player.smashy.stream/movie/" + id : "https://player.smashy.stream/tv/" + id + "?s=" + s + "&e=" + e,
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
  const [imdbIdFromTmdb, setImdbIdFromTmdb] = useState<string | null>(null);

  const mediaAny = mediaInfo as any;

  // Check AniList external links FIRST — most reliable source
  const imdbLinkFromAnilist = mediaAny.externalLinks?.find(
    (link: { site: string; url: string }) =>
      link.site === "IMDb" || link.url?.includes("imdb.com")
  );
  const imdbIdFromAnilist = imdbLinkFromAnilist?.url?.match(/tt\d+/)?.[0];

  // Use AniList IMDB ID first, then fallback to TMDB lookup
  const imdbId = imdbIdFromAnilist || imdbIdFromTmdb || null;

  const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  useEffect(() => {
    // If we already have IMDB ID from AniList, skip TMDB search
    // but still fetch seasons from TMDB for episode counts
    if (!TMDB_KEY) return;

    async function fetchFromTmdb() {
      setIsLoadingSeasons(true);
      try {
        const year = mediaAny.seasonYear || mediaAny.startDate?.year || "";
        const titles = [
          mediaAny.title?.english,
          mediaAny.title?.romaji,
          mediaAny.title?.userPreferred,
        ].filter(Boolean);

        let show = null;

        for (const searchTitle of titles) {
          if (!searchTitle) continue;

          // FIX: add with_original_language=ja to only get Japanese anime
          // This prevents matching wrong live-action shows
          if (year) {
            const res = await fetch(
              "https://api.themoviedb.org/3/search/tv?api_key=" + TMDB_KEY +
              "&query=" + encodeURIComponent(searchTitle) +
              "&first_air_date_year=" + year +
              "&with_original_language=ja"
            );
            const data = await res.json();
            if (data.results?.length > 0) {
              show = data.results[0];
              break;
            }
          }

          // Try without year but still Japanese only
          const res2 = await fetch(
            "https://api.themoviedb.org/3/search/tv?api_key=" + TMDB_KEY +
            "&query=" + encodeURIComponent(searchTitle) +
            "&with_original_language=ja"
          );
          const data2 = await res2.json();
          if (data2.results?.length > 0) {
            show = data2.results[0];
            break;
          }
        }

        if (!show) {
          setIsLoadingSeasons(false);
          return;
        }

        const showRes = await fetch(
          "https://api.themoviedb.org/3/tv/" + show.id +
          "?api_key=" + TMDB_KEY + "&append_to_response=external_ids"
        );
        const showData = await showRes.json();

        // Only set TMDB IMDB ID if AniList didn't provide one
        if (!imdbIdFromAnilist) {
          const tmdbImdbId = showData.external_ids?.imdb_id;
          if (tmdbImdbId) setImdbIdFromTmdb(tmdbImdbId);
        }

        // Only seasons with episodes, skip specials (season 0)
        const seasons: TmdbSeason[] = (showData.seasons || []).filter(
          (s: TmdbSeason) => s.season_number > 0 && s.episode_count > 0
        );
        setTmdbSeasons(seasons);
        if (seasons.length > 0) setCurrSeasonEpisodes(seasons[0].episode_count);

      } catch (err) {
        console.error("TMDB fetch error:", err);
      }
      setIsLoadingSeasons(false);
    }

    fetchFromTmdb();
  }, [TMDB_KEY, mediaAny.id]);

  useEffect(() => {
    if (tmdbSeasons.length > 0) {
      const season = tmdbSeasons.find((s) => s.season_number === selectedSeason);
      if (season) {
        setCurrSeasonEpisodes(season.episode_count);
        setSelectedEpisode(1);
        setCurrPage(0);
      }
    }
  }, [selectedSeason, tmdbSeasons]);

  // Only valid IMDB seasons with actual episodes
  const validImdbSeasons = (imdb.mediaSeasons || []).filter(
    (season: any) =>
      season &&
      Array.isArray(season.episodes) &&
      season.episodes.length > 0 &&
      (season.season_number ?? 0) > 0
  );

  const totalEpisodes =
    currSeasonEpisodes ||
    mediaAny.episodes ||
    crunchyrollInitialEpisodes.length ||
    imdb.episodesList.length ||
    12;

  const embedUrl = imdbId
    ? SOURCES[selectedSource].getUrl(imdbId, selectedSeason, selectedEpisode, mediaInfo.format === "MOVIE")
    : null;

  const totalPages = Math.ceil(totalEpisodes / EPISODES_PER_PAGE);
  const startEp = currPage * EPISODES_PER_PAGE + 1;
  const endEp = Math.min((currPage + 1) * EPISODES_PER_PAGE, totalEpisodes);
  const currentPageEpisodes = Array.from({ length: endEp - startEp + 1 }, (_, i) => startEp + i);
  const isMovie = mediaInfo.format === "MOVIE";

  return (
    <div>
      <div id={styles.episodes_heading}>
        <h2 className={styles.heading_style}>EPISODES</h2>
      </div>

      {/* Server Selector */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
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
              transition: "background 0.2s",
            }}
          >
            {source.name}
          </button>
        ))}
      </div>

      {/* Season Selector - TMDB */}
      {!isMovie && tmdbSeasons.length > 1 && (
        <div style={{ padding: "8px 16px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
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
                transition: "background 0.2s",
              }}
            >
              {"S" + season.season_number}
            </button>
          ))}
        </div>
      )}

      {/* Season Selector - IMDB fallback */}
      {!isMovie && tmdbSeasons.length <= 1 && validImdbSeasons.length > 1 && (
        <div style={{ padding: "8px 16px", display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#aaa", fontSize: "13px" }}>Season:</span>
          {validImdbSeasons.map((season: any, key: number) => {
            const seasonNum = season.season_number || key + 1;
            return (
              <button
                key={key}
                onClick={() => { setSelectedSeason(seasonNum); setSelectedEpisode(1); setCurrPage(0); }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: selectedSeason === seasonNum ? "#E11D48" : "#333",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "background 0.2s",
                }}
              >
                {"S" + seasonNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Video Player */}
      <div style={{ padding: "16px" }}>
        {isLoadingSeasons ? (
          <div style={{ width: "100%", height: "480px", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", borderRadius: "8px", color: "#fff", flexDirection: "column", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #333", borderTop: "3px solid #E11D48", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#aaa" }}>Finding streaming source...</p>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          </div>
        ) : embedUrl ? (
          <iframe
            key={embedUrl + "-" + selectedSource + "-" + selectedSeason + "-" + selectedEpisode}
            src={embedUrl}
            width="100%"
            height="480px"
            allowFullScreen
            allow="fullscreen; autoplay"
            style={{ border: "none", borderRadius: "8px", background: "#000" }}
          />
        ) : (
          <div style={{ width: "100%", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", background: "#111", borderRadius: "8px", color: "#fff" }}>
            <p style={{ fontSize: "32px" }}>😔</p>
            <h3>Streaming Unavailable</h3>
            <p style={{ color: "#aaa", textAlign: "center", maxWidth: "360px", fontSize: "14px" }}>
              {!TMDB_KEY ? "TMDB API key not configured." : "Could not find this anime on streaming servers. Try a different server above."}
            </p>
          </div>
        )}
      </div>

      {/* Episode List */}
      {!isMovie && totalEpisodes > 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              {"Season " + selectedSeason + " • Episode " + selectedEpisode + " / " + totalEpisodes}
            </p>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" }}>
              <span style={{ color: "#aaa", fontSize: "12px" }}>Episodes:</span>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrPage(i); setSelectedEpisode(i * EPISODES_PER_PAGE + 1); }}
                  style={{ padding: "4px 10px", borderRadius: "4px", border: "none", background: currPage === i ? "#E11D48" : "#222", color: "#fff", cursor: "pointer", fontSize: "12px" }}
                >
                  {(i * EPISODES_PER_PAGE + 1) + "-" + Math.min((i + 1) * EPISODES_PER_PAGE, totalEpisodes)}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))", gap: "6px", maxHeight: "320px", overflowY: "auto", padding: "4px" }}>
            {currentPageEpisodes.map((epNum) => (
              <button
                key={epNum}
                onClick={() => setSelectedEpisode(epNum)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedEpisode === epNum ? "#E11D48" : episodesWatchedOnAnilist && epNum <= episodesWatchedOnAnilist ? "#1a5c2a" : "#222",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: selectedEpisode === epNum ? "bold" : "normal",
                  transition: "background 0.2s",
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
