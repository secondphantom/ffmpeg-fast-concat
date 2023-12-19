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
    inputVideoPaths: [process.env.INPUT_VIDEO_1!, process.env.INPUT_VIDEO_2!],
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

  test("cutVideo", async () => {
    await concatService["cutVideo"]({
      inputVideoPath: process.env.INPUT_VIDEO_1!,
      outputVideoPath: cutVideoFile,
      duration: 10,
      startSec: 3,
    });
    expect(fs.existsSync(cutVideoFile)).toEqual(true);
  }, 30000);

  test("splitVideos", async () => {
    await concatService["splitVideos"](cutVideoInputs);

    cutVideoInputs
      .map((v) => fs.existsSync(v.outputVideoPath))
      .forEach((v) => expect(v).toEqual(true));
  }, 30000);

  test("createTransition", async () => {
    const transitionOutputs = await concatService["createTransition"]({
      dto: concatVideosDto,
      cutVideoInputs,
      tempDir,
    });

    transitionOutputs
      .map((v) => fs.existsSync(v))
      .forEach((v) => expect(v).toEqual(true));
  });

  test("mergeVideos", async () => {
    await concatService["mergeVideos"]({
      dto: concatVideosDto,
      tempDir,
    });

    expect(fs.existsSync(outputFile)).toEqual(true);
  });
});
