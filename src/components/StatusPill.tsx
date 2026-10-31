import { STATUS_LABEL } from '../data/labels.ts'

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="status-pill" data-status={status}>
      <span className="status-dot" data-status={status} />
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
