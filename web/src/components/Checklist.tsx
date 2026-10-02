import type { Page } from '../content'
import { useStore } from '../store'
import { useTr } from '../i18n'

export function Checklist({ page }: { page: Page }) {
  const { progress, toggle } = useStore()
  const tr = useTr()
  if (!page.checklist.length) return null
  const done = page.checklist.filter((i) => progress[i.id]).length

  return (
    <section className="checklist" aria-labelledby="checklist-title">
      <div className="checklist-head">
        <h2 id="checklist-title">Checklist</h2>
        <span className="count">
          {done}/{page.checklist.length}
        </span>
      </div>
      <p className="muted small">
        {tr(
          'Jo bina dekhe bol sakte ho, use tick karo. Ye overall progress me count hota hai.',
          'Tick what you can explain without looking. It counts towards your overall progress.',
        )}
      </p>
      <ul>
        {page.checklist.map((item) => (
          <li key={item.id}>
            <label>
              <input type="checkbox" checked={!!progress[item.id]} onChange={(e) => toggle(item.id, e.target.checked)} />
              <span>{item.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
