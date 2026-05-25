import React, { MouseEventHandler, useId } from "react";
import styles from "./component.module.css";
import Image from "next/image";
import { MediaData } from "@/app/ts/interfaces/anilistMediaData";
import Link from "next/link";
import { MediaOnJSONFile } from "@/app/ts/interfaces/jsonMediaData";

type SearchResultsTypes = {
  handleChoseResult?: MouseEventHandler<HTMLDivElement>;
  mediaFromAnilist?: MediaData;
  mediaFromOfflineDB?: MediaOnJSONFile;
};

function SearchResultItemCard({
  handleChoseResult,
  mediaFromAnilist,
  mediaFromOfflineDB,
}: SearchResultsTypes) {
  const elementId = useId();

  function changeHeadingColor(isHovering: boolean) {
    const el = document
      .getElementById(elementId)!
      .getElementsByTagName("h5")[0]
      .getElementsByTagName("a")[0];

    if (isHovering)
      return (el!.style.color =
        mediaFromAnilist?.coverImage?.color || "var(--white-100)");

    el!.style.color = "var(--white-100)";
    return;
  }

  const imgSource =
    mediaFromAnilist?.coverImage?.large ||
    mediaFromAnilist?.coverImage?.medium ||
    mediaFromOfflineDB?.picture ||
    mediaFromOfflineDB?.thumbnail;

  const mediaTitle = mediaFromAnilist?.title.userPreferred
    ? mediaFromAnilist.title.userPreferred
    : mediaFromAnilist?.title?.romaji ||
      mediaFromOfflineDB?.title ||
      `No Title`;

  const mediaType = mediaFromAnilist?.type
    ? mediaFromAnilist.type
    : mediaFromOfflineDB?.type || "No Type Defined";

  // Determine if this is manga to use correct search type
  const isManga = mediaType === "MANGA";
  const searchType = isManga ? "manga" : "anime";

  return (
    <li
      id={elementId}
      className={styles.result_container}
      onMouseEnter={() => changeHeadingColor(true)}
      onMouseLeave={() => changeHeadingColor(false)}
    >
      <div className={styles.image_container} onClick={handleChoseResult}>
        <Link href={`/media/${mediaFromAnilist?.id || mediaFromOfflineDB?.anilistId}`}>
          <Image
            src={imgSource}
            alt={`Cover Art for ${mediaFromAnilist?.title.userPreferred}`}
            fill
            sizes="90px"
          />
        </Link>
      </div>

      <div className={styles.result_info_container}>
        <h5 onClick={handleChoseResult}>
          <Link href={`/media/${mediaFromAnilist?.id || mediaFromOfflineDB?.anilistId}`}>
            {mediaTitle}
          </Link>
        </h5>

        <div>
          {mediaFromAnilist?.genres && (
            <ul className={`display_flex_row ${styles.genres_container}`}>
              {mediaFromAnilist.genres.slice(0, 3).map((item: string, key) => (
                <li key={key}>
                  {/* FIX: was /genre/${item} — caused Page Not Found */}
                  <Link href={`/search?type=${searchType}&genre=[${item.toLowerCase()}]`}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {mediaFromOfflineDB?.tags && (
            <ul className={`display_flex_row ${styles.genres_container}`}>
              {mediaFromOfflineDB.tags.slice(0, 3).map((item: string, key) => (
                <li key={key}>
                  {/* FIX: was /genre/${item} — caused Page Not Found */}
                  <Link href={`/search?type=anime&genre=[${item.toLowerCase()}]`}>
                    {item.slice(0, 1).toUpperCase() + item.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className={`${styles.width_flex} display_flex_row`}>
            <p>
              {mediaFromAnilist?.isAdult && <span>+18</span>}
              {mediaType}
            </p>

            {mediaFromAnilist?.startDate != undefined ? (
              <small>
                {mediaType == "ANIME" && "First aired in "}
                {mediaType == "MANGA" && "Published in "}
                {mediaFromAnilist.startDate.year}
              </small>
            ) : (
              <small>
                {mediaFromOfflineDB?.animeSeason.year || "No Date Available"}
              </small>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default SearchResultItemCard;
