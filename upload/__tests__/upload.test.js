'use strict';

const path = require('path');
const fs = require('fs');
const request = require('supertest');

// Import server without starting it
const { app, ALLOWED_TYPES, ALLOWED_EXTENSIONS, isAllowedFile } = require('../server');

// ---------------------------------------------------------------------------
// Helper: create a minimal in-memory Buffer that represents a file
// ---------------------------------------------------------------------------
const TINY_PDF_BYTES = Buffer.from('%PDF-1.4 minimal'); // fake but recognisable
const TINY_PPTX_BYTES = Buffer.from('PK\x03\x04'); // PPTX is a ZIP-based format
const TINY_PPT_BYTES = Buffer.from('\xD0\xCF\x11\xE0'); // OLE2 compound document
const TINY_TXT_BYTES = Buffer.from('hello world');

// ---------------------------------------------------------------------------
// Unit tests: isAllowedFile()
// ---------------------------------------------------------------------------
describe('isAllowedFile()', () => {
  test('allows application/pdf with .pdf extension', () => {
    expect(isAllowedFile('application/pdf', 'doc.pdf')).toBe(true);
  });

  test('allows application/vnd.openxmlformats-officedocument.presentationml.presentation with .pptx', () => {
    expect(
      isAllowedFile(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'deck.pptx'
      )
    ).toBe(true);
  });

  test('allows application/vnd.ms-powerpoint with .ppt extension', () => {
    expect(
      isAllowedFile('application/vnd.ms-powerpoint', 'presentation.ppt')
    ).toBe(true);
  });

  test('rejects text/plain with .txt extension', () => {
    expect(isAllowedFile('text/plain', 'readme.txt')).toBe(false);
  });

  test('rejects image/jpeg with .jpg extension', () => {
    expect(isAllowedFile('image/jpeg', 'photo.jpg')).toBe(false);
  });

  test('rejects mismatched MIME type and extension (spoofing)', () => {
    // MIME says PDF but extension says .exe – should be rejected
    expect(isAllowedFile('application/pdf', 'malware.exe')).toBe(false);
  });

  test('rejects mismatched extension/MIME – .pdf extension with wrong MIME', () => {
    expect(isAllowedFile('text/plain', 'document.pdf')).toBe(false);
  });

  test('is case-insensitive on extensions', () => {
    expect(isAllowedFile('application/pdf', 'DOC.PDF')).toBe(true);
    expect(
      isAllowedFile(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'DECK.PPTX'
      )
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: exported constants
// ---------------------------------------------------------------------------
describe('ALLOWED_TYPES', () => {
  test('contains application/pdf', () => {
    expect(ALLOWED_TYPES).toHaveProperty('application/pdf');
  });

  test('contains the PPTX MIME type', () => {
    expect(
      ALLOWED_TYPES[
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ]
    ).toBeDefined();
  });

  test('contains the PPT MIME type', () => {
    expect(ALLOWED_TYPES['application/vnd.ms-powerpoint']).toBeDefined();
  });
});

describe('ALLOWED_EXTENSIONS', () => {
  test('contains .pdf', () => {
    expect(ALLOWED_EXTENSIONS.has('.pdf')).toBe(true);
  });

  test('contains .pptx', () => {
    expect(ALLOWED_EXTENSIONS.has('.pptx')).toBe(true);
  });

  test('contains .ppt', () => {
    expect(ALLOWED_EXTENSIONS.has('.ppt')).toBe(true);
  });

  test('does not contain .exe', () => {
    expect(ALLOWED_EXTENSIONS.has('.exe')).toBe(false);
  });

  test('does not contain .txt', () => {
    expect(ALLOWED_EXTENSIONS.has('.txt')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration tests: GET /supported-types
// ---------------------------------------------------------------------------
describe('GET /supported-types', () => {
  test('returns 200 with MIME types and extensions', async () => {
    const res = await request(app).get('/supported-types');
    expect(res.status).toBe(200);
    expect(res.body.mimeTypes).toContain('application/pdf');
    expect(res.body.mimeTypes).toContain(
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    expect(res.body.mimeTypes).toContain('application/vnd.ms-powerpoint');
    expect(res.body.extensions).toContain('.pdf');
    expect(res.body.extensions).toContain('.pptx');
    expect(res.body.extensions).toContain('.ppt');
  });
});

// ---------------------------------------------------------------------------
// Integration tests: POST /upload
// ---------------------------------------------------------------------------
describe('POST /upload – accepted file types', () => {
  afterEach(() => {
    // Clean up any files written to the uploads directory during tests
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      fs.readdirSync(uploadsDir).forEach((f) => {
        try { fs.unlinkSync(path.join(uploadsDir, f)); } catch { /* ignore – file may already be removed */ }
      });
    }
  });

  test('accepts a PDF file', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_PDF_BYTES, {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.originalName).toBe('test.pdf');
  });

  test('accepts a PPTX file', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_PPTX_BYTES, {
        filename: 'deck.pptx',
        contentType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.originalName).toBe('deck.pptx');
  });

  test('accepts a PPT file', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_PPT_BYTES, {
        filename: 'slides.ppt',
        contentType: 'application/vnd.ms-powerpoint',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.originalName).toBe('slides.ppt');
  });

  test('returns filename and size in success response', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_PDF_BYTES, {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      originalName: 'report.pdf',
    });
    expect(typeof res.body.filename).toBe('string');
    expect(typeof res.body.size).toBe('number');
  });
});

describe('POST /upload – rejected file types', () => {
  test('rejects a plain-text file with 415', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_TXT_BYTES, {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(415);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unsupported file type/i);
  });

  test('rejects a JPEG image with 415', async () => {
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const res = await request(app)
      .post('/upload')
      .attach('file', jpegBytes, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(415);
    expect(res.body.success).toBe(false);
  });

  test('rejects a disguised file (PDF MIME but .exe extension) with 415', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_PDF_BYTES, {
        filename: 'malware.exe',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(415);
    expect(res.body.success).toBe(false);
  });

  test('returns supported MIME types in rejection response', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', TINY_TXT_BYTES, {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(415);
    expect(Array.isArray(res.body.supported)).toBe(true);
    expect(res.body.supported).toContain('application/pdf');
  });

  test('returns 400 when no file is sent', async () => {
    const res = await request(app).post('/upload');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
