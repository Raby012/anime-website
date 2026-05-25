export const dynamic = 'force-dynamic'
import React from "react";
import styles from "./page.module.css";
import NavigationSideBar from "./components/NavigationSideBar";
import ResultsContainer from "./components/ResultsContainer";
import { headers } from "next/headers";
import { checkDeviceIsMobile } from "../lib/checkMobileOrDesktop";
import { Metadata } from "next";
import { animeDatabaseSearchMedias } from "../api/search/anime-database/search";
import anilist from "../api/anilist/anilistMedias";

export const metadata: Metadata = {
  title: "Search | AniProject",
  description: "Filter animes and mangas by genre, year, status and more.",
};

type SearchPageTypes = {
  type?: string;
  title?: string;
  genre?: string[];
  year?: number;
  status?: string;
  page?: string;
  sort?: string;
  season?: string;
};

async function SearchPage({ searchParams }: { searchParams: SearchPageTypes }) {
  const isMobile = checkDeviceIsMobile(headers());
  const isManga = searchParams.type === "manga";

  let results: any[] = [];
  let lastUpdate = null;
  let totalLength = 0;

  if (isManga) {
    // Manga search via AniList
    try {
      const mangaResults = await anilist.getMediaForThisFormat({
        type: "MANGA",
        sort: searchParams.sort?.toUpperCase() || "TRENDING_DESC",
        genre: searchParams.genre?.[0] || undefined,
        search: searchParams.title || undefined,
        page: searchParams.page ? Number(searchParams.page) : 1,
      }) as any[];
      results = mangaResults || [];
      totalLength = results.length;
    } catch {
      results = [];
    }
  } else {
    // Anime search (existing)
    const sortedMedias = await animeDatabaseSearchMedias({ searchParams });
    results = sortedMedias.results;
    lastUpdate = sortedMedias.lastUpdate;
    totalLength = sortedMedias.allResultsLength;
  }

  return (
    <main id={styles.container}>
      {/* Anime / Manga tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "16px 16px 0",
        borderBottom: "1px solid #222",
        marginBottom: "8px"
      }}>
        
          href={`/search?type=anime${searchParams.title ? `&title=${searchParams.title}` : ""}`}
          style={{
            padding: "8px 20px",
            borderRadius: "4px 4px 0 0",
            background: !isManga ? "#E11D48" : "#222",
            color: "#fff",
            textDecoration: "none",
            fontWeight: !isManga ? "bold" : "normal",
            fontSize: "14px"
          }}
        >
          Anime
        </a>
        
          href={`/search?type=manga${searchParams.title ? `&title=${searchParams.title}` : ""}`}
          style={{
            padding: "8px 20px",
            borderRadius: "4px 4px 0 0",
            background: isManga ? "#E11D48" : "#222",
            color: "#fff",
            textDecoration: "none",
            fontWeight: isManga ? "bold" : "normal",
            fontSize: "14px"
          }}
        >
          Manga
        </a>
      </div>

      <div id={styles.side_nav}>
        <NavigationSideBar isMobile={isMobile || false} />
      </div>

      <ResultsContainer
        mediasList={results}
        lastUpdate={lastUpdate}
        totalLength={totalLength}
      />
    </main>
  );
}

export default SearchPage;
