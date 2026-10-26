export enum AppState {
  IDLE = 'IDLE',
  PREVIEW = 'PREVIEW',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FunStyle {
  id: string;
  name: string;
  emoji: string;
  prompt: string;
  color: string;
  description: string;
}

export interface GeneratedImage {
  original: string; // base64
  result: string; // base64
  styleName: string;
}