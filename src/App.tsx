import { useState } from 'react';
import { AppLayout, Stack, Field, Chip, useLocalStorage, type Meta } from './ui';
import { ask, hasKey } from './lib/ai';

const M: Meta = {
  id: 10, icon: '💼', title: 'AI 자기소개서·면접 코치', tagline: '직무·경험을 입력하면 자소서 초안과 STAR 피드백, 모의 면접 질문·모범답안을 만들어 줘요',
  members: ['최재영', '김권우'], color: '#0ea5e9', ai: true,
  problem:
    '자기소개서는 막막한 백지에서 시작하고, 면접은 무엇을 물을지 몰라 두렵습니다. ' +
    '본 코치는 직무·회사·핵심 경험을 입력하면 문항에 맞는 자소서 초안과 STAR 구조 분석·개선 피드백을 제공하고, ' +
    '모의 면접 모드에서는 직무 맞춤 예상 질문과 의도·모범답안·답변 팁을 생성해 실전을 준비시킵니다.',
  features: [
    { icon: '📝', title: '자소서 초안 생성', desc: '문항·직무·경험을 반영한 초안을 즉석 작성' },
    { icon: '⭐', title: 'STAR 구조 분석', desc: '상황·과제·행동·결과로 경험을 구조화해 점검' },
    { icon: '🔧', title: '개선 피드백', desc: '두루뭉술·수동 표현을 짚어 구체적으로 수정 제안' },
    { icon: '🎤', title: '모의 면접 질문', desc: '직무 맞춤 예상 질문과 출제 의도 제공' },
    { icon: '💡', title: '모범답안 · 팁', desc: '질문별 모범답안 예시와 답변 전략 제시' },
    { icon: '💾', title: '초안 보관', desc: '작성한 자소서를 저장하고 다시 다듬기' },
  ],
  howto: [
    '(선택) OpenAI API 키를 입력하면 실제 AI 코칭이 켜집니다',
    '직무·회사·경력 단계를 입력합니다',
    '자소서 모드: 문항과 핵심 경험을 넣고 초안을 생성합니다',
    '면접 모드: 예상 질문·모범답안·팁을 받습니다',
  ],
  facts: [
    { value: 'STAR', label: '구조 분석' }, { value: 'AI', label: '초안·피드백' }, { value: '면접', label: '질문·모범답안' },
    { value: '직무', label: '맞춤' }, { value: '저장', label: '초안 보관' }, { value: '무키', label: '폴백 동작' },
  ],
  info: [
    { title: 'STAR 기법이란?', body: 'Situation(상황)·Task(과제)·Action(행동)·Result(결과) 순으로 경험을 풀면 설득력이 커집니다. 채용담당자가 가장 선호하는 구조입니다.' },
    { title: '좋은 자소서의 조건', body: '추상적 다짐보다 구체적 사례와 수치, 직무와의 연결이 핵심입니다. “열정적”이 아니라 “무엇을 어떻게 했고 결과가 어땠는지”를 씁니다.' },
    { title: '면접 준비 전략', body: '예상 질문의 “출제 의도”를 알면 답이 보입니다. 본 코치는 질문마다 의도를 함께 제시해 핵심을 겨냥하게 합니다.' },
    { title: '주의', body: 'AI 초안은 출발점입니다. 본인 경험으로 사실에 맞게 다듬고, 회사·직무에 맞춰 개인화하세요.' },
  ],
  pipeline: [
    '맥락 수집 — 직무·회사·경력·문항·핵심 경험을 구조화',
    '생성 합성 — STAR·직무적합성 지침 + JSON 스키마 강제',
    'GPT 호출 — 자소서(초안·STAR·피드백) 또는 면접(질문·의도·모범답안) 수신',
    '검증·폴백 — 누락 시 템플릿으로 안전 생성',
    '코칭 — STAR 분해 + 개선 피드백 / 질문별 의도·모범답안',
    '관리 — 초안 localStorage 저장·재편집',
  ],
  techNotes: [
    { title: '모드별 스키마', body: '자소서/면접 모드에 따라 서로 다른 JSON 스키마를 강제해 일관된 결과 구조를 보장합니다.' },
    { title: 'STAR 파서', body: '경험을 Situation/Task/Action/Result 필드로 받아 구조적 점검과 시각적 분해를 제공합니다.' },
    { title: '클립보드 내보내기', body: 'navigator.clipboard로 초안을 한 번에 복사해 지원서에 바로 붙여넣게 합니다.' },
    { title: '정적·오프라인', body: '키 없이도 템플릿으로 동작하며 초안은 localStorage에 보관됩니다.' },
  ],
  stack: ['React 18', 'TypeScript', 'Vite', 'OpenAI GPT', 'Clipboard API', 'localStorage'],
  links: [
    { label: '워크넷', url: 'https://www.work.go.kr' },
  ],
};

const PROMPTS = ['지원 동기', '성장 과정', '직무 역량·강점', '입사 후 포부', '갈등 극복 경험'];
const LEVELS = ['신입', '경력'];

interface Star { situation: string; task: string; action: string; result: string }
interface Feedback { point: string; suggestion: string }
interface Cover { draft: string; star: Star; feedback: Feedback[] }
interface IQ { q: string; intent: string; sample_answer: string; tips: string }

async function getCover(job: string, company: string, level: string, prompt: string, exp: string): Promise<Cover> {
  const fb: Cover = {
    draft: `[${prompt}] ${company || '귀사'}의 ${job || '해당 직무'}에 지원합니다. ${exp || '제 경험'}을 통해 배운 점을 바탕으로 기여하겠습니다. (AI 키를 입력하면 더 정교한 초안을 받을 수 있어요.)`,
    star: { situation: exp ? `${exp} 상황에서` : '구체적 상황을 적어 보세요', task: '맡은 과제·목표', action: '내가 한 구체적 행동', result: '수치로 드러나는 결과' },
    feedback: [{ point: '추상적 표현', suggestion: '“열정적”보다 구체적 행동·수치로 바꾸세요.' }, { point: '직무 연결', suggestion: `경험을 ${job || '직무'}의 요구역량과 명확히 연결하세요.` }],
  };
  if (!hasKey()) return fb;
  try {
    const out = await ask(
      '너는 채용 전문 자소서 코치야. STAR 구조와 직무적합성을 중시한다. 반드시 JSON만: {"draft":"문항에 맞는 자소서 초안 5~7문장","star":{"situation":"","task":"","action":"","result":""},"feedback":[{"point":"개선점","suggestion":"수정 제안"}]}',
      `직무: ${job || '미지정'} / 회사·산업: ${company || '미지정'} / 경력: ${level} / 문항: ${prompt} / 핵심 경험: ${exp || '(빈칸)'} . 피드백 2~3개, 한국어.`,
      { json: true, temperature: 0.7, max_tokens: 1300 },
    );
    const p = JSON.parse(out);
    if (!p.draft) return fb;
    return { draft: String(p.draft), star: { situation: String(p.star?.situation || ''), task: String(p.star?.task || ''), action: String(p.star?.action || ''), result: String(p.star?.result || '') }, feedback: (p.feedback || []).map((f: Feedback) => ({ point: String(f.point || ''), suggestion: String(f.suggestion || '') })) };
  } catch { return fb; }
}

async function getInterview(job: string, level: string): Promise<IQ[]> {
  const fb: IQ[] = [
    { q: '자기소개를 1분간 해주세요.', intent: '핵심 강점과 직무 연결을 보는 질문', sample_answer: '직무 관련 경험 1가지 + 강점 + 지원 이유를 30초로 압축해 말합니다.', tips: '두괄식으로, 수치를 곁들이세요.' },
    { q: '가장 어려웠던 문제를 어떻게 해결했나요?', intent: '문제해결력과 STAR 구조', sample_answer: '상황-과제-행동-결과 순으로 구체적으로.', tips: '결과를 수치로 제시하세요.' },
  ];
  if (!hasKey()) return fb;
  try {
    const out = await ask(
      '너는 면접관이자 취업 코치야. 직무 맞춤 예상 질문을 낸다. 반드시 JSON만: {"questions":[{"q":"","intent":"출제 의도","sample_answer":"모범답안 요지","tips":"답변 팁"}]}',
      `직무: ${job || '일반'} / 경력: ${level}. 질문 5개, 한국어.`,
      { json: true, temperature: 0.7, max_tokens: 1400 },
    );
    const p = JSON.parse(out);
    const qs = (p.questions || []);
    if (!qs.length) return fb;
    return qs.map((q: IQ) => ({ q: String(q.q || ''), intent: String(q.intent || ''), sample_answer: String(q.sample_answer || ''), tips: String(q.tips || '') }));
  } catch { return fb; }
}

function Feature() {
  const [mode, setMode] = useState<'cover' | 'interview'>('cover');
  const [job, setJob] = useState('');
  const [company, setCompany] = useState('');
  const [level, setLevel] = useState('신입');
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [exp, setExp] = useState('');
  const [cover, setCover] = useState<Cover | null>(null);
  const [iqs, setIqs] = useState<IQ[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useLocalStorage<{ id: number; prompt: string; draft: string }[]>('resume.drafts', []);

  const run = async () => {
    setLoading(true);
    if (mode === 'cover') { setCover(await getCover(job, company, level, prompt, exp)); setIqs(null); }
    else { setIqs(await getInterview(job, level)); setCover(null); }
    setLoading(false);
    requestAnimationFrame(() => document.getElementById('out-top')?.scrollIntoView({ behavior: 'smooth' }));
  };

  return (
    <Stack>
      <div className="studio">
        <Field label="모드"><div className="chips">
          <Chip active={mode === 'cover'} color={M.color} onClick={() => setMode('cover')}>📝 자기소개서</Chip>
          <Chip active={mode === 'interview'} color={M.color} onClick={() => setMode('interview')}>🎤 모의 면접</Chip>
        </div></Field>
        <div className="studio-row">
          <Field label="지원 직무"><input value={job} onChange={(e) => setJob(e.target.value)} placeholder="예: 백엔드 개발자, 마케터" /></Field>
          <Field label="회사·산업" hint="선택"><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: 핀테크 스타트업" /></Field>
        </div>
        <Field label="경력 단계"><div className="chips">{LEVELS.map((l) => <Chip key={l} active={level === l} color={M.color} onClick={() => setLevel(l)}>{l}</Chip>)}</div></Field>
        {mode === 'cover' && <>
          <Field label="자소서 문항"><div className="chips">{PROMPTS.map((p) => <Chip key={p} active={prompt === p} color={M.color} onClick={() => setPrompt(p)}>{p}</Chip>)}</div></Field>
          <Field label="핵심 경험" hint="자유롭게"><textarea rows={3} value={exp} onChange={(e) => setExp(e.target.value)} placeholder="예: 동아리에서 회원 모집 캠페인을 기획해 가입자 2배 달성" /></Field>
        </>}
        <button className="btn" style={{ background: M.color }} disabled={loading} onClick={run}>{loading ? '작성 중…' : mode === 'cover' ? '📝 자소서 초안 만들기' : '🎤 예상 질문 받기'}</button>
      </div>

      <div id="out-top" />
      {loading && <div className="spinner" />}

      {cover && !loading && (
        <Stack gap={16}>
          <div className="rcard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tag" style={{ background: M.color }}>{prompt} 초안</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => navigator.clipboard?.writeText(cover.draft)}>📋 복사</button>
                <button className="btn btn-ghost" style={{ padding: '5px 11px', fontSize: 12 }} onClick={() => setSaved([{ id: Date.now(), prompt, draft: cover.draft }, ...saved].slice(0, 20))}>💾 저장</button>
              </div>
            </div>
            <p style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.95, whiteSpace: 'pre-wrap' }}>{cover.draft}</p>
          </div>
          <div className="learn">
            <h3 className="learn-h" style={{ color: M.color }}>⭐ STAR 구조</h3>
            <div className="result-grid">
              {([['situation', '상황 S'], ['task', '과제 T'], ['action', '행동 A'], ['result', '결과 R']] as [keyof Star, string][]).map(([k, label]) => (
                <div key={k} className="rcard"><span className="tag" style={{ background: M.color }}>{label}</span><p style={{ marginTop: 6, color: 'var(--text)', fontSize: 13.5 }}>{cover.star[k]}</p></div>
              ))}
            </div>
          </div>
          {cover.feedback.length > 0 && (
            <div className="learn">
              <h3 className="learn-h" style={{ color: M.color }}>🔧 개선 피드백</h3>
              <Stack gap={8}>{cover.feedback.map((f, i) => <div key={i} className="rcard"><strong style={{ color: '#f59e0b' }}>⚠ {f.point}</strong><p style={{ marginTop: 4 }}>{f.suggestion}</p></div>)}</Stack>
            </div>
          )}
        </Stack>
      )}

      {iqs && !loading && (
        <div className="learn">
          <h3 className="learn-h" style={{ color: M.color }}>🎤 예상 면접 질문 ({iqs.length})</h3>
          <Stack gap={10}>
            {iqs.map((q, i) => (
              <details key={i} className="rcard">
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Q{i + 1}. {q.q}</summary>
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--faint)' }}>🎯 의도 · {q.intent}</p>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text)', lineHeight: 1.75 }}><b>모범답안 ·</b> {q.sample_answer}</p>
                  {q.tips && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--sub)' }}>💡 {q.tips}</p>}
                </div>
              </details>
            ))}
          </Stack>
        </div>
      )}

      {saved.length > 0 && (
        <div className="learn">
          <h3 className="learn-h" style={{ color: M.color }}>💾 저장한 초안 ({saved.length})</h3>
          <Stack gap={8}>{saved.map((s) => (
            <div key={s.id} className="rcard"><span className="tag" style={{ background: M.color }}>{s.prompt}</span><p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--sub)' }}>{s.draft.slice(0, 90)}…</p><button className="btn btn-ghost" style={{ marginTop: 8, padding: '5px 11px', fontSize: 12 }} onClick={() => setSaved(saved.filter((x) => x.id !== s.id))}>✕ 삭제</button></div>
          ))}</Stack>
        </div>
      )}
    </Stack>
  );
}

export default function App() { return <AppLayout m={M} feature={<Feature />} />; }
