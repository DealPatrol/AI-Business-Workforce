import Link from 'next/link';
import styles from '../../book.module.css';

export const metadata = {
  title: 'Booking confirmed',
  robots: { index: false, follow: false },
};

export default function BookingConfirmedPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link className={styles.brand} href="/">Front Porch Growth</Link>
        <div className={styles.card}>
          <h1 className={styles.title}>You are booked</h1>
          <p className={styles.lede}>
            If your deposit payment went through, this time is yours. A confirmation email is sent when email is set up.
          </p>
          <Link className={styles.button} href="/" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
