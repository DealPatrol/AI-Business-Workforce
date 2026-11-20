import type { ReactNode } from 'react';
import type { BlogBlock } from '@/lib/blog/posts';

const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

/** Renders the small Markdown subset the articles use: links, bold, and italics. */
export function InlineText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1] && match[2]) {
      const href = match[2];
      parts.push(
        <a key={key++} href={href} {...(isExternal(href) && !href.includes('executivereceptionist.com') && !href.includes('frontporchgrowth.com') ? { target: '_blank', rel: 'noopener' } : {})}>
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      parts.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={key++}>{match[4]}</em>);
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function BlogBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            return <h2 key={index}>{block.text}</h2>;
          case 'h3':
            return <h3 key={index}>{block.text}</h3>;
          case 'p':
            return (
              <p key={index}>
                <InlineText text={block.text} />
              </p>
            );
          case 'ul':
            return (
              <ul key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ol>
            );
          default: {
            const unexpected: never = block;
            return unexpected;
          }
        }
      })}
    </>
  );
}
