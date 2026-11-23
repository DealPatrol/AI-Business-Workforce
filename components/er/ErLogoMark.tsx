/** Owl mark for Executive Receptionist headers. Decorative; the wordmark sits beside it. */
export function ErLogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/er/owl-mark.svg"
      alt=""
      width={1000}
      height={597}
      className={className}
      aria-hidden="true"
    />
  );
}
