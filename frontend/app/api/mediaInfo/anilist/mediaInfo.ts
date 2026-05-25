import { MediaDataFullInfo } from "@/app/ts/interfaces/anilistMediaData";
import { getHeadersWithAuthorization } from "../../anilist/anilistUsers";

const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getMediaInfo({
  id,
  accessToken,
}: {
  id: number;
  accessToken?: string;
}) {
  try {
    const headersCustom = await getHeadersWithAuthorization({
      accessToken: accessToken,
    });

    const authToken = headersCustom?.Authorization?.slice(7);

    const url = new URL(`${NEXT_PUBLIC_BACKEND_URL}/media-info/anime/anilist`);
    url.searchParams.set("query", String(id));
    if (authToken) url.searchParams.set("authToken", authToken);

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // auto-refresh every 1 hour
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch media info for ID ${id}. Request failed with status code ${response.status}`
      );
    }

    const data = await response.json();
    return data.result as MediaDataFullInfo;

  } catch (error) {
    console.error((error as Error).message);
    throw new Error(
      `Failed to fetch media info for ID ${id}. ${(error as Error).message}`
    );
  }
}
