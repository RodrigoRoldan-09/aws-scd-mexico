declare module "gifenc" {
  export function quantize(
    data: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: string; oneBitAlpha?: boolean }
  ): [number, number, number][];

  export function applyPalette(
    data: Uint8Array | Uint8ClampedArray,
    palette: [number, number, number][]
  ): Uint8Array;

  export interface WriteFrameOptions {
    palette?: [number, number, number][];
    delay?: number;
    repeat?: number;
    transparent?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GIFEncoderInstance;
}
