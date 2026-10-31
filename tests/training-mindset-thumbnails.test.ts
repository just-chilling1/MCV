import { describe, expect, it } from "vitest";
import { getMindsetTutorialVideos } from "@/lib/training-content";
import { ACADEMY_MINDSET_THUMBNAILS } from "@/lib/video-thumbnails";

describe("getMindsetTutorialVideos", () => {
  it("attaches mindset poster paths for every card", () => {
    const videos = getMindsetTutorialVideos();
    expect(videos).toHaveLength(ACADEMY_MINDSET_THUMBNAILS.length);
    videos.forEach((video, index) => {
      expect(video.thumbnailSrc).toBe(ACADEMY_MINDSET_THUMBNAILS[index]);
      expect(video.thumbnailSrc).toMatch(/^\/thumbnails\/mcv-thumb-\d+-mindset/);
    });
  });
});
