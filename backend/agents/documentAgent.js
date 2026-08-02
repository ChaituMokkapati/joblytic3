/**
 * Document Checklist Agent
 * Real PDF notification parse → extract required docs → compare with vault.
 */
import fs from 'fs';
import { STANDARD_DOCS } from '../data/commonDocs.js';

/** Normalize aliases used across SSC/IBPS/UPSC notifications */
const DOC_ALIASES = [
  {
    canonical: '10th Certificate',
    type: 'Education',
    patterns: [/10th/i, /matriculation/i, /ssc marks memo/i, /class\s*x\b/i, /secondary school/i, /high school certificate/i]
  },
  {
    canonical: '12th Certificate',
    type: 'Education',
    patterns: [/12th/i, /intermediate/i, /higher secondary/i, /class\s*xii/i, /senior secondary/i]
  },
  {
    canonical: 'Bachelor Degree Certificate',
    type: 'Education',
    patterns: [/bachelor/i, /graduation certificate/i, /degree certificate/i, /degree mark/i, /ug degree/i, /provisional certificate/i]
  },
  {
    canonical: 'Aadhaar Card',
    type: 'Identity',
    patterns: [/aadhaar/i, /aadhar/i]
  },
  {
    canonical: 'Passport Size Photo',
    type: 'Biometric',
    patterns: [/passport\s*size\s*photo/i, /photograph/i, /recent\s+photo/i, /colour\s+photo/i, /color\s+photo/i]
  },
  {
    canonical: 'Scanned Signature',
    type: 'Biometric',
    patterns: [/scanned\s+signature/i, /digital\s+signature/i, /\bsignature\b/i]
  },
  {
    canonical: 'Caste Certificate',
    type: 'Category',
    patterns: [/caste\s+certificate/i, /obc[- ]?ncl/i, /\bews\b/i, /sc\/st/i, /category certificate/i, /community certificate/i]
  },
  {
    canonical: 'Handwritten Declaration',
    type: 'Self Declaration',
    patterns: [/handwritten declaration/i, /self[- ]declaration/i]
  },
  {
    canonical: 'Photo ID Proof',
    type: 'Identity',
    patterns: [/photo id/i, /identity proof/i, /voter id/i, /driving licen[cs]e/i, /passport\b(?!\s*size)/i]
  },
  {
    canonical: 'PAN Card',
    type: 'Identity',
    patterns: [/\bpan\s*card\b/i, /\bpermanent account number\b/i]
  },
  {
    canonical: 'Domicile Certificate',
    type: 'Identity',
    patterns: [/domicile/i, /residence certificate/i, /nativity certificate/i]
  },
  {
    canonical: 'Disability Certificate',
    type: 'Category',
    patterns: [/disability certificate/i, /pwd certificate/i, /ph certificate/i]
  }
];

export function normalizeDocumentName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'Unknown Document';
  for (const alias of DOC_ALIASES) {
    if (alias.patterns.some((p) => p.test(raw))) return alias.canonical;
  }
  return raw.replace(/\s+/g, ' ');
}

export function dedupeDocuments(docs) {
  const seen = new Set();
  const out = [];
  for (const doc of docs) {
    const key = normalizeDocumentName(doc.name || doc.canonical || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...doc,
      name: normalizeDocumentName(doc.name || doc.canonical)
    });
  }
  return out;
}

function extractSizeKb(snippet) {
  const kb = snippet.match(/(\d{2,4})\s*(?:kb|k\.?b\.?)/i);
  if (kb) return Number(kb[1]);
  const mb = snippet.match(/(\d+(?:\.\d+)?)\s*(?:mb|m\.?b\.?)/i);
  if (mb) return Math.round(Number(mb[1]) * 1024);
  return null;
}

function extractFormats(snippet) {
  const formats = [];
  if (/\bpdf\b/i.test(snippet)) formats.push('PDF');
  if (/\bjpe?g\b/i.test(snippet)) formats.push('JPG');
  if (/\bpng\b/i.test(snippet)) formats.push('PNG');
  return formats.length ? [...new Set(formats)] : null;
}

function guessType(canonical) {
  const hit = DOC_ALIASES.find((a) => a.canonical === canonical);
  return hit?.type || 'Extracted';
}

/**
 * Rule-based extraction from notification PDF text.
 * Pulls document names + nearby size/format rules from "Documents Required" sections.
 */
export function extractDocumentsFromText(text) {
  const raw = String(text || '');
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const found = [];

  const sectionStart =
    /documents?\s+required|list of documents|upload the following|certificates?\s+required|documents?\s+to be uploaded|scanned copies of/i;
  const sectionEnd =
    /^(note|important|age limit|eligibility|scheme of examination|how to apply|general instructions|pay scale|syllabus)\b/i;

  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (sectionStart.test(line)) {
      inSection = true;
      sectionLines.push(line);
      continue;
    }
    if (inSection && sectionEnd.test(line)) {
      inSection = false;
      continue;
    }
    if (inSection) sectionLines.push(line);
  }

  const searchBlocks = sectionLines.length ? sectionLines : lines;

  for (let i = 0; i < searchBlocks.length; i++) {
    const line = searchBlocks[i];
    const nearby = [searchBlocks[i + 1], searchBlocks[i - 1]].filter(Boolean).join(' ');

    for (const alias of DOC_ALIASES) {
      if (!alias.patterns.some((p) => p.test(line))) continue;

      // Prefer size/format on the same line as the document mention
      const maxFromText = extractSizeKb(line) || extractSizeKb(nearby);
      const formats = extractFormats(line) || extractFormats(nearby);

      let maxSizeKB = maxFromText || 500;
      let minSizeKB = 20;
      let allowedFormat = formats || ['PDF', 'JPG'];
      if (alias.canonical === 'Passport Size Photo') {
        maxSizeKB = maxFromText || 50;
        minSizeKB = 20;
        allowedFormat = formats || ['JPG', 'JPEG'];
      }
      if (alias.canonical === 'Scanned Signature') {
        maxSizeKB = maxFromText || 20;
        minSizeKB = 10;
        allowedFormat = formats || ['JPG', 'JPEG'];
      }

      found.push({
        id: `ext-${alias.canonical.toLowerCase().replace(/\s+/g, '-')}`,
        name: alias.canonical,
        type: alias.type || 'Extracted',
        mandatory: !/optional|if applicable|wherever applicable/i.test(`${line} ${nearby}`),
        allowedFormat,
        maxSizeKB,
        minSizeKB,
        specificRule: line.slice(0, 180)
      });
    }
  }

  // Broader full-text scan if section scan found nothing
  if (!found.length) {
    for (const alias of DOC_ALIASES) {
      if (!alias.patterns.some((p) => p.test(raw))) continue;
      found.push({
        id: `ext-${alias.canonical.toLowerCase().replace(/\s+/g, '-')}`,
        name: alias.canonical,
        type: alias.type || 'Extracted',
        mandatory: true,
        allowedFormat: ['PDF', 'JPG'],
        maxSizeKB: alias.canonical.includes('Photo') ? 50 : alias.canonical.includes('Signature') ? 20 : 500,
        minSizeKB: 10,
        specificRule: 'Matched in notification text via Document Checklist Agent'
      });
    }
  }

  return dedupeDocuments(found);
}

async function extractWithOpenAI(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract required application documents from an Indian government job notification. Return JSON: { "documents": [ { "name": string, "mandatory": boolean, "allowedFormat": string[], "maxSizeKB": number|null, "minSizeKB": number|null, "specificRule": string } ] }. Normalize names (e.g. 10th Certificate, Aadhaar Card).'
        },
        {
          role: 'user',
          content: text.slice(0, 14000)
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    const docs = (parsed.documents || []).map((d, i) => ({
      id: `ai-doc-${i}`,
      name: normalizeDocumentName(d.name),
      type: guessType(normalizeDocumentName(d.name)),
      mandatory: d.mandatory !== false,
      allowedFormat: d.allowedFormat || ['PDF', 'JPG'],
      maxSizeKB: d.maxSizeKB || 500,
      minSizeKB: d.minSizeKB || 20,
      specificRule: d.specificRule || ''
    }));
    return dedupeDocuments(docs);
  } catch (err) {
    console.warn('[documentAgent] OpenAI extract failed:', err.message);
    return null;
  }
}

/**
 * pdf-parse v2+ uses PDFParse class (no default export).
 */
export async function parsePdfBuffer(buffer) {
  const mod = await import('pdf-parse');
  const PDFParse = mod.PDFParse || mod.default;
  if (!PDFParse) throw new Error('pdf-parse PDFParse class not available');

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return {
    text: result?.text || '',
    pages: result?.total || result?.pages?.length || 0,
    chars: (result?.text || '').length
  };
}

export async function parsePdfFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return parsePdfBuffer(buffer);
}

export async function fetchPdfFromUrl(url, timeoutMs = 20000) {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Valid http(s) PDF URL required');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 JoblyticDocAgent/1.0',
        Accept: 'application/pdf,*/*'
      }
    });
    if (!res.ok) throw new Error(`PDF download HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error('Downloaded file too small to be a PDF');
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

function matchVaultDoc(requirement, vaultDocs) {
  const reqName = normalizeDocumentName(requirement.name).toLowerCase();
  const reqId = String(requirement.id || '').replace(/^doc-/, '').toLowerCase();

  const idAliases = {
    '10th': ['10th', 'matriculation'],
    degree: ['degree', 'bachelor'],
    photo: ['photo'],
    sig: ['sig', 'signature'],
    caste: ['caste', 'obc', 'ews'],
    aadhaar: ['aadhaar', 'aadhar', 'id'],
    handwritten: ['handwritten', 'declaration']
  };

  return (vaultDocs || []).find((doc) => {
    const n = normalizeDocumentName(doc.name || '').toLowerCase();
    const t = String(doc.type || '').toLowerCase();
    const did = String(doc.id || '').replace(/^vault-/, '').toLowerCase();

    if (n === reqName) return true;
    if (reqId && did && (reqId === did || (idAliases[reqId] || []).some((a) => did.includes(a)))) return true;
    if (reqName.includes('aadhaar') && (n.includes('aadhaar') || n.includes('aadhar') || did === 'id')) return true;
    if (reqName.includes('caste') && (n.includes('obc') || n.includes('caste') || did === 'obc')) return true;
    if (reqName.includes('photo') && (n.includes('photo') || did === 'photo')) return true;
    if (reqName.includes('signature') && (n.includes('signature') || n.includes('sig') || did === 'sig')) return true;
    if (reqName.includes('10th') && (n.includes('10th') || n.includes('matriculation') || did === '10th')) return true;
    if (reqName.includes('bachelor') && (n.includes('degree') || n.includes('bachelor') || did === 'degree')) return true;
    if (requirement.type && t === String(requirement.type).toLowerCase() && n.includes(reqName.split(' ')[0])) return true;
    return false;
  });
}

/**
 * Compare required docs with user vault → checklist statuses.
 */
export function buildChecklist(requiredDocuments, vaultDocuments = []) {
  const required = dedupeDocuments(requiredDocuments || []);
  return required.map((req) => {
    const matchedDoc = matchVaultDoc(req, vaultDocuments);

    if (!matchedDoc) {
      return {
        requirement: req,
        matchedDoc: null,
        status: 'MISSING',
        label: '[X] MISSING',
        reason: 'Document not found in candidate vault.'
      };
    }

    const issueDate = matchedDoc.issueDate || '';
    if (
      (req.type === 'Category' || /caste|obc|ews/i.test(req.name)) &&
      issueDate &&
      issueDate < '2025-04-01'
    ) {
      return {
        requirement: req,
        matchedDoc,
        status: 'EXPIRED_RULE',
        label: '[X] EXPIRED / INVALID',
        reason: `Certificate issued ${issueDate}. Notification requires issue date on/after 2025-04-01.`
      };
    }

    const sizeKB = Number(matchedDoc.fileSizeKB ?? matchedDoc.sizeKB ?? 0);
    const format = String(matchedDoc.fileFormat || matchedDoc.format || '').toUpperCase();
    const allowed = (req.allowedFormat || ['PDF', 'JPG']).map((f) => f.toUpperCase());
    const maxSize = req.maxSizeKB ?? 500;
    const minSize = req.minSizeKB ?? 0;

    const isSizeOk = !sizeKB || (sizeKB <= maxSize && sizeKB >= minSize);
    const isFormatOk = !format || allowed.includes(format) || (format === 'JPEG' && allowed.includes('JPG'));

    if (!isSizeOk || !isFormatOk) {
      return {
        requirement: req,
        matchedDoc,
        status: 'FORMAT_SIZE_FIX_NEEDED',
        label: '[!] FORMAT / SIZE FIX',
        reason: !isSizeOk
          ? `File size (${sizeKB} KB) outside ${minSize}-${maxSize} KB.`
          : `Format (${format}) not in allowed ${allowed.join('/')}.`
      };
    }

    return {
      requirement: req,
      matchedDoc,
      status: 'DONE',
      label: '[✓] DONE',
      reason: 'Matches notification guidelines.'
    };
  });
}

/**
 * Full agent run — prefers real PDF extraction over job template docs.
 */
export async function runDocumentChecklistAgent({
  pdfPath,
  pdfBuffer,
  pdfUrl,
  pdfText,
  jobRequiredDocuments,
  vaultDocuments,
  preferPdf = true
}) {
  let text = pdfText || '';
  let pdfMeta = null;
  let extractMethod = 'job_embedded';
  let required = jobRequiredDocuments?.length ? [...jobRequiredDocuments] : [];
  const errors = [];

  let buffer = pdfBuffer || null;

  if (!buffer && pdfPath) {
    try {
      buffer = fs.readFileSync(pdfPath);
    } catch (err) {
      errors.push(`pdf_read: ${err.message}`);
    }
  }

  if (!buffer && pdfUrl) {
    try {
      buffer = await fetchPdfFromUrl(pdfUrl);
    } catch (err) {
      errors.push(`pdf_url: ${err.message}`);
    }
  }

  if (buffer) {
    try {
      pdfMeta = await parsePdfBuffer(buffer);
      text = pdfMeta.text || '';
      extractMethod = 'pdf_parse';
    } catch (err) {
      errors.push(`pdf_parse: ${err.message}`);
      console.warn('[documentAgent] PDF parse failed:', err.message);
    }
  }

  if (text) {
    const aiDocs = await extractWithOpenAI(text);
    if (aiDocs?.length) {
      required = aiDocs;
      extractMethod = process.env.OPENAI_API_KEY ? 'openai+pdf' : extractMethod;
    } else {
      const ruleDocs = extractDocumentsFromText(text);
      if (ruleDocs.length) {
        required = ruleDocs;
        extractMethod = extractMethod === 'pdf_parse' ? 'pdf_parse+rules' : 'rules';
      } else if (!preferPdf && jobRequiredDocuments?.length) {
        required = [...jobRequiredDocuments];
        extractMethod = 'job_embedded';
      }
    }
  }

  // If PDF parse failed/empty and job had templates, keep templates
  if (!required.length && jobRequiredDocuments?.length) {
    required = [...jobRequiredDocuments];
    extractMethod = 'job_embedded';
  }

  if (!required.length) {
    required = STANDARD_DOCS;
    extractMethod = 'fallback_standard';
  }

  required = dedupeDocuments(required);
  const checklist = buildChecklist(required, vaultDocuments);

  const doneCount = checklist.filter((c) => c.status === 'DONE').length;
  const missingCount = checklist.filter((c) => c.status === 'MISSING' || c.status === 'EXPIRED_RULE').length;
  const fixCount = checklist.filter((c) => c.status === 'FORMAT_SIZE_FIX_NEEDED').length;

  return {
    extractMethod,
    openaiUsed: Boolean(process.env.OPENAI_API_KEY) && String(extractMethod).includes('openai'),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    pdfMeta: pdfMeta
      ? { pages: pdfMeta.pages, chars: pdfMeta.chars, preview: (pdfMeta.text || '').slice(0, 280) }
      : null,
    errors,
    requiredDocuments: required,
    checklist,
    summary: {
      total: checklist.length,
      done: doneCount,
      missing: missingCount,
      formatFix: fixCount
    },
    displayLines: checklist.map((c) => {
      const name = c.requirement?.name || 'Document';
      if (c.status === 'DONE') return `[✓] ${name} – Ready`;
      if (c.status === 'FORMAT_SIZE_FIX_NEEDED') return `[!] ${name} – Incorrect Format/Size`;
      if (c.status === 'EXPIRED_RULE') return `[X] ${name} – Expired / Invalid`;
      return `[X] ${name} – Missing`;
    })
  };
}
