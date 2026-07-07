// offers.mjs の型宣言(.mjs は astro.config.mjs と .astro の両方から import される
// ため JS のままにしており、型は本ファイルで supply する)。
export type Offer = {
  id: string;
  name: string;
  cta: string;
  note: string;
  url: string;
  article: string;
  tags: string[];
};
export declare const OFFERS: Offer[];
export declare function getOffer(id: string): Offer | undefined;
export declare function offerUrl(offer: Offer): string;
export declare function isOfferActive(offer: Offer): boolean;
