export type WritingStyle = 
  | 'ZIGLAR_2026' 
  | 'HORMOZI' 
  | 'HYBRID_ZIG_HORMOZI' 
  | 'THINK_TANK_SEO';

export type ContentFormat = 
  | 'ALL_PLATFORMS'
  | 'ARTICLE'
  | 'SEO_TAGS'
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'TIKTOK_REEL'
  | 'TWITTER_THREAD'
  | 'EBOOK' 
  | 'SLIDESHOW' 
  | 'SCRIPT' 
  | 'TEXT_EDITOR';

export interface SEOTags {
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  targetAudience: string;
  jsonLdSchema: string;
}

export interface TikTokReelScript {
  hook: string;
  onScreenText: string;
  visualDirection: string;
  voiceoverScript: string;
  callToAction: string;
  pinnedComment: string;
  fullScript?: string;
}

export interface PlatformOutputs {
  blogArticle: {
    title: string;
    content: string;
  };
  seoTags: SEOTags;
  linkedinPost: string;
  facebookPost: string;
  tiktokReel: TikTokReelScript;
  twitterThread: string[];
}

export interface ArticleRequest {
  keyword: string;
  style?: WritingStyle;
  format?: ContentFormat;
}

export interface GeneratedArticle {
  title: string;
  content: string; // Markdown content
  metaDescription: string;
  keyword: string;
  format?: ContentFormat;
  style: WritingStyle;
  platformOutputs?: PlatformOutputs;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface LinkConfig {
  text: string;
  url: string;
  description: string;
}