import dotenv from "dotenv";
dotenv.config();
import { ConcatController } from "../../core/concat.controller";
import { ConcatService, ConcatVideosDto } from "../../core/concat.service";

describe("concat controller", () => {
  let concatController: ConcatController;

  beforeAll(() => {
    const concatService = new ConcatService(process.env.TEMP_DIR_ROOT!);

    concatController = new ConcatController(concatService);
  });

  describe("validate concat videos dto", () => {
    test.each<{
      message: string;
      throwError: boolean;
      dto: Partial<{ [key in keyof ConcatVideosDto]: any }>;
    }>([
      {
        message: "valid",
        throwError: false,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid inputVideoPaths",
        throwError: true,
        dto: {
          // inputVideoPaths: ["test"],
          outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid inputVideoPaths",
        throwError: true,
        dto: {
          inputVideoPaths: 1234,
          outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid inputVideoPaths",
        throwError: true,
        dto: {
          inputVideoPaths: ["1234"],
          outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid outputVideoPath",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          // outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid outputVideoPath",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: 1231,
          transition: {
            name: "fade",
            duration: 500,
          },
        },
      },
      {
        message: "invalid transition",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: "test",
          // transition: {
          //   name: "fade",
          //   duration: 500,
          // },
        },
      },
      {
        message: "invalid transition",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: "test",
          transition: {
            // name: 123,
            duration: 500,
          },
        },
      },
      {
        message: "invalid transition",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: "test",
          transition: {
            name: 123,
            duration: 500,
          },
        },
      },
      {
        message: "invalid transition",
        throwError: true,
        dto: {
          inputVideoPaths: ["1", "2"],
          outputVideoPath: "test",
          transition: {
            name: "fade",
            duration: "500",
          },
        },
      },
    ])("$message", async ({ dto, throwError }) => {
      let occurError = false;
      try {
        const result = concatController["validateConcatVideosDto"](dto as any);
      } catch (error: any) {
        console.log(error.message);
        occurError = true;
      }
      if (throwError) {
        expect(occurError).toEqual(true);
      } else {
        expect(occurError).toEqual(false);
      }
    });
  });
});
