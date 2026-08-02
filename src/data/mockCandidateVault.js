export const INITIAL_CANDIDATE = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91 98765 43210",
  whatsappEnabled: true,
  emailEnabled: true,
  category: "OBC-NCL",
  qualification: "B.Tech Computer Science (2025)",
  dob: "2002-04-14",
  documents: [
    {
      id: 'vault-10th',
      name: 'Matriculation (10th) Marksheet & Certificate',
      type: 'Education',
      fileName: 'rahul_sharma_10th_certificate.pdf',
      fileFormat: 'PDF',
      fileSizeKB: 240,
      dimensions: 'N/A (Document)',
      uploadDate: '2026-01-10',
      issueDate: '2018-05-20',
      status: 'VERIFIED',
      previewUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'vault-degree',
      name: 'Bachelor Degree Marksheet (B.Tech)',
      type: 'Education',
      fileName: 'btech_consolidated_marksheet.pdf',
      fileFormat: 'PDF',
      fileSizeKB: 820,
      dimensions: 'N/A (Document)',
      uploadDate: '2026-02-15',
      issueDate: '2025-06-12',
      status: 'VERIFIED',
      previewUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'vault-photo',
      name: 'Passport Photo (Original Scanned)',
      type: 'Biometric',
      fileName: 'rahul_passport_photo_hd.jpg',
      fileFormat: 'JPG',
      fileSizeKB: 85, // Exceeds 50KB limit!
      dimensions: '400x500 px (4.0cm x 5.0cm)', // Non-standard dimension!
      uploadDate: '2026-03-01',
      issueDate: '2026-02-20',
      status: 'ATTENTION_REQUIRED',
      issueNote: 'File size 85KB exceeds 50KB maximum limit for SSC/IBPS forms.',
      previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'vault-sig',
      name: 'Scanned Digital Signature',
      type: 'Biometric',
      fileName: 'rahul_sig_black_ink.jpg',
      fileFormat: 'JPG',
      fileSizeKB: 15,
      dimensions: '400x200 px (4.0cm x 2.0cm)',
      uploadDate: '2026-03-01',
      issueDate: '2026-02-20',
      status: 'VERIFIED',
      previewUrl: 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'vault-obc',
      name: 'OBC Non-Creamy Layer Certificate',
      type: 'Category',
      fileName: 'obc_ncl_state_certificate_2024.pdf',
      fileFormat: 'PDF',
      fileSizeKB: 420,
      dimensions: 'N/A (Document)',
      uploadDate: '2026-01-05',
      issueDate: '2024-01-15', // Older than April 1, 2025 cutoff!
      status: 'EXPIRED_OR_INVALID',
      issueNote: 'Issued on Jan 15, 2024. Most Central Govt posts require certificate issued after April 1, 2025.',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'vault-id',
      name: 'Aadhaar Card (Govt Photo ID)',
      type: 'Identity',
      fileName: 'aadhaar_card_rahul.pdf',
      fileFormat: 'PDF',
      fileSizeKB: 190,
      dimensions: 'N/A (Document)',
      uploadDate: '2026-01-10',
      issueDate: '2021-08-10',
      status: 'VERIFIED',
      previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
    }
  ]
};
