// 평가 반영 품질 게이트 카드
import { ClipboardCheck } from 'lucide-react';
import type { TesterDrivenWorkflow } from '../lib/evaluationSynthesis';

export function EvaluatorQualityCard({ workflow }: { workflow: TesterDrivenWorkflow }) {
  return (
    <section className="sx-panel sx-evaluator-card" aria-label="평가 반영 품질 게이트">
      <div className="sx-panel-heading">
        <ClipboardCheck size={16} />
        <h2>품질 게이트</h2>
      </div>
      <p>{workflow.activationMetric}</p>
      <div className="sx-evaluator-gates">
        {workflow.qualityGateIds.map((gate) => (
          <span key={gate}>{gate}</span>
        ))}
      </div>
      <ol>
        {workflow.steps.slice(0, 4).map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <small>{step.owner}</small>
          </li>
        ))}
      </ol>
      <small>{workflow.approvalRule}</small>
    </section>
  );
}
