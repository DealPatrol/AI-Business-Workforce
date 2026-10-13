import { redirect } from 'next/navigation';

// AI 'after' concept demo retired (YardProof 2026-10-13): postcards use the client's own job photos.
export default function Page() {
  redirect('/postcards');
}
