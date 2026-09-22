import { useEffect } from 'react';

/**
 * useSEO — Dynamic per-page SEO meta tag hook
 *
 * Usage:
 *   useSEO({
 *     title: 'Page Title',
 *     description: 'Page description for search engines',
 *     ogImage: 'https://perplexity.app/og-image.png', // optional
 *     noIndex: false, // set true for private/auth pages
 *   });
 */
const APP_NAME = 'Perplexity';
const BASE_URL = 'https://perplexity-cohort.vercel.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION = 'AI-powered assistant for instant answers, deep research, creative writing, code generation, and social media publishing.';

const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        const [, attrName, attrValue] = selector.match(/\[([^=]+)="([^"]+)"\]/);
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
};

const useSEO = ({
    title,
    description = DEFAULT_DESCRIPTION,
    ogImage = DEFAULT_OG_IMAGE,
    noIndex = false,
    canonical,
} = {}) => {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — AI-Powered Answers, Research & Creativity`;
        const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

        // Document title
        document.title = fullTitle;

        // Primary meta
        setMeta('[name="description"]', 'content', description);
        setMeta('[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large');

        // Canonical
        let canonicalEl = document.querySelector('link[rel="canonical"]');
        if (!canonicalEl) {
            canonicalEl = document.createElement('link');
            canonicalEl.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalEl);
        }
        canonicalEl.setAttribute('href', canonicalUrl);

        // Open Graph
        setMeta('[property="og:title"]', 'content', fullTitle);
        setMeta('[property="og:description"]', 'content', description);
        setMeta('[property="og:url"]', 'content', canonicalUrl);
        setMeta('[property="og:image"]', 'content', ogImage);

        // Twitter
        setMeta('[name="twitter:title"]', 'content', fullTitle);
        setMeta('[name="twitter:description"]', 'content', description);
        setMeta('[name="twitter:image"]', 'content', ogImage);
    }, [title, description, ogImage, noIndex, canonical]);
};

export default useSEO;
