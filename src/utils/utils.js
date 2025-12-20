// Exported utility to extract links/DOIs/Reference lines from a string
export function extractSourcesFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const sources = new Set();

  // 1) Look for explicit "Reference:" or "References:" lines (single or list)
  const refRegex = /Reference[s]?:\s*(.+)/gi;
  let m;
  while ((m = refRegex.exec(text))) {
    const maybe = m[1].trim();
    maybe.split(/[,;]\s*/).forEach(s => {
      if (s) sources.add(s.trim());
    });
  }

  // 2) URL regex - catch http(s) links
  const urlRegex = /https?:\/\/[^\s)]+/gi;
  while ((m = urlRegex.exec(text))) {
    sources.add(m[0].replace(/[.,)]+$/, '')); // remove trailing punctuation
  }

  // 3) DOI pattern (doi:10.1234/abcd... or 10.xxxx/xxxxx)
  const doiRegex = /\b(?:doi:\s*)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/ig;
  while ((m = doiRegex.exec(text))) {
    sources.add((m[1].startsWith('10.') ? 'https://doi.org/' + m[1] : m[1]).trim());
  }

  // 4) Markdown-style links [text](url)
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
  while ((m = mdLinkRegex.exec(text))) {
    sources.add(m[2].replace(/[.,)]+$/, ''));
  }

  return Array.from(sources);
}