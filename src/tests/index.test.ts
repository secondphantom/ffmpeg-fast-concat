import { ConcatVideosDto } from "../core/concat.service";
import { FfmpegFastConcat } from "../index";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

describe("index", () => {
  let ffmpegFastConcat: FfmpegFastConcat;
  const outputFile = process.env.OUTPUT_VIDEO!;
  const concatVideosDto: ConcatVideosDto = {
    inputVideoPaths: [process.env.INPUT_VIDEO_1!, process.env.INPUT_VIDEO_2!],
    outputVideoPath: process.env.OUTPUT_VIDEO!,
    transition: {
      duration: 500,
      name: "fade",
    },
  };
  beforeAll(async () => {
    ffmpegFastConcat = new FfmpegFastConcat({
      tempDir: process.env.TEMP_DIR_ROOT!,
    });
    if (fs.existsSync(outputFile)) {
      await fs.promises.rm(outputFile);
    }
  });

  afterAll(async () => {
    if (fs.existsSync(outputFile)) {
      await fs.promises.rm(outputFile);
    }
  });

  describe("concat", () => {
    test("videos", async () => {
      await ffmpegFastConcat.concat.videos(concatVideosDto);

      expect(fs.existsSync(outputFile)).toEqual(true);
    }, 60000);
  });
});
