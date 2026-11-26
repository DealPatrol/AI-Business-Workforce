'use client';

export default function AiVisibilityError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 20px', fontFamily: 'inherit', color: '#1E2620' }}>
      <h1 style={{ font: '500 34px/1.1 Georgia, serif' }}>Something went wrong showing your report.</h1>
      <p style={{ color: '#4E5E52', lineHeight: 1.6 }}>
        Your check may still have gone through. Try again, or email{' '}
        <a href="mailto:hello@frontporchgrowth.com?subject=Visibility%20report" style={{ color: '#4E5E52', fontWeight: 700 }}>
          hello@frontporchgrowth.com
        </a>{' '}
        and we will send it to you.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{ marginTop: 16, minHeight: 48, padding: '12px 20px', borderRadius: 10, border: 0, background: '#E84630', color: '#fff', fontWeight: 780, cursor: 'pointer' }}
      >
        Try again
      </button>
    </main>
  );
}
