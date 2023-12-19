import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import shortUUID from "short-uuid";

interface Transition {
  name: string;
  duration: number;
}

export type ConcatVideosDto = {
  inputVideoPaths: string[];
  outputVideoPath: string;
  transition: Transition;
};

export type CutVideoInput = {
  inputVideoPath: string;
  outputVideoPath: string;
  duration: number;
  startSec: number;
};

export class ConcatService {
  constructor(private tempDir: string, private concurrency: number = 4) {}

  concatVideos = async (dto: ConcatVideosDto) => {
    const tempDir = `${this.tempDir}/${shortUUID().generate()}`;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const cutVideoInputs = await this.getCutVideoInputs({ dto, tempDir });

    await this.splitVideos(cutVideoInputs);

    await this.createTransition({ dto, cutVideoInputs, tempDir });

    await this.mergeVideos({ dto, tempDir });

    await fs.promises.rm(tempDir, { recursive: true });
  };

  private splitVideos = async (cutVideoInputs: CutVideoInput[]) => {
    const concurrencyQueues = this.getSplitAry(
      cutVideoInputs,
      this.concurrency
    );

    for (const queue of concurrencyQueues) {
      const promiseAry = queue.map((v) => this.cutVideo(v));
      await Promise.all(promiseAry);
    }
  };

  private getCutVideoInputs = async ({
    dto,
    tempDir,
  }: {
    dto: ConcatVideosDto;
    tempDir: string;
  }) => {
    const { transition, inputVideoPaths: videos } = dto;

    let index = 0;
    let totalInputs = [];
    for (const inputVideoPath of videos) {
      const videoDuration = await this.getVideoDuration(inputVideoPath);
      const extension = path.extname(inputVideoPath);

      const inputs = [
        `${tempDir}/${index}_S${extension}`,
        `${tempDir}/${index}_M${extension}`,
        `${tempDir}/${index}_E${extension}`,
      ].map((outputVideoPath, index) => {
        if (index === 1) {
          return {
            inputVideoPath,
            outputVideoPath,
            duration: videoDuration - (2 * transition.duration) / 1000,
            startSec: transition.duration / 1000,
          };
        } else if (index === 2) {
          return {
            inputVideoPath,
            outputVideoPath,
            duration: transition.duration / 1000,
            startSec: videoDuration - transition.duration / 1000,
          };
        }
        return {
          inputVideoPath,
          outputVideoPath,
          duration: transition.duration / 1000,
          startSec: 0,
        };
      });
      index++;
      totalInputs.push(...inputs);
    }

    return totalInputs;
  };

  private getSplitAry = <T>(ary: T[], count: number) => {
    const splitAry = ary.reduce(
      (prev, cur, index) => {
        const curAry = prev[prev.length - 1];
        if (index !== 0 && index % count === 0) {
          prev.push([cur]);
          return prev;
        }
        curAry.push(cur);
        return prev;
      },
      [[]] as T[][]
    );

    return splitAry;
  };

  private cutVideo = async ({
    inputVideoPath,
    outputVideoPath,
    duration,
    startSec,
  }: CutVideoInput) => {
    const commands = [
      "-hwaccel_output_format",
      "cuda",
      "-i",
      inputVideoPath,
      "-y",
      "-ss",
      startSec,
      "-t",
      duration,
      "-c:v",
      "h264_nvenc",
      "-b:V",
      "20M",
      "-b:a",
      "128k",
      "-vcodec",
      "h264_nvenc",
      outputVideoPath,
    ].map((v) => String(v));

    await this.spawnFfmpeg(commands);
  };

  private createTransition = async ({
    dto,
    cutVideoInputs,
    tempDir,
  }: {
    dto: ConcatVideosDto;
    cutVideoInputs: CutVideoInput[];
    tempDir: string;
  }) => {
    const transitionInputs = cutVideoInputs
      .reduce((prev, cur, index) => {
        const curAry = prev[prev.length - 1];
        if (index === 0) return prev;
        if (index % 3 === 2) {
          curAry.push(cur);
          return prev;
        }
        if (index % 3 === 0) {
          curAry.push(cur);
          return prev;
        }
        prev.push([]);
        return prev;
      }, [] as CutVideoInput[][])
      .filter((v) => v.length === 2);

    const concurrencyQueues = this.getSplitAry(
      transitionInputs,
      this.concurrency
    );

    let transitionOutputs: string[] = [];
    for (const queue of concurrencyQueues) {
      const promiseAry = queue.map((v) => {
        return this.xFadeTransition(dto, v, tempDir);
      });
      await Promise.all(promiseAry).then((v) => {
        transitionOutputs.push(...v);
      });
    }
    return transitionOutputs;
  };

  private xFadeTransition = async (
    dto: ConcatVideosDto,
    cutVideoInputs: CutVideoInput[],
    tempDir: string
  ) => {
    const [input1, input2] = cutVideoInputs;
    const extension = path.extname(input1.outputVideoPath);
    const index = path.basename(input1.outputVideoPath).split("_")[0];
    const outputPath = `${tempDir}/${index}_T${extension}`;

    const commands = [
      "-i",
      input1.outputVideoPath,
      "-i",
      input2.outputVideoPath,
      "-y",
      "-filter_complex",
      `[0:v][1:v]xfade=duration=${
        dto.transition.duration / 1000
      }:offset=0:transition=${dto.transition.name},format=yuv420p`,
      outputPath,
    ].map((v) => String(v));

    await this.spawnFfmpeg(commands);
    return outputPath;
  };

  private mergeVideos = async ({
    dto,
    tempDir,
  }: {
    dto: ConcatVideosDto;
    tempDir: string;
  }) => {
    const concatListFilePath = await this.createConcatText(dto, tempDir);

    console.log(dto.outputVideoPath);
    const commands = [
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListFilePath,
      "-y",
      "-c",
      "copy",
      dto.outputVideoPath,
    ];

    await this.spawnFfmpeg(commands);
  };

  private createConcatText = async (dto: ConcatVideosDto, tempDir: string) => {
    const extension = path.extname(dto.inputVideoPaths[0]);
    const length = dto.inputVideoPaths.length;

    const concatText = Array.from({ length }, (_, index) => index)
      .map((v, index) => {
        if (index === 0) {
          return [
            `${tempDir}/${v}_S${extension}`,
            `${tempDir}/${v}_M${extension}`,
            `${tempDir}/${v}_T${extension}`,
          ];
        } else if (index === length - 1) {
          return [
            `${tempDir}/${v}_M${extension}`,
            `${tempDir}/${v}_E${extension}`,
          ];
        }
        return [
          `${tempDir}/${v}_M${extension}`,
          `${tempDir}/${v}_T${extension}`,
        ];
      })
      .flat()
      .map((v) => `file '${v}'`)
      .join("\n");

    const concatListFilePath = `${tempDir}/concat.txt`;
    await fs.promises.writeFile(concatListFilePath, concatText);

    return concatListFilePath;
  };

  private spawnFfmpeg = async (commands: string[]) => {
    return new Promise((resolve, reject) => {
      console.info(`command: ffmpeg ${commands.join(" ")}`);
      const proc = spawn(`ffmpeg`, commands);
      proc.once("error", reject);
      proc.stderr.on("data", (data) => {
        if (process.env.NODE_ENV === "verbose") {
          console.log(data.toString("utf8"));
        }
      });

      proc.on("exit", (code: any, signal: any) => {
        if (signal) code = signal;
        if (code != 0) {
          reject();
          console.log("Error");
        } else {
          resolve(null);
          if (process.env.NODE_ENV === "verbose") {
            console.log("Finish Processing");
          }
        }
      });
    });
  };

  private getVideoDuration = (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration as number;
          resolve(duration);
        }
      });
    });
  };
}
