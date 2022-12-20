//test.d.ts
import './G_Function.js';

// G_Function.js 파일에 대한 typescript 적용
export function analyzeVideoTranscript(
  filename: string,
  video: Buffer,
  nameWords: string[],
  keywords: string[],
): Promise<string>;
