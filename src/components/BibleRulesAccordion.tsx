// 바이블 규칙 아코디언
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SeriesProject } from '../lib/storyEngine';

export function BibleRulesAccordion({ sections }: { sections: SeriesProject['bibleOutline'] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (sections.length === 0) {
    return <p className="ex-beats-empty">바이블 규칙이 아직 비어 있습니다.</p>;
  }

  return (
    <div className="ex-bible-rules">
      {sections.map((section) => {
        const isOpen = openId === section.id;

        return (
          <div key={section.id} className={`ex-bible-rule ${isOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="ex-bible-rule-head"
              aria-expanded={isOpen}
              onClick={() => setOpenId((current) => (current === section.id ? null : section.id))}
            >
              <span className="ex-bible-rule-title">{section.title}</span>
              <ChevronDown size={13} className="ex-bible-rule-caret" aria-hidden="true" />
            </button>
            {isOpen && <p className="ex-bible-rule-body">{section.body}</p>}
          </div>
        );
      })}
    </div>
  );
}
