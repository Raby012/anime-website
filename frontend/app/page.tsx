export const dynamic = 'force-dynamic'

// ... all your imports stay the same ...

export default async function Home() {
  const isOnMobileScreen = checkDeviceIsMobile(headers());
  const accessTokenCookie = cookies().get("access_token")?.value;
  const userAuthorization = accessTokenCookie
    ? JSON.parse(accessTokenCookie).accessToken
    : undefined;

  const listAnimesTrending = ((await anilist.getMediaForThisFormat({
    type: "ANIME",
    accessToken: userAuthorization,
  })) || []) as MediaData[];

  const listAnimesTrendingWithBackground = listAnimesTrending.filter(
    (item) => item.bannerImage
  );

  const listAnimesReleasingByPopularity = await anilist
    .getNewReleases({
      type: "ANIME",
      showAdultContent: false,
      status: "RELEASING",
      page: 1,
      perPage: 12,
      accessToken: userAuthorization,
    })
    .then((res) => (res || []) as MediaData[]);

  const listMediasToBannerSection = await anilist
    .getMediaForThisFormat({
      type: "ANIME",
      sort: "SCORE_DESC",
      accessToken: userAuthorization,
    })
    .then((res) =>
      ((res || []) as MediaData[]).filter((item) => item.isAdult == false)
    );

  const randomIndexForBannerSection =
    Math.floor(Math.random() * (listMediasToBannerSection?.length || 10)) + 1;

  const listMediasReleasedToday = await anilist
    .getReleasingByDaysRange({
      type: "ANIME",
      days: 0,
      perPage: 11,
      accessToken: userAuthorization,
    })
    .then((res) =>
      ((res || []) as AiringMediaResult[])
        .sort((a, b) => a.media.popularity - b.media.popularity)
        .reverse()
    )
    .then((res) => res.map((item) => item.media));

  // ... rest of return JSX stays exactly the same
