import { ConcatController } from "./core/concat.controller";
import { ConcatService } from "./core/concat.service";

export class FfmpegFastConcat {
  concat: ConcatController;
  constructor({
    tempDir,
    concurrency,
  }: {
    tempDir: string;
    concurrency?: number;
  }) {
    const concatService = new ConcatService(tempDir, concurrency);
    const concatController = new ConcatController(concatService);

    this.concat = concatController;
  }
}
