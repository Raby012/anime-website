export const dynamic = 'force-dynamic'

import React from "react";
import styles from "./page.module.css";
import { MediaData } from "../../ts/interfaces/anilistMediaData";
import * as MediaCardExpanded from "@/app/components/MediaCards/MediaInfoExpandedWithCover";
import { cookies } from "next/headers";
import { getMediaInfo } from "@/app/api/mediaInfo/anilist/mediaInfo";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: { episode: string; dub?: string };
}) {
  const accessTokenCookie = cookies().get("access_token")?.value;
  const userAuthorization = accessTokenCookie
    ? JSON.parse(accessTokenCookie).accessToken
    : undefined;

  const mediaInfo = await getMediaInfo({
    id: params.id,
    accessToken: userAuthorization,
  }).catch(() => null);

  if (!mediaInfo) return { title: "Watch | AniProject" };

  const episode = searchParams.episode || "1";
  const pageTitle = mediaInfo.format == "MOVIE"
    ? `Watch ${mediaInfo.title.userPreferred} | AniProject`
    : `Episode ${episode} - ${mediaInfo.title.userPreferred} | AniProject`;

  return { title: pageTitle };
}

export default async function WatchEpisode({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: {
    episode: string;
    source?: string;
    q?: string;
    t?: string;
    dub?: string;
  };
}) {
  const accessTokenCookie = cookies().get("access_token")?.value;
  const userAuthorization = accessTokenCookie
    ? JSON.parse(accessTokenCookie).accessToken
    : undefined;

  const mediaInfo = await getMediaInfo({
    id: params.id,
    accessToken: userAuthorization,
  }).catch(() => null);

  if (!mediaInfo) {
    return (
      <main id={styles.container}>
        <div style={{ padding: "40px", textAlign: "center", color: "#fff" }}>
          <h2>Media not found</h2>
        </div>
      </main>
    );
  }

  const episode = searchParams.episode || "1";
  const season = "1";

  // Get IMDB ID from external links
  const imdbLink = mediaInfo.externalLinks?.find(
    (link: { site: string; url: string }) =>
      link.site === "IMDb" || link.url?.includes("imdb.com")
  );

  const imdbId = imdbLink?.url?.match(/tt\d+/)?.[0];

  // Build embed URL
  const embedUrl = imdbId
    ? mediaInfo.format === "MOVIE"
      ? `https://vidsrc.to/embed/movie/${imdbId}`
      : `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`
    : null;

  return (
    <main id={styles.container}>
      <div className={styles.background}>
        <section id={styles.video_container}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="500px"
              allowFullScreen
              allow="fullscreen; autoplay"
              style={{ border: "none", borderRadius: "8px" }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "16px",
              background: "#111",
              borderRadius: "8px",
              color: "#fff"
            }}>
              <p style={{ fontSize: "24px" }}>😔</p>
              <h3>Streaming Unavailable</h3>
              <p style={{ color: "#aaa", textAlign: "center", maxWidth: "400px" }}>
                The streaming source for this anime is currently unavailable.
                Please try again later.
              </p>
            </div>
          )}
        </section>
      </div>

      <section id={styles.media_info_container}>
        <div id={styles.info_comments}>
          <div id={styles.heading_info_container}>
            <h1>
              {mediaInfo.format == "MOVIE"
                ? mediaInfo.title.userPreferred
                : `EP ${episode} - ${mediaInfo.title.userPreferred}`}
            </h1>

            <MediaCardExpanded.Container mediaInfo={mediaInfo as MediaData}>
              <p>
                <MediaCardExpanded.Description
                  description={mediaInfo.description}
                />
              </p>
            </MediaCardExpanded.Container>
          </div>
        </div>
      </section>
    </main>
  );
}
