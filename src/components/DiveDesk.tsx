// Dive X 얇은 표면 — 채팅·응결 제안·승인 다이얼로그·연대기. 엔진은 재사용.
import { useMemo, useState } from 'react';
import type { SeriesProject, ProductionRequest } from '../lib/storyEngine';
import { chapterFromDraftPayload, buildProjectContextDigest } from '../lib/storyEngine';
import { inspectLeak } from '../lib/leakGate';
import {
  type DiveSession,
  appendMessage,
  shouldSuggestCondense,
  buildTranscript,
  buildRecentDialogue,
  selectCondenseSpan,
  applyCondenseResult
} from '../lib/diveSession';
import { requestDiveChat, requestDiveCondense, type DiveCondensePayload } from '../lib/diveClient';
import { DIVE_SEED_CHARACTERS } from '../lib/diveSeedCharacters';

interface DiveDeskProps {
  session: DiveSession;
  project: SeriesProject;
  onChange: (session: DiveSession, project: SeriesProject) => void;
  onBack: () => void;
}

function characterCardText(project: SeriesProject, characterId: string): string {
  const c = project.characters.find((x) => x.id === characterId)
    ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === characterId)?.character;
  if (!c) return '';
  return `${c.name} — ${c.role}. 욕망: ${c.desire}. 말투: ${c.voiceRules.join(', ')}`;
}

export function DiveDesk({ session, project, onChange, onBack }: DiveDeskProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DiveCondensePayload | null>(null);
  const [leakWarn, setLeakWarn] = useState<string | null>(null);
  const card = useMemo(() => characterCardText(project, session.characterId), [project, session.characterId]);
  const suggest = shouldSuggestCondense(session);

  async function send() {
    if (!input.trim() || busy) return;
    const userText = input.trim();
    setInput('');
    setBusy(true);
    try {
      let next = appendMessage(session, 'user', userText);
      onChange(next, project);
      const res = await requestDiveChat({
        character: card,
        context: buildProjectContextDigest(project),
        dialogue: buildRecentDialogue(next),
        query: userText
      });
      next = appendMessage(next, 'character', res.reply || '…');
      onChange(next, project);
    } finally {
      // fetch 거절(네트워크 오류·JSON 파싱 실패) 시에도 busy 가 고착돼 입력이 얼지 않게 항상 해제.
      setBusy(false);
    }
  }

  async function condense() {
    if (busy) return;
    setBusy(true);
    try {
      const { condense: span } = selectCondenseSpan(session);
      const episode = project.chapters.length + 1;
      const payload = await requestDiveCondense({
        character: card,
        context: buildProjectContextDigest(project),
        transcript: buildTranscript(span),
        episode
      });
      const leak = inspectLeak(payload.prose);
      setLeakWarn(leak.blocked ? '본문에 프롬프트/AI 누수가 감지됐습니다. 다시 응결하세요.' : null);
      setPending(leak.blocked ? null : payload);
    } finally {
      // fetch 거절 시에도 busy 가 고착되지 않게 항상 해제.
      setBusy(false);
    }
  }

  function approve() {
    if (!pending) return;
    // intent·pressure 는 의도적으로 빈 값 — 본문은 응결 payload 에서 오지, intent/pressure 로 생성하지 않는다.
    const request: ProductionRequest = { genre: project.genre, intent: '', pressure: '' };
    const { updatedProject } = chapterFromDraftPayload(
      project,
      {
        title: pending.title,
        hook: pending.hook,
        outline: pending.outline,
        beats: pending.beats,
        prose: pending.prose,
        newCanonFacts: pending.newCanonFacts
      },
      request
    );
    // chapterFromDraftPayload가 내부에서 commitChapter까지 수행 → updatedProject를 그대로 쓴다(이중 커밋 금지).
    setPending(null);
    onChange(applyCondenseResult(session), updatedProject);
  }

  return (
    <div className="dx-desk">
      <header className="dx-head">
        <button className="dx-back" onClick={onBack}>← 뒤로</button>
        <span className="dx-title">{card}</span>
      </header>

      <div className="dx-chronicle">
        {project.chapters.map((ch) => (
          <article key={ch.id} className="dx-chapter">
            <h4>{ch.episode}화 「{ch.title}」</h4>
            <p>{ch.prose}</p>
          </article>
        ))}
      </div>

      <div className="dx-chat">
        {session.chatBuffer.map((m) => (
          <div key={m.id} className={`dx-bubble dx-${m.role}`}>{m.text}</div>
        ))}
      </div>

      {suggest && !pending && (
        <button className="dx-condense-chip" onClick={condense} disabled={busy}>
          이 장면을 한 회차로 응결할까요?
        </button>
      )}
      {leakWarn && <div className="dx-leak">{leakWarn}</div>}

      {pending && (
        <div className="dx-approve" role="dialog">
          <h4>응결된 회차 — {pending.title}</h4>
          <p className="dx-approve-prose">{pending.prose}</p>
          <ul className="dx-approve-canon">
            {pending.newCanonFacts.map((f, i) => <li key={i}>+ {f.statement}</li>)}
          </ul>
          <div className="dx-approve-actions">
            <button onClick={approve}>승인 — 캐논으로 고정</button>
            <button onClick={() => setPending(null)}>거절</button>
          </div>
        </div>
      )}

      <div className="dx-composer">
        <input
          className="dx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="말을 걸어보세요"
          disabled={busy}
        />
        <button className="dx-send" onClick={send} disabled={busy}>보내기</button>
        <button className="dx-condense-manual" onClick={condense} disabled={busy || session.chatBuffer.length === 0}>
          지금 응결
        </button>
      </div>
    </div>
  );
}
