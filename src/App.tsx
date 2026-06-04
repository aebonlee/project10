import { useState } from 'react';
import { Hero, Stack, Field, Pill, type Meta } from './ui';

const M: Meta = { id: 10, icon: '💼', title: 'AI 자기소개서·면접 코치', tagline: '자소서 첨삭과 모의면접 질문 코칭', members: ['최재영', '김권우'], color: '#0ea5e9' };

const CLICHE = ['열정', '최선을 다', '성실', '책임감', '항상', '누구보다', '뼈를 깎', '소통'];
const STAR = [{ k: '상황(S)', words: ['상황', '당시', '문제', '배경'] }, { k: '행동(T/A)', words: ['저는', '제가', '진행', '맡아', '주도'] }, { k: '결과(R)', words: ['결과', '향상', '달성', '%', '개선', '성과'] }];

interface Fb { type: 'good' | 'warn'; text: string; }

export default function App() {
  const [text, setText] = useState('');
  const [job, setJob] = useState('');
  const [out, setOut] = useState<null | { fb: Fb[]; questions: string[] }>(null);

  const analyze = () => {
    const t = text.trim();
    const len = t.replace(/\s/g, '').length;
    const fb: Fb[] = [];
    fb.push(len < 300 ? { type: 'warn', text: `분량이 ${len}자로 다소 짧아요. 600~800자를 권장합니다.` } : { type: 'good', text: `분량 ${len}자 — 적절합니다.` });
    const found = CLICHE.filter((c) => t.includes(c));
    fb.push(found.length ? { type: 'warn', text: `진부한 표현 발견: ${found.join(', ')} → 구체적 경험·수치로 바꿔보세요.` } : { type: 'good', text: '진부한 상투어가 적어 좋아요.' });
    STAR.forEach((s) => {
      const has = s.words.some((w) => t.includes(w));
      fb.push(has ? { type: 'good', text: `${s.k} 요소가 드러납니다.` } : { type: 'warn', text: `${s.k} 요소가 약해요. 보강하면 설득력이 올라갑니다.` });
    });
    const numbers = /\d+\s*(%|명|개|배|회|위|점)/.test(t);
    fb.push(numbers ? { type: 'good', text: '정량적 성과(숫자)가 포함되어 설득력이 높아요.' } : { type: 'warn', text: '성과를 숫자로 표현하면 더 강력해집니다. (예: 30% 향상)' });

    const j = job.trim() || '지원 직무';
    const questions = [
      `${j}에 지원한 동기를 30초로 말해 주세요.`,
      '자소서에 쓴 경험 중 가장 어려웠던 순간과 극복 방법은?',
      found.length ? `"${found[0]}"을(를) 구체적 사례로 설명해 주세요.` : '본인의 강점을 실제 사례로 들어 주세요.',
      `${j} 수행에 필요한 역량 중 본인이 부족한 점과 보완 계획은?`,
      '입사 후 1년 안에 이루고 싶은 목표는 무엇인가요?',
    ];
    setOut({ fb, questions });
  };

  return (
    <div className="wrap">
      <Hero m={M} />
      <main style={{ marginTop: 22 }}>
        <Stack>
          <Field label="지원 직무"><input value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 백엔드 개발자, 마케팅 기획" /></Field>
          <Field label="자기소개서 본문"><textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="자기소개서를 붙여넣으세요…" /></Field>
          <button className="btn" disabled={!text.trim()} onClick={analyze}>🩺 첨삭 + 모의면접 질문</button>

          {out && (
            <Stack gap={14}>
              <h2 style={{ margin: 0, fontSize: 18 }}>📝 첨삭 피드백</h2>
              {out.fb.map((f, i) => (
                <div key={i} className="box" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: `4px solid ${f.type === 'good' ? '#10b981' : '#f59e0b'}` }}>
                  <span>{f.type === 'good' ? '✅' : '💡'}</span><p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{f.text}</p>
                </div>
              ))}
              <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>🎤 예상 면접 질문</h2>
              {out.questions.map((q, i) => (
                <div key={i} className="box" style={{ display: 'flex', gap: 10 }}><Pill color={M.color}>Q{i + 1}</Pill><span style={{ fontSize: 14.5 }}>{q}</span></div>
              ))}
            </Stack>
          )}
        </Stack>
      </main>
    </div>
  );
}
