import Link from 'next/link';

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 22px', lineHeight: 1.65 }}>
      <Link href="/">← YardProof</Link>
      <h1>YardProof terms</h1>
      <p>Last updated September 27, 2026.</p>

      <h2 id="photo-upload-license">Property photo upload license</h2>
      <p>
        By uploading a property photo, you confirm that you took or own the photo, or otherwise
        have authority to license it. You grant the contractor and YardProof a non-exclusive,
        royalty-free license to store, privacy-redact, edit with AI, display, and print that photo
        solely to prepare and deliver this property’s estimate, design concept, and related
        campaign materials. You retain ownership of your photo.
      </p>
      <p>
        Do not upload photos you do not have rights to use. YardProof may reject or delete an
        upload, and human review is required before an AI concept can be mailed.
      </p>

      <h2>Privacy and suppression</h2>
      <p>
        Uploaded and crew-captured photos are processed to blur detected faces, readable text such
        as house numbers, and detected license plates. You may request that the property not be
        photographed or mailed through the property’s QR page.
      </p>
    </main>
  );
}
