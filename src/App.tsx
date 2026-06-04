import { useState } from 'react';
import { AppLayout, Stack, Field, Pill, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

const M: Meta = {
  id: 10, icon: '💼', title: 'AI 자기소개서·면접 코치', tagline: '자소서 첨삭과 모의면접 질문 코칭', members: ['최재영', '김권우'], color: '#0ea5e9', ai: true,
  problem: '자소서는 막막하고, 첨삭받을 곳은 마땅치 않습니다. 작성한 자소서를 넣으면 AI가 구체적으로 첨삭하고, 직무 맞춤 예상 면접 질문까지 생성해 실전 준비를 돕습니다.',
  features: [
    { icon: '🩺', title: 'AI 첨삭', desc: 'OpenAI가 강점·개선점·수정 예시를 제시' },
    { icon: '🎤', title: '모의면접 질문', desc: '자소서·직무 기반 예상 질문 생성' },
    { icon: '📏', title: '규칙 점검', desc: '분량·진부표현·STAR·정량성과 자동 체크' },
    { icon: '⚡', title: '즉시 피드백', desc: '키 없이도 규칙 기반 기본 점검 제공' },
  ],
  howto: ['지원 직무와 자기소개서를 입력해요', 'AI 첨삭 + 규칙 점검 결과를 확인해요', '생성된 예상 면접 질문으로 연습해요'],
  facts: [{ value: 'GPT', label: 'AI 첨삭' }, { value: 'STAR', label: '구조 점검' }, { value: '5', label: '예상 질문' }, { value: '4', label: '점검 항목' }],
  info: [
    { title: 'STAR 기법', body: 'Situation(상황)·Task(과제)·Action(행동)·Result(결과) 순으로 경험을 서술하면 설득력이 높아집니다.' },
    { title: '진부한 표현 피하기', body: '“열정·성실·최선”은 누구나 씁니다. 구체적 사례와 수치(예: 30% 개선)로 대체하세요.' },
    { title: '직무 적합성', body: '회사의 인재상·직무 요구사항(JD)에 맞춰 본인 경험을 연결하면 합격 가능성이 높아집니다.' },
  ],
  stack: ['React', 'TypeScript', 'OpenAI API', 'Vite'],
};

const CLICHE = ['열정', '최선을 다', '성실', '책임감', '항상', '누구보다', '소통'];
interface Fb { type: 'good' | 'warn'; text: string; }
const ruleCheck = (t: string): Fb[] => {
  const len = t.replace(/\s/g, '').length; const fb: Fb[] = [];
  fb.push(len < 300 ? { type: 'warn', text: `분량이 ${len}자로 짧아요. 600~800자를 권장합니다.` } : { type: 'good', text: `분량 ${len}자 — 적절합니다.` });
  const found = CLICHE.filter((c) => t.includes(c));
  fb.push(found.length ? { type: 'warn', text: `진부한 표현: ${found.join(', ')} → 구체적 경험·수치로 교체하세요.` } : { type: 'good', text: '진부한 상투어가 적어 좋아요.' });
  fb.push(/\d+\s*(%|명|개|배|회|위|점)/.test(t) ? { type: 'good', text: '정량적 성과(숫자)가 포함돼 설득력이 높아요.' } : { type: 'warn', text: '성과를 숫자로 표현하면 더 강력해집니다.' });
  fb.push(/결과|향상|달성|개선|성과/.test(t) ? { type: 'good', text: '결과(R) 요소가 드러납니다.' } : { type: 'warn', text: '경험의 결과를 명확히 적어 주세요.' });
  return fb;
};

function Feature() {
  const [text, setText] = useState(''); const [job, setJob] = useState('');
  const [fb, setFb] = useState<Fb[] | null>(null);
  const [ai, setAi] = useState(''); const [qs, setQs] = useState<string[]>([]); const [loading, setLoading] = useState(false);

  const run = async () => {
    setFb(ruleCheck(text)); setLoading(true); setAi(''); setQs([]);
    try {
      const r = await ask('너는 채용 담당 출신 자소서 코치야. 입력 자소서를 첨삭하고 직무 맞춤 예상 면접 질문을 만든다. 반드시 {"feedback":"3~5문장 첨삭","questions":["q1",...5개]} JSON.', `직무: ${job || '미지정'}\n자소서:\n${text}`, { json: true, temperature: 0.6, max_tokens: 700 });
      const p = JSON.parse(r); setAi(p.feedback || ''); setQs(Array.isArray(p.questions) ? p.questions.slice(0, 5) : []);
    } catch {
      if (!hasKey()) { setAi('상단에서 OpenAI API 키를 입력하면 AI 첨삭이 켜집니다. 아래는 규칙 기반 점검 결과예요.'); setQs([`${job || '지원 직무'} 지원 동기를 말해 주세요.`, '가장 어려웠던 경험과 극복 방법은?', '본인의 강점을 사례로 설명해 주세요.', '입사 후 목표는?', '협업에서 갈등을 해결한 경험은?']); }
      else setAi('AI 첨삭 생성에 실패했어요. 다시 시도해 주세요.');
    }
    setLoading(false);
  };

  return (
    <Stack>
      <Field label="지원 직무"><input value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 백엔드 개발자, 마케팅 기획" /></Field>
      <Field label="자기소개서 본문"><textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="자기소개서를 붙여넣으세요…" /></Field>
      <button className="btn" style={{ background: M.color }} disabled={!text.trim() || loading} onClick={run}>{loading ? '🩺 분석 중…' : '🩺 AI 첨삭 + 모의면접'}</button>
      {ai && <div className="box" style={{ borderLeft: `4px solid ${M.color}` }}><p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>🤖 {ai}</p></div>}
      {fb && (<><h2 style={{ margin: 0, fontSize: 17 }}>📝 규칙 점검</h2>{fb.map((f, i) => <div key={i} className="box" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: `4px solid ${f.type === 'good' ? '#10b981' : '#f59e0b'}` }}><span>{f.type === 'good' ? '✅' : '💡'}</span><p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{f.text}</p></div>)}</>)}
      {qs.length > 0 && (<><h2 style={{ margin: '6px 0 0', fontSize: 17 }}>🎤 예상 면접 질문</h2>{qs.map((q, i) => <div key={i} className="box" style={{ display: 'flex', gap: 10 }}><Pill color={M.color}>Q{i + 1}</Pill><span style={{ fontSize: 14.5 }}>{q}</span></div>)}</>)}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
