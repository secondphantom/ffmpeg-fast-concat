import {
  ConcatVideosDto,
  ConcatService,
  CutVideoInput,
} from "../../core/concat.service";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

describe("concat service", () => {
  let concatService: ConcatService;
  const concatVideosDto: ConcatVideosDto = {
    inputVideoPaths: [
      process.env.INPUT_VIDEO_1!,
      process.env.INPUT_VIDEO_2!,
      process.env.INPUT_VIDEO_3!,
      process.env.INPUT_VIDEO_4!,
      process.env.INPUT_VIDEO_5!,
      process.env.INPUT_VIDEO_6!,
      process.env.INPUT_VIDEO_7!,
      process.env.INPUT_VIDEO_8!,
      process.env.INPUT_VIDEO_9!,
    ],
    outputVideoPath: process.env.OUTPUT_VIDEO!,
    transition: {
      duration: 500,
      name: "fade",
    },
  };
  const tempDir = process.env.TEMP_DIR!;
  let cutVideoInputs: CutVideoInput[] = [];
  const outputFile = process.env.OUTPUT_VIDEO!;
  const cutVideoFile = process.env.OUTPUT_VIDEO_1_CUT!;
  beforeAll(async () => {
    concatService = new ConcatService(process.env.TEMP_DIR_ROOT!);
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    if (fs.existsSync(process.env.OUTPUT_VIDEO!)) {
      await fs.promises.rm(outputFile);
    }
    if (fs.existsSync(cutVideoFile)) {
      await fs.promises.rm(cutVideoFile);
    }

    cutVideoInputs = (await concatService["getCutVideoInputs"]({
      dto: concatVideosDto,
      tempDir: tempDir,
    })) as CutVideoInput[];
  });

  afterAll(async () => {
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true });
    }
    if (fs.existsSync(outputFile)) {
      await fs.promises.rm(outputFile);
    }
    if (fs.existsSync(cutVideoFile)) {
      await fs.promises.rm(cutVideoFile);
    }
  });

  test("getCutVideoInputs", async () => {
    const concatDto: ConcatVideosDto = {
      inputVideoPaths: [process.env.INPUT_VIDEO_1!, process.env.INPUT_VIDEO_2!],
      outputVideoPath: process.env.OUTPUT_VIDEO!,
      transition: {
        duration: 500,
        name: "fade",
      },
    };

    const cutVideoInputs = await concatService["getCutVideoInputs"]({
      dto: concatDto,
      tempDir: process.env.TEMP_DIR!,
    });

    cutVideoInputs.forEach((v) =>
      expect(v).toMatchObject({
        inputVideoPath: expect.any(String),
        outputVideoPath: expect.any(String),
        duration: expect.any(Number),
        startSec: expect.any(Number),
      })
    );
  });

  test.skip("get video meta", async () => {
    const res = await concatService["getVideoMeta"](
      process.env.INPUT_LONG_VIDEO_1!
    );

    expect(res).toMatchObject({
      videoDuration: expect.any(Number),
      videoBitRate: expect.any(Number),
    });
  });

  test.skip("cutVideo", async () => {
    console.time("cutVideo");
    await concatService["cutVideo"]({
      inputVideoPath: process.env.INPUT_LONG_VIDEO_1!,
      outputVideoPath: cutVideoFile,
      duration: 100,
      startSec: 0,
      videoBitRate: 20000,
    });
    expect(fs.existsSync(cutVideoFile)).toEqual(true);
    console.timeEnd("cutVideo");
  }, 60000);

  test("splitVideos", async () => {
    console.time("splitVideos");
    await concatService["splitVideos"](cutVideoInputs);

    cutVideoInputs
      .map((v) => fs.existsSync(v.outputVideoPath))
      .forEach((v) => expect(v).toEqual(true));
    console.timeEnd("splitVideos");
  }, 600000);

  test("createTransition", async () => {
    const transitionOutputs = await concatService["createTransition"]({
      dto: concatVideosDto,
      cutVideoInputs,
      tempDir,
    });

    transitionOutputs
      .map((v) => fs.existsSync(v))
      .forEach((v) => expect(v).toEqual(true));
  }, 600000);

  test("mergeVideos", async () => {
    await concatService["mergeVideos"]({
      dto: concatVideosDto,
      tempDir,
    });

    expect(fs.existsSync(outputFile)).toEqual(true);
  });
});
