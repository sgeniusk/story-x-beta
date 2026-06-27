// Dive X 얇은 표면 — 채팅·응결 제안·승인 다이얼로그·연대기. 엔진은 재사용.
import { useMemo, useState } from 'react';
import type { SeriesProject, ProductionRequest } from '../lib/storyEngine';
import { chapterFromDraftPayload, buildProjectContextDigest } from '../lib/storyEngine';
import { inspectLeak } from '../lib/leakGate';
import {
  type DiveSession,
  CONDENSE_KEEP_RECENT,
  appendMessage,
  shouldSuggestCondense,
  buildTranscript,
  buildRecentDialogue,
  selectCondenseSpan,
  applyCondenseResult,
  parseSceneSegments
} from '../lib/diveSession';
import { requestDiveChat, requestDiveCondense, requestDiveShowrunner, type DiveCondensePayload } from '../lib/diveClient';
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

// 대사 속 *행동·묘사*를 기울임으로 분리 렌더(제타류 관례) — 대사는 그대로, 별표 구간은 지문처럼.
function renderDialogue(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((seg, i) => {
    if (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) {
      return (
        <em key={i} className="dx-action">
          {seg.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

export function DiveDesk({ session, project, onChange, onBack }: DiveDeskProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<DiveCondensePayload | null>(null);
  const [leakWarn, setLeakWarn] = useState<string | null>(null);
  const [condensing, setCondensing] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [srInput, setSrInput] = useState('');
  const [srReply, setSrReply] = useState<string | null>(null);
  const [srSceneUpdate, setSrSceneUpdate] = useState('');
  const scene = session.scene ?? '';
  const card = useMemo(() => characterCardText(project, session.characterId), [project, session.characterId]);
  const charName = useMemo(() => {
    const c = project.characters.find((x) => x.id === session.characterId)
      ?? DIVE_SEED_CHARACTERS.find((s) => s.character.id === session.characterId)?.character;
    return c?.name ?? '상대';
  }, [project, session.characterId]);
  const suggest = shouldSuggestCondense(session);

  async function send() {
    if (!input.trim() || busy || pending !== null) return;
    const userText = input.trim();
    setInput('');
    setBusy(true);
    let next = appendMessage(session, 'user', userText);
    onChange(next, project);
    try {
      const res = await requestDiveChat({
        character: card,
        scene,
        context: buildProjectContextDigest(project),
        dialogue: buildRecentDialogue(next),
        query: userText
      });
      next = appendMessage(next, 'character', res.reply || '…');
      onChange(next, project);
    } catch {
      next = appendMessage(next, 'character', '…(지금은 대답하기 어려워.)');
      onChange(next, project);
    } finally {
      // fetch 거절(네트워크 오류·JSON 파싱 실패) 시에도 busy 가 고착돼 입력이 얼지 않게 항상 해제.
      setBusy(false);
    }
  }

  async function condense() {
    if (busy) return;
    setBusy(true);
    setCondensing(true);
    try {
      const { condense: span } = selectCondenseSpan(session);
      const episode = project.chapters.length + 1;
      const payload = await requestDiveCondense({
        character: card,
        scene,
        context: buildProjectContextDigest(project),
        transcript: buildTranscript(span),
        episode
      });
      const leak = inspectLeak(payload.prose);
      setLeakWarn(leak.blocked ? '본문에 프롬프트/AI 누수가 감지됐습니다. 다시 응결하세요.' : null);
      setPending(leak.blocked ? null : payload);
    } catch {
      setLeakWarn('응결 요청에 실패했습니다. 다시 시도하세요.');
      setPending(null);
    } finally {
      // fetch 거절 시에도 busy 가 고착되지 않게 항상 해제.
      setBusy(false);
      setCondensing(false);
    }
  }

  function setScene(next: string) {
    onChange({ ...session, scene: next }, project);
  }

  async function askShowrunner() {
    if (!srInput.trim() || busy) return;
    const directive = srInput.trim();
    setSrInput('');
    setBusy(true);
    try {
      const res = await requestDiveShowrunner({
        scene,
        context: buildProjectContextDigest(project),
        directive
      });
      setSrReply(res.reply || '…');
      setSrSceneUpdate(res.sceneUpdate || '');
    } catch {
      setSrReply('쇼러너 호출에 실패했어요. 다시 시도하세요.');
      setSrSceneUpdate('');
    } finally {
      setBusy(false);
    }
  }

  function applySceneUpdate() {
    setScene(srSceneUpdate);
    setSrSceneUpdate('');
    setSrReply(null);
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

      <div className="dx-scene">
        <label className="dx-scene-label">🎬 현재 장면</label>
        <textarea
          className="dx-scene-input"
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          placeholder="장소·상황·내 목적을 적어 장면을 깔아보세요 (비우면 일상 대화)"
          rows={2}
        />
        <button className="dx-sr-toggle" onClick={() => setSrOpen((v) => !v)}>🪄 쇼러너</button>
      </div>

      {srOpen && (
        <div className="dx-showrunner-sheet">
          {srReply && <div className="dx-showrunner">{srReply}</div>}
          {srSceneUpdate && (
            <div className="dx-sr-update">
              <p className="dx-sr-update-text">현재 장면을 이렇게 바꿀까요? — {srSceneUpdate}</p>
              <button onClick={applySceneUpdate}>장면 교체</button>
              <button onClick={() => setSrSceneUpdate('')}>취소</button>
            </div>
          )}
          <div className="dx-sr-compose">
            <input
              className="dx-input"
              value={srInput}
              onChange={(e) => setSrInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); askShowrunner(); } }}
              placeholder="쇼러너에게 지시 (예: 비를 내려줘 · 도윤 엄마를 의심하게)"
              disabled={busy}
            />
            <button className="dx-send" onClick={askShowrunner} disabled={busy}>지시</button>
            <span className="dx-sr-cost">· 포인트(추후)</span>
          </div>
        </div>
      )}

      <div className="dx-chronicle">
        {project.chapters.map((ch) => (
          <article key={ch.id} className="dx-chapter">
            <h4>{ch.episode}화 「{ch.title}」</h4>
            <p>{ch.prose}</p>
          </article>
        ))}
      </div>

      <div className="dx-chat">
        {session.chatBuffer.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="dx-bubble dx-user">{renderDialogue(m.text)}</div>
          ) : (
            <div key={m.id} className="dx-turn">
              {parseSceneSegments(m.text).map((seg, i) =>
                seg.kind === 'narration' ? (
                  <div key={i} className="dx-narration">{renderDialogue(seg.text)}</div>
                ) : (
                  <div key={i} className="dx-bubble dx-character">
                    <span className="dx-speaker">{seg.speaker}</span>
                    {renderDialogue(seg.text)}
                  </div>
                )
              )}
            </div>
          )
        )}
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

      {busy && (
        <div className="dx-status">
          {condensing ? '이야기를 한 회차로 응결하는 중… 수십 초 걸릴 수 있어요.' : `${charName} 입력 중…`}
        </div>
      )}

      <div className="dx-composer">
        <textarea
          className="dx-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="말을 걸어보세요 (Enter 전송 · Shift+Enter 줄바꿈)"
          disabled={busy || pending !== null}
          rows={1}
        />
        <button className="dx-send" onClick={send} disabled={busy || pending !== null}>보내기</button>
        <button className="dx-condense-manual" onClick={condense} disabled={busy || pending !== null || session.chatBuffer.length <= CONDENSE_KEEP_RECENT}>
          지금 응결
        </button>
      </div>
    </div>
  );
}
