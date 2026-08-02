import fs from 'fs';
import path from 'path';
import {
  extractDocumentsFromText,
  parsePdfBuffer,
  runDocumentChecklistAgent
} from '../agents/documentAgent.js';

const sampleText = `
SSC CGL Notification 2026
Documents Required
1. Matriculation / 10th Certificate clearly showing Date of Birth (PDF/JPG, max 500 KB)
2. Bachelor Degree Certificate / Marksheet (PDF, 100-1000 KB)
3. Recent Passport Size Photograph (JPG, 20-50 KB)
4. Scanned Signature (JPG, 10-20 KB)
5. Aadhaar Card as Photo ID Proof
6. OBC-NCL / EWS / SC / ST Category Certificate (if applicable)
Age Limit
`;

const docs = extractDocumentsFromText(sampleText);
console.log('rules_count', docs.length);
console.log(
  docs.map((d) => `${d.name}|${d.maxSizeKB}|${(d.allowedFormat || []).join('/')}`).join('\n')
);

function escapePdf(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const lines = sampleText
  .trim()
  .split(/\n/)
  .map((l) => l.trim())
  .filter(Boolean);
const contentLines = ['BT', '/F1 10 Tf', '50 770 Td', '14 TL'];
for (const line of lines) {
  contentLines.push(`(${escapePdf(line)}) Tj`, 'T*');
}
contentLines.push('ET');
const stream = contentLines.join('\n');
const objects = [
  '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
  '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
  '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj',
  `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj`,
  '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj'
];

let pdf = '%PDF-1.4\n';
const offsets = [0];
for (const obj of objects) {
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += `${obj}\n`;
}
const xrefPos = Buffer.byteLength(pdf, 'utf8');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

const buf = Buffer.from(pdf, 'utf8');
const out = path.join('uploads', 'sample-notification.pdf');
fs.mkdirSync('uploads', { recursive: true });
fs.writeFileSync(out, buf);

const parsed = await parsePdfBuffer(buf);
console.log('pdf_chars', parsed.chars, 'pages', parsed.pages);
console.log('pdf_has_docs_section', /Documents Required/i.test(parsed.text));

const result = await runDocumentChecklistAgent({
  pdfBuffer: buf,
  vaultDocuments: [],
  jobRequiredDocuments: [],
  preferPdf: true
});
console.log('method', result.extractMethod);
console.log('extracted', result.requiredDocuments.map((d) => d.name).join(', '));
console.log('count', result.requiredDocuments.length);
