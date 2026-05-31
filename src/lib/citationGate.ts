export interface Citation {
  id: string;
  raw: string;
  authors: string[];
  year: string;
  page: string | null;
  paragraph: string;
  hasReference: boolean;
}

export interface Reference {
  id: string;
  raw: string;
  authors: string[];
  year: string;
  paragraph: string;
}

export interface CitationAudit {
  citations: Citation[];
  references: Reference[];
  orphanCitations: Citation[];
  uncitedReferences: Reference[];
  pageMissingQuotes: Citation[];
  referenceSectionPresent: boolean;
  missingReferenceSection: boolean;
}

interface ParsedParagraph {
  id: string;
  text: string;
}

interface ParsedCitation {
  raw: string;
  authors: string[];
  year: string;
  page: string | null;
  paragraph: string;
  start: number;
}

const YEAR_PATTERN = '(?:19|20)\\d{2}[a-z]?';
const PAGE_PATTERN = 'p{1,2}\\.\\s*\\d+(?:[-–]\\d+)?|para\\.\\s*\\d+';
const PARENTHETICAL_CANDIDATE = /\(([^()]+)\)/g;
const NARRATIVE_CITATION = new RegExp(
  `\\b([A-Z][A-Za-z'’-]+(?:\\s+et\\s+al\\.|\\s+(?:&|and)\\s+[A-Z][A-Za-z'’-]+)?)\\s+\\((${YEAR_PATTERN})(?:,\\s*(${PAGE_PATTERN}))?\\)`,
  'g'
);
const PARENTHETICAL_CITATION = new RegExp(`^(.+?),\\s*(${YEAR_PATTERN})(?:,\\s*(${PAGE_PATTERN}))?$`);
const AUTHOR_LIST = /^[A-Z][A-Za-z'’-]+(?:\s+et\s+al\.)?(?:\s*(?:&|and)\s*[A-Z][A-Za-z'’-]+(?:\s+et\s+al\.)?)*$/;
const REFERENCE_YEAR = new RegExp(`\\((${YEAR_PATTERN})\\)`);

export function extractCitations(text: string): Citation[] {
  const body = splitReferenceSection(text).body;
  return parseParagraphs(body).flatMap((paragraph) => {
    const parsed = [
      ...extractParentheticalCitations(paragraph),
      ...extractNarrativeCitations(paragraph)
    ].sort((a, b) => a.start - b.start);

    return parsed.map((citation, index) => ({
      id: `citation-${paragraph.id}-${index + 1}`,
      raw: citation.raw,
      authors: citation.authors,
      year: citation.year,
      page: citation.page,
      paragraph: citation.paragraph,
      hasReference: false
    }));
  });
}

export function extractReferences(text: string): Reference[] {
  const candidates = collectReferenceCandidates(text);

  return candidates.flatMap((candidate, index) => {
    const reference = parseReference(candidate.raw, candidate.paragraph);
    if (!reference) {
      return [];
    }

    return [{ ...reference, id: `reference-${index + 1}` }];
  });
}

export function auditCitations(text: string): CitationAudit {
  const referenceSectionPresent = hasReferenceSection(text);
  const references = extractReferences(text);
  const referenceKeys = new Set(references.map(referenceKey));
  const citations = extractCitations(text).map((citation) => ({
    ...citation,
    hasReference: referenceSectionPresent && referenceKeys.has(citationKey(citation))
  }));
  const citedKeys = new Set(citations.map(citationKey));

  return {
    citations,
    references,
    orphanCitations: referenceSectionPresent ? citations.filter((citation) => !citation.hasReference) : [],
    uncitedReferences: referenceSectionPresent
      ? references.filter((reference) => !citedKeys.has(referenceKey(reference)))
      : [],
    pageMissingQuotes: citations.filter((citation) => !citation.page && citationHasDirectQuote(text, citation)),
    referenceSectionPresent,
    missingReferenceSection: !referenceSectionPresent
  };
}

function extractParentheticalCitations(paragraph: ParsedParagraph): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  for (const match of paragraph.text.matchAll(PARENTHETICAL_CANDIDATE)) {
    const raw = match[0];
    const content = match[1];
    const start = match.index ?? 0;
    const parts = content.split(';').map((part) => part.trim()).filter(Boolean);
    const parsedParts = parts.map(parseParentheticalPart);

    if (parsedParts.some((part) => !part)) {
      continue;
    }

    parsedParts.forEach((part) => {
      if (!part) return;
      citations.push({
        raw: parts.length === 1 ? raw : `(${part.raw})`,
        authors: part.authors,
        year: part.year,
        page: part.page,
        paragraph: paragraph.id,
        start
      });
    });
  }

  return citations;
}

function extractNarrativeCitations(paragraph: ParsedParagraph): ParsedCitation[] {
  return Array.from(paragraph.text.matchAll(NARRATIVE_CITATION)).map((match) => ({
    raw: match[0],
    authors: parseAuthors(match[1]),
    year: match[2],
    page: match[3] ?? null,
    paragraph: paragraph.id,
    start: match.index ?? 0
  }));
}

function parseParentheticalPart(part: string): Omit<ParsedCitation, 'paragraph' | 'start'> | null {
  const match = part.match(PARENTHETICAL_CITATION);
  if (!match) {
    return null;
  }

  const authorPart = match[1].trim();
  if (!AUTHOR_LIST.test(authorPart)) {
    return null;
  }

  return {
    raw: part,
    authors: parseAuthors(authorPart),
    year: match[2],
    page: match[3] ?? null
  };
}

function collectReferenceCandidates(text: string): Array<{ raw: string; paragraph: string }> {
  const paragraphs = parseParagraphs(text);
  const candidates: Array<{ raw: string; paragraph: string }> = [];
  let inReferences = false;
  let current: { raw: string; paragraph: string } | null = null;

  const flush = () => {
    if (current) {
      candidates.push({ raw: current.raw.trim(), paragraph: current.paragraph });
      current = null;
    }
  };

  for (const paragraph of paragraphs) {
    const lines = paragraph.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const headerIndex = lines.findIndex(isReferenceHeader);
    const referenceLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : inReferences ? lines : [];

    if (headerIndex >= 0) {
      inReferences = true;
      flush();
    }

    for (const line of referenceLines) {
      if (looksLikeReferenceStart(line)) {
        flush();
        current = { raw: line, paragraph: paragraph.id };
      } else if (current) {
        current.raw = `${current.raw} ${line}`;
      }
    }
  }

  flush();
  return candidates;
}

function parseReference(raw: string, paragraph: string): Omit<Reference, 'id'> | null {
  const yearMatch = raw.match(REFERENCE_YEAR);
  if (!yearMatch || yearMatch.index === undefined) {
    return null;
  }

  const authorSection = raw.slice(0, yearMatch.index).trim();
  const authors = parseReferenceAuthors(authorSection);
  if (authors.length === 0) {
    return null;
  }

  return {
    raw,
    authors,
    year: yearMatch[1],
    paragraph
  };
}

function looksLikeReferenceStart(line: string): boolean {
  return /^[A-Z][A-Za-z'’-]+/.test(line) && REFERENCE_YEAR.test(line);
}

function isReferenceHeader(line: string): boolean {
  return /^(references|bibliography|참고문헌)\s*:?\s*$/i.test(line.trim());
}

function hasReferenceSection(text: string): boolean {
  return text.split(/\r?\n/).some(isReferenceHeader);
}

function splitReferenceSection(text: string): { body: string; referenceSectionPresent: boolean } {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(isReferenceHeader);
  if (headerIndex < 0) {
    return { body: text, referenceSectionPresent: false };
  }

  return {
    body: lines.slice(0, headerIndex).join('\n').trim(),
    referenceSectionPresent: true
  };
}

function parseParagraphs(text: string): ParsedParagraph[] {
  const parts = text
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [{ id: 'p1', text: '' }];
  }

  return parts.map((text, index) => ({
    id: `p${index + 1}`,
    text
  }));
}

function parseAuthors(authorPart: string): string[] {
  return authorPart
    .replace(/\s+and\s+/gi, ' & ')
    .split(/\s*&\s*/)
    .map((author) => author.trim())
    .filter(Boolean);
}

function parseReferenceAuthors(authorSection: string): string[] {
  const first = authorSection.match(/^([A-Z][A-Za-z'’-]+)/)?.[1];
  if (!first) {
    return [];
  }

  const rest = Array.from(authorSection.matchAll(/(?:&|and)\s+([A-Z][A-Za-z'’-]+)/g)).map((match) => match[1]);
  return Array.from(new Set([first, ...rest]));
}

function citationKey(citation: Pick<Citation, 'authors' | 'year'>): string {
  return `${normalizeLeadAuthor(citation.authors[0] ?? '')}:${citation.year.toLowerCase()}`;
}

function referenceKey(reference: Pick<Reference, 'authors' | 'year'>): string {
  return `${normalizeLeadAuthor(reference.authors[0] ?? '')}:${reference.year.toLowerCase()}`;
}

function normalizeLeadAuthor(author: string): string {
  return author
    .replace(/\bet\s+al\.$/i, '')
    .replace(/[^A-Za-z]/g, '')
    .toLowerCase();
}

function citationHasDirectQuote(text: string, citation: Citation): boolean {
  const body = splitReferenceSection(text).body;
  const paragraph = parseParagraphs(body).find((item) => item.id === citation.paragraph);
  if (!paragraph) {
    return false;
  }

  const sentence = findSentenceContaining(paragraph.text, citation.raw);
  return /"[^"]+"/.test(sentence) || /“[^”]+”/.test(sentence);
}

function findSentenceContaining(paragraph: string, raw: string): string {
  const index = paragraph.indexOf(raw);
  if (index < 0) {
    return paragraph;
  }

  const before = paragraph.slice(0, index);
  const starts = Array.from(before.matchAll(/[.!?](?:\s|$)/g));
  const lastStart = starts.at(-1);
  const sentenceStart = lastStart && lastStart.index !== undefined ? lastStart.index + lastStart[0].length : 0;
  const tail = paragraph.slice(index + raw.length);
  const end = tail.match(/[.!?](?:\s|$)/);
  const sentenceEnd = end && end.index !== undefined ? index + raw.length + end.index + 1 : paragraph.length;

  return paragraph.slice(sentenceStart, sentenceEnd).trim();
}
