
export interface ArticleParagraph {
  text: string;
  imageUrl: string;
}

export interface ArticleTextResponse {
  paragraph: string;
}

export enum ImageSize {
  '1K' = '1K',
  '2K' = '2K',
  '4K' = '4K',
}

export interface ImageResult {
  url: string;
  prompt: string;
  size?: ImageSize;
}

export enum AppView {
  ARTICLES = 'articles',
  IMAGE_STUDIO = 'image-studio',
  QUICK_CHAT = 'quick-chat',
}
