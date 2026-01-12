
import DOMPurify from 'isomorphic-dompurify';

export const cleanHtml = (dirty: string): string => {
    if (!dirty) return "";

    // Use default DOMPurify schema (allows safe tags like b, i, p, br, etc.)
    // We explicitly FORBID style/script to prevent layout breakage (like global body backgrounds) in previews
    const clean = DOMPurify.sanitize(dirty, {
        FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'object', 'embed', 'link', 'head', 'meta'],
        FORBID_ATTR: ['style'],
    });

    return clean.trim();
};
