export interface UpdateNewsSeoDTO {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface NewsSeoPacket {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  openGraph: {
    title: string;
    description: string;
    image: string | null;
    url: string;
    type: string;
    siteName: string;
  };
  twitterCard: {
    card: string;
    title: string;
    description: string;
    image: string | null;
  };
  structuredData: Record<string, any>; // Schema.org NewsArticle JSON-LD
}
