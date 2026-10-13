import ScoreTool from './score-tool';

export const metadata = { title: 'Free Google review score | ReputationFlow', description: 'See your Google rating and review count against the top 3 local competitors.' };

export default function ScorePage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui', color: '#17211b' }}>
      <small>REPUTATIONFLOW · FREE TOOL</small>
      <h1>How do your Google reviews stack up?</h1>
      <p>Enter your business and city. We pull your public Google rating and review count and compare it to the three most-reviewed competitors nearby. Three checks per day.</p>
      <ScoreTool />
    </main>
  );
}
