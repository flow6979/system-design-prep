// The user's own topic lists ("Amazon round", "Weak topics"): saved in the profile, so they follow the login
import { useCallback } from 'react'
import type { PlanInput } from './plan'
import { useStore, type TopicList } from './store'

export function useLists() {
  const { profile, saveProfile } = useStore()
  const lists = profile.lists ?? []

  const write = useCallback((next: TopicList[]) => saveProfile({ ...profile, lists: next }).catch(() => {}), [profile, saveProfile])

  const create = (name: string, slugs: string[] = []): TopicList => {
    const list = { id: Date.now().toString(36), name: name.trim() || 'My list', slugs }
    write([...lists, list])
    return list
  }
  const update = (id: string, change: Partial<TopicList>) => write(lists.map((l) => (l.id === id ? { ...l, ...change } : l)))
  const remove = (id: string) => {
    const next = lists.filter((l) => l.id !== id)
    // A plan built from a deleted list falls back to the subject tracks
    const plan = profile.plan?.list === id ? { ...profile.plan, list: undefined } : profile.plan
    saveProfile({ ...profile, lists: next, plan }).catch(() => {})
  }
  const toggle = (id: string, slug: string) => {
    const list = lists.find((l) => l.id === id)
    if (!list) return
    update(id, { slugs: list.slugs.includes(slug) ? list.slugs.filter((s) => s !== slug) : [...list.slugs, slug] })
  }

  return { lists, create, update, remove, toggle }
}

/** Fills in the pages of the chosen list so buildPlan can use them */
export function withListPages(input: PlanInput, lists: TopicList[]): PlanInput {
  const list = input.list ? lists.find((l) => l.id === input.list) : undefined
  return list ? { ...input, only: list.slugs } : { ...input, list: undefined, only: undefined }
}
