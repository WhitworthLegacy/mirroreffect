import blog from "./blog";
import blog10Idees from "./blog-10-idees-photobooth-chic";
import blog5Idees from "./blog-5-idees-mariage";
import blogAnniversaire from "./blog-anniversaire";
import blogAvantApres from "./blog-avant-apres-cadre";
import blogBapteme from "./blog-bapteme";
import blogImpressions from "./blog-impressions";
import blogRgpd from "./blog-rgpd";
import blogPhotoboothMiroirMariageBruxellesAnimationPhotoHautDeGamme from "./blog-photobooth-miroir-mariage-bruxelles-animation-photo-haut-de-gamme";
import blogBorneSelfieEvenementCorporateBelgique from "./blog-borne-selfie-evenement-corporate-belgique";
import nlBlogSelfieZuilCorporateEvenementPremiumFotoAnimatieBelgie from "./nl-blog-selfie-zuil-corporate-evenement-premium-foto-animatie-belgie";
import etudeBirmingham from "./etude-de-cas-birmingham";
import etudeHilton from "./etude-de-cas-hilton";
import merciForm from "./merci-form";
import merciPaiement from "./merci-pour-votre-paiement";
import nlBedanktForm from "./nl-bedankt-form";
import nlBlog10Idees from "./nl-blog-10-idees";
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
import photoboothMiroirEntrepriseBruxelles from "./photobooth-miroir-entreprise-bruxelles";
import spiegelPhotoboothVlaamsBrabant from "./spiegel-photobooth-vlaams-brabant";
import spiegelPhotoboothVlaanderen from "./spiegel-photobooth-vlaanderen";
import spiegelFotoboothBedrijfBrussel from "./spiegel-fotobooth-bedrijf-brussel";
import mentionsLegales from "./mentions-legales";
import politiqueConfidentialite from "./politique-de-confidentialite";

export type SeoPage = {
  slug: string;
  seo: {
    title: string;
    description: string;
  };
  h1: string;
  sections?: ReadonlyArray<{ heading: string; html: string }>;
  faqs?: ReadonlyArray<{ question: string; answer: string }>;
  layout?: "default" | "raw";
  rawHtml?: string;
  leadMode?: "b2c" | "b2b";
  robots?: {
    index?: boolean;
    follow?: boolean;
  };
};

export const seoPages: SeoPage[] = [
  nlBlogSelfieZuilCorporateEvenementPremiumFotoAnimatieBelgie,
  blogBorneSelfieEvenementCorporateBelgique,
  blogPhotoboothMiroirMariageBruxellesAnimationPhotoHautDeGamme,
  blog,
  blog10Idees,
  blog5Idees,
  blogAnniversaire,
  blogAvantApres,
  blogBapteme,
  blogImpressions,
  blogRgpd,
  etudeBirmingham,
  etudeHilton,
  merciForm,
  merciPaiement,
  nlBedanktForm,
  nlBlog10Idees,
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
  photoboothMiroirEntrepriseBruxelles,
  spiegelPhotoboothVlaamsBrabant,
  spiegelPhotoboothVlaanderen,
  spiegelFotoboothBedrijfBrussel,
  mentionsLegales,
  politiqueConfidentialite
];

export const normalizeSlug = (slug: string) => slug.replace(/^\/+|\/+$/g, "");

export const getSeoPage = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return seoPages.find((page) => normalizeSlug(page.slug) === normalized) ?? null;
};
