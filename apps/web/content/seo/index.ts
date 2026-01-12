import blog from "./blog";
import nlBlog from "./nl__blog";
import nl from "./nl";
import photoboothEntreprise from "./photobooth-entreprise";
import photoboothMariage from "./photobooth-mariage";
import photoboothMiroirBrabantWallon from "./photobooth-miroir-brabant-wallon";
import photoboothMiroirBruxelles from "./photobooth-miroir-bruxelles";
import photoboothMiroirCharleroi from "./photobooth-miroir-charleroi";
import photoboothMiroirLiege from "./photobooth-miroir-liege";
import photoboothMiroirNamur from "./photobooth-miroir-namur";
import photoboothMiroirWallonie from "./photobooth-miroir-wallonie";
import spiegelPhotoboothVlaamsBrabant from "./spiegel-photobooth-vlaams-brabant";
import spiegelPhotoboothVlaanderen from "./spiegel-photobooth-vlaanderen";

export type SeoPage = {
  slug: string;
  seo: {
    title: string;
    description: string;
  };
  h1: string;
  sections: ReadonlyArray<{ heading: string; html: string }>;
  faqs: ReadonlyArray<{ question: string; answer: string }>;
};

export const seoPages: SeoPage[] = [
  blog,
  nlBlog,
  nl,
  photoboothEntreprise,
  photoboothMariage,
  photoboothMiroirBrabantWallon,
  photoboothMiroirBruxelles,
  photoboothMiroirCharleroi,
  photoboothMiroirLiege,
  photoboothMiroirNamur,
  photoboothMiroirWallonie,
  spiegelPhotoboothVlaamsBrabant,
  spiegelPhotoboothVlaanderen
];

export const normalizeSlug = (slug: string) => slug.replace(/^\/+|\/+$/g, "");

export const getSeoPage = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return seoPages.find((page) => normalizeSlug(page.slug) === normalized) ?? null;
};
