# Ffmpeg Fast Concat
You can concat videos by ffmpeg 
## Install
```
npm i ffmpeg-fast-concat
```
## Usage
```ts
const ffmpegFastConcat = new FfmpegFastConcat({
      tempDir: 'tempDir',
});

const concatVideosDto: ConcatVideosDto = {
    inputVideoPaths: ['input_1.mp4','input_2.mp4'],
    outputVideoPath: 'output.mp4',
    transition: {
      duration: 500,
      name: "fade",
    },
  };

const outputFilePath = await ffmpegFastConcat.concat.videos(concatVideosDto);
    
```
## API
### Constructor
#### constructor input
##### `tempDir`
- Type: `string`
- Required: true

tempDir is `absolute path`
##### `concurrency`
- Type: `number`
- Required: false
- Default: 4
### concat
#### videos(input)
##### input
```ts
interface Transition {
  name: string;
  duration: number;
}

type ConcatVideosDto = {
  inputVideoPaths: string[];
  outputVideoPath: string;
  transition: Transition;
};

```
###### `inputVideoPaths`
- Type: `Array<string>`
- Required: true
###### `outputVideoPath`
- Type: `string`
- Required: true
###### `transition`
###### `transition.name`
- Type: `string`
- Required: true

[FFmpeg xfade](https://trac.ffmpeg.org/wiki/Xfade)
###### `transition.duration`
- Type: `number`
- Required: true
##### return
output file path

## Related
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)


