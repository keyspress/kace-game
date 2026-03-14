import { PhaserGame } from './game/PhaserGame';
import { ResourceBar } from './ui/ResourceBar';

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <PhaserGame />
      <ResourceBar />
    </div>
  );
}
