import { smsHref } from '@/lib/leads/sms';

type TextUsButtonProps = {
  phone: string;
  label?: string;
  className?: string;
};

/** Customer-initiated SMS only: opens the visitor's own messaging app. Does not send a text. */
export default function TextUsButton({ phone, label = 'Text us', className }: TextUsButtonProps) {
  const href = smsHref(phone);
  if (!href) return null;
  return (
    <a className={className} href={href}>
      {label}
    </a>
  );
}
