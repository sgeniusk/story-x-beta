// 인물 상세 패널 컴포넌트
import type { CharacterProfile } from '../lib/storyEngine';

// 인물 관계도에서 고른 인물의 상세 — 욕망·상처·현재 상태를 직접 편집한다.
export function CharacterDetailPanel({
  character,
  onUpdateCharacter,
  onRename,
  onRemove
}: {
  character: CharacterProfile;
  onUpdateCharacter: (characterId: string, field: 'desire' | 'wound' | 'currentState', value: string) => void;
  onRename?: (characterId: string, name: string) => void;
  onRemove?: (characterId: string) => void;
}) {
  return (
    <div className="ex-canon-detail">
      <header className="ex-canon-detail-head">
        <span className="ex-canon-detail-type">인물</span>
        {onRename ? (
          <input
            className="ex-canon-detail-name-input"
            value={character.name}
            onChange={(event) => onRename(character.id, event.target.value)}
            aria-label="인물 이름"
          />
        ) : (
          <h3>{character.name}</h3>
        )}
        <span className="ex-canon-detail-sub">{character.role}</span>
      </header>
      <label className="ex-canon-detail-field">
        <small>욕망</small>
        <textarea
          value={character.desire}
          onChange={(event) => onUpdateCharacter(character.id, 'desire', event.target.value)}
          rows={2}
        />
      </label>
      <label className="ex-canon-detail-field">
        <small>상처</small>
        <textarea
          value={character.wound}
          onChange={(event) => onUpdateCharacter(character.id, 'wound', event.target.value)}
          rows={2}
        />
      </label>
      <label className="ex-canon-detail-field">
        <small>현재 상태</small>
        <textarea
          value={character.currentState}
          onChange={(event) => onUpdateCharacter(character.id, 'currentState', event.target.value)}
          rows={3}
        />
      </label>
      {character.canonAnchors.length > 0 && (
        <div className="ex-canon-detail-anchors" aria-label="캐논 앵커">
          {character.canonAnchors.map((anchor) => (
            <em key={anchor}>{anchor}</em>
          ))}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          className="sx-revert-change-button"
          onClick={() => {
            if (window.confirm(`"${character.name}" 인물을 삭제할까요? 되돌릴 수 없습니다.`)) onRemove(character.id);
          }}
        >
          이 인물 삭제
        </button>
      )}
    </div>
  );
}
