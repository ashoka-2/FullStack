import { useEffect } from 'react';

const APP_NAME = 'Parsu AI';
const BASE_URL = 'https://parsuai.vercel.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION = 'Parsu AI is a chat workspace for live web research, writing, and publishing to your social accounts, powered by Gemini, Claude, GPT-4 and DeepSeek.';

const setMeta = (key, value, content) => {
  let el = document.head.querySelector(`meta[${key}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/** Per-page SEO: title, description, canonical, robots, Open Graph, Twitter card. */
const useSEO = ({ title, description = DEFAULT_DESCRIPTION, ogImage = DEFAULT_OG_IMAGE, noIndex = false, canonical } = {}) => {
  useEffect(() => {
    const fullTitle = !title ? `${APP_NAME} | AI Research, Writing & Social Publishing` : title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`;
    const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large');

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', APP_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
  }, [title, description, ogImage, noIndex, canonical]);
};

export default useSEO;