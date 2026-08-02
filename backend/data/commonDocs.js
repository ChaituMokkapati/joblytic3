/** Shared document requirement templates for government job notifications */

export const DOC_10TH = {
  id: 'doc-10th',
  name: '10th Certificate',
  type: 'Education',
  mandatory: true,
  allowedFormat: ['PDF', 'JPG'],
  maxSizeKB: 500,
  minSizeKB: 50,
  specificRule: 'Must clearly show Date of Birth matching Application Name exactly.'
};

export const DOC_DEGREE = {
  id: 'doc-degree',
  name: 'Bachelor Degree Certificate',
  type: 'Education',
  mandatory: true,
  allowedFormat: ['PDF'],
  maxSizeKB: 1000,
  minSizeKB: 100,
  specificRule: 'Degree completion result declared before application deadline.'
};

export const DOC_PHOTO = {
  id: 'doc-photo',
  name: 'Passport Size Photo',
  type: 'Biometric',
  mandatory: true,
  allowedFormat: ['JPG', 'JPEG'],
  maxSizeKB: 50,
  minSizeKB: 20,
  dimensions: '3.5cm x 4.5cm (350x450 px)',
  specificRule: 'White background, plain glasses without tint, no cap or mask.'
};

export const DOC_SIG = {
  id: 'doc-sig',
  name: 'Scanned Signature',
  type: 'Biometric',
  mandatory: true,
  allowedFormat: ['JPG', 'JPEG'],
  maxSizeKB: 20,
  minSizeKB: 10,
  dimensions: '4.0cm x 2.0cm (400x200 px)',
  specificRule: 'Black or blue ink on plain white paper.'
};

export const DOC_AADHAAR = {
  id: 'doc-aadhaar',
  name: 'Aadhaar Card',
  type: 'Identity',
  mandatory: true,
  allowedFormat: ['PDF', 'JPG'],
  maxSizeKB: 300,
  minSizeKB: 50,
  specificRule: 'Name must match application form.'
};

export const DOC_CASTE = {
  id: 'doc-caste',
  name: 'Caste Certificate',
  type: 'Category',
  mandatory: false,
  allowedFormat: ['PDF'],
  maxSizeKB: 800,
  minSizeKB: 50,
  specificRule: 'OBC-NCL must be issued in GoI format for the current financial year.'
};

export const STANDARD_DOCS = [DOC_10TH, DOC_DEGREE, DOC_PHOTO, DOC_SIG, DOC_AADHAAR, DOC_CASTE];

export const BANK_DOCS = [
  DOC_10TH,
  DOC_DEGREE,
  DOC_PHOTO,
  DOC_SIG,
  DOC_AADHAAR,
  {
    id: 'doc-handwritten',
    name: 'Handwritten Declaration',
    type: 'Declaration',
    mandatory: true,
    allowedFormat: ['JPG', 'JPEG', 'PDF'],
    maxSizeKB: 50,
    minSizeKB: 10,
    specificRule: 'IBPS format handwritten declaration on white paper.'
  },
  DOC_CASTE
];
