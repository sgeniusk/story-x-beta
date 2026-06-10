// paceInterviewClient — normalizePaceQuestions 단위 테스트. 네트워크 의존 함수는 제외.
import { describe, expect, it } from 'vitest';
import { normalizePaceQuestions } from './paceInterviewClient';

describe('normalizePaceQuestions', () => {
  it('정상 형식의 1개 질문 1개 옵션을 그대로 반환한다', () => {
    const raw = [
      {
        question: '윤서문 추적이 어디까지 왔나요?',
        options: [
          { label: '초입', intentSeed: '윤서문 추적은 아직 초입이다.' },
        ],
      },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('llm-pace-1');
    expect(result[0].question).toBe('윤서문 추적이 어디까지 왔나요?');
    expect(result[0].options[0].label).toBe('초입');
    expect(result[0].options[0].intentSeed).toBe('[페이스] 윤서문 추적은 아직 초입이다.');
  });

  it('질문 최대 3개까지만 반환하고 초과분은 버린다', () => {
    const raw = Array.from({ length: 5 }, (_, i) => ({
      question: `질문 ${i + 1}`,
      options: [{ label: '옵션', intentSeed: `시드 ${i + 1}` }],
    }));
    const result = normalizePaceQuestions(raw);
    expect(result.length).toBe(3);
  });

  it('질문당 옵션 최대 3개까지만 반환하고 초과분은 버린다', () => {
    const raw = [
      {
        question: '페이스는?',
        options: Array.from({ length: 5 }, (_, i) => ({
          label: `옵션${i + 1}`,
          intentSeed: `시드${i + 1}`,
        })),
      },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result[0].options.length).toBe(3);
  });

  it('label 이나 intentSeed 가 비어 있는 옵션은 제외한다', () => {
    const raw = [
      {
        question: '전제 능선은?',
        options: [
          { label: '', intentSeed: '유효 시드' },
          { label: '유효', intentSeed: '' },
          { label: '정상', intentSeed: '정상 직전 시드' },
        ],
      },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result[0].options.length).toBe(1);
    expect(result[0].options[0].label).toBe('정상');
  });

  it('오형식(배열이 아닌 입력)이면 빈 배열을 반환한다', () => {
    expect(normalizePaceQuestions(null as unknown as unknown[])).toEqual([]);
    expect(normalizePaceQuestions('invalid' as unknown as unknown[])).toEqual([]);
    expect(normalizePaceQuestions({} as unknown as unknown[])).toEqual([]);
  });

  it('질문 텍스트가 빈 항목은 제외한다', () => {
    const raw = [
      { question: '', options: [{ label: '라벨', intentSeed: '시드' }] },
      { question: '유효한 질문', options: [{ label: '라벨', intentSeed: '시드' }] },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result.length).toBe(1);
    expect(result[0].question).toBe('유효한 질문');
  });

  it('접두 [페이스] 를 intentSeed 에 붙인다', () => {
    const raw = [
      {
        question: '이번 화 페이스?',
        options: [
          { label: '전진', intentSeed: '이번 화에서 한 발 나아간다.' },
        ],
      },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result[0].options[0].intentSeed).toBe('[페이스] 이번 화에서 한 발 나아간다.');
  });

  it('이미 [페이스] 접두가 있으면 중복으로 붙이지 않는다', () => {
    const raw = [
      {
        question: '이번 화?',
        options: [
          { label: '중턱', intentSeed: '[페이스] 이미 붙어 있는 시드.' },
        ],
      },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result[0].options[0].intentSeed).toBe('[페이스] 이미 붙어 있는 시드.');
  });

  it('id 를 llm-pace-1..3 형식으로 부여한다', () => {
    const raw = [
      { question: 'Q1', options: [{ label: 'L', intentSeed: 'S1' }] },
      { question: 'Q2', options: [{ label: 'L', intentSeed: 'S2' }] },
    ];
    const result = normalizePaceQuestions(raw);
    expect(result[0].id).toBe('llm-pace-1');
    expect(result[1].id).toBe('llm-pace-2');
  });
});
