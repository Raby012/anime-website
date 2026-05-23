"use client"

export const dynamic = 'force-dynamic'

import styles from "./page.module.css";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import HeroCarousel from "./components/HomePage/HeroCarouselHomePage";
import anilist from "./api/anilist/anilistMedias";
import NavigationThroughMedias from "./components/HomePage/NavigationThroughMedias";
import parse from "html-react-parser";
import NewestMediaSection from "./components/HomePage/NewestMediaSection";
import MediaRankingSection from "./components/HomePage/MediaRankingSection";
import { AiringMediaResult, MediaData } from "./ts/interfaces/anilistMediaData";
import * as AddToPlaylistButton from "./components/Buttons/AddToFavourites";
import KeepWatchingSection from "./components/HomePage/KeepWatchingSection";
import PopularMediaSection from "./components/HomePage/PopularMediaSection";

export default function Home() {
  const [listAnimesTrending, setListAnimesTrending] = useState<MediaData[]>([]);
  const [listAnimesReleasingByPopularity, setListAnimesReleasingByPopularity] = useState<MediaData[]>([]);
  const [listMediasToBannerSection, setListMediasToBannerSection] = useState<MediaData[]>([]);
  const [listMediasReleasedToday, setListMediasReleasedToday] = useState<MediaData[]>([]);
  const [randomIndex, setRandomIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const trending = await anilist.getMediaForThisFormat({
          type: "ANIME",
        }).catch(() => []);

        const trendingList = (trending || []) as MediaData[];
        setListAnimesTrending(trendingList);

        const releasing = await anilist.getNewReleases({
          type: "ANIME",
          showAdultContent: false,
          status: "RELEASING",
          page: 1,
          perPage: 12,
        }).catch(() => []);

        setListAnimesReleasingByPopularity((releasing || []) as MediaData[]);

        const bannerList = await anilist.getMediaForThisFormat({
          type: "ANIME",
          sort: "SCORE_DESC",
        }).then((res) =>
          ((res || []) as MediaData[]).filter((item) => item.isAdult == false)
        ).catch(() => [] as MediaData[]);

        setListMediasToBannerSection(bannerList);
        setRandomIndex(Math.floor(Math.random() * (bannerList?.length || 10)) + 1);

        const today = await anilist.getReleasingByDaysRange({
          type: "ANIME",
          days: 0,
          perPage: 11,
        }).then((res) =>
          ((res || []) as AiringMediaResult[])
            .sort((a, b) => a.media.popularity - b.media.popularity)
            .reverse()
        ).then((res) => res.map((item) => item.media))
        .catch(() => [] as MediaData[]);

        setListMediasReleasedToday(today);

      } catch (err) {
        console.error("Failed to fetch homepage data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <main style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <img src="/logo.png" alt="AniProject" style={{ width: "80px" }} />
        <p style={{ color: "#fff" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main id={styles.container} className={styles.main}>
      <HeroCarousel
        animesList={listAnimesTrending.filter((item) => item.bannerImage)}
        isOnMobileScreen={false}
      />

      <KeepWatchingSection />

      <PopularMediaSection animesList={listAnimesReleasingByPopularity} />

      <section className={styles.medias_sections_container}>
        <NavigationThroughMedias
          headingTitle={"Latest Releases"}
          route={"#"}
          sortBy="RELEASE"
          isFetchByDateButtonsOnScreen
          isResultsSortedByTrending
        />
      </section>

      {listMediasToBannerSection.length > 0 && listMediasToBannerSection[randomIndex] && (
        <section
          id={styles.media_banner_container}
          style={{
            background: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(${listMediasToBannerSection[randomIndex]?.bannerImage})`,
          }}
        >
          <div>
            <div id={styles.media_info}>
              <h3>
                <Link href={`/media/${listMediasToBannerSection[randomIndex].id}`}>
                  {listMediasToBannerSection[randomIndex].title.romaji}
                </Link>
              </h3>

              {listMediasToBannerSection[randomIndex]?.description && (
                <span>
                  {parse(
                    listMediasToBannerSection[randomIndex].description.replace(
                      new RegExp(`<br[^>]*>|<\/br>`, "gi"),
                      " "
                    )
                  )}
                </span>
              )}

              <div className={styles.item_buttons}>
                <Link href={`/media/${listMediasToBannerSection[randomIndex].id}`}>
                  WATCH NOW
                </Link>
                <AddToPlaylistButton.Button
                  mediaInfo={listMediasToBannerSection[randomIndex]}
                />
              </div>
            </div>

            <div id={styles.player_button_container}>
              {listMediasToBannerSection[randomIndex]?.trailer && (
                <iframe
                  className="yt_embed_video"
                  src={`https://www.youtube.com/embed/${listMediasToBannerSection[randomIndex].trailer.id}?controls=0&showinfo=0`}
                  frameBorder={0}
                  title={listMediasToBannerSection[randomIndex].title.romaji + " Trailer"}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope;"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </section>
      )}

      <section className={`${styles.medias_sections_container} ${styles.dark_background}`}>
        <NavigationThroughMedias
          headingTitle={"All Time Favorites"}
          route={"#"}
          sortBy={"FAVOURITES_DESC"}
          onDarkBackground
        />
      </section>

      <section className={`${styles.medias_sections_container}`}>
        <NavigationThroughMedias
          headingTitle={"Show Me Something New"}
          route={"#"}
          sortBy={"UPDATED_AT_DESC"}
          isLayoutInverted
        />
      </section>

      <section className={styles.background}>
        <section className={`${styles.medias_sections_container} ${styles.transparent_background}`}>
          <NavigationThroughMedias
            headingTitle={"Best Rated Mangas"}
            route={"#"}
            mediaFormat="MANGA"
            sortBy={"FAVOURITES_DESC"}
            onDarkBackground
          />
        </section>

        <div id={styles.media_ranks_container}>
          <MediaRankingSection initialAnimesList={listAnimesTrending} />
          <NewestMediaSection initialAnimesList={listMediasReleasedToday} />
        </div>
      </section>
    </main>
  );
}
