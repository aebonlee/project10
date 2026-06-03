import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [dbStatus, setDbStatus] = useState('확인 중…');

  useEffect(() => {
    if (!supabase) { setDbStatus('미설정 (.env에 VITE_SUPABASE_* 입력)'); return; }
    setDbStatus('Supabase 연결됨 ✓');
  }, []);

  return (
    <main className="app">
      <span className="badge">AI Reboot Academy · 팀 프로젝트</span>
      <h1>project10</h1>
      <p>여기서부터 자유롭게 개발하세요. AI(바이브코딩)에게 자연어로 요청해 화면·기능을 만들어 보세요.</p>
      <div className="card">
        <strong>개발 시작</strong>
        <ol>
          <li>npm install</li>
          <li>npm run dev → http://localhost:5173</li>
          <li>src/App.tsx 부터 수정</li>
        </ol>
      </div>
      <div className="card">DB 상태: {dbStatus}</div>
    </main>
  );
}
