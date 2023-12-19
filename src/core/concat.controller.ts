import { ConcatService, ConcatVideosDto } from "./concat.service";

export class ConcatController {
  constructor(private concatService: ConcatService) {}

  videos = async (dto: ConcatVideosDto) => {
    const validatedDto = this.validateConcatVideosDto(dto);
    await this.concatService.concatVideos(validatedDto);
  };

  private validateConcatVideosDto = (dto: ConcatVideosDto) => {
    const { inputVideoPaths, outputVideoPath, transition } = dto;

    if (inputVideoPaths === undefined)
      throw new Error("concatVideos input:  inputVideoPaths is required");
    if (outputVideoPath === undefined)
      throw new Error("concatVideos input: outputVideoPath is required");
    if (transition === undefined)
      throw new Error("concatVideos input: transition is required");

    if (transition.duration === undefined)
      throw new Error("concatVideos input: transition.duration is required");
    if (transition.name === undefined)
      throw new Error("concatVideos input: transition.name is required");
    if (!Array.isArray(inputVideoPaths)) {
      throw new Error("concatVideos input:  inputVideoPaths is string array");
    }
    if (inputVideoPaths.length < 2) {
      throw new Error(
        "concatVideos input:  inputVideoPaths require minimum 2 items"
      );
    }

    inputVideoPaths.forEach((v) => {
      if (typeof v !== "string") {
        throw new Error("concatVideos input: inputVideoPaths are string array");
      }
    });

    if (typeof outputVideoPath !== "string") {
      throw new Error("concatVideos input: outputVideoPath is string");
    }

    const { duration, name } = transition;
    if (typeof name !== "string") {
      throw new Error("concatVideos input: transition.name is string");
    }
    if (typeof duration !== "number") {
      throw new Error("concatVideos input: transition.duration is number");
    }

    return dto;
  };
}
