import './demo.css';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="personalized-demo-layout">{children}</div>;
}
