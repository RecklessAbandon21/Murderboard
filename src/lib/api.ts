import type { BoardPayload, BoardSummary, DoneTask } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

let _tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  _tokenGetter = fn
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = _tokenGetter ? await _tokenGetter() : null
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function fetchBoards() {
  return request<{ boards: BoardSummary[] }>('/api/boards')
}

export function createBoard(name?: string) {
  return request<{ board: BoardSummary }>('/api/boards', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function fetchBoard(boardId: string) {
  return request<BoardPayload>(`/api/boards/${encodeURIComponent(boardId)}`)
}

export function saveBoard(boardId: string, snapshot: unknown, doneTasks: DoneTask[]) {
  return request<{ ok: true; updatedAt: string }>(`/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'PUT',
    body: JSON.stringify({ snapshot, doneTasks }),
  })
}

export function renameBoard(boardId: string, name: string) {
  return request<{ board: BoardSummary }>(`/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteBoard(boardId: string) {
  return request<{ ok: true }>(`/api/boards/${encodeURIComponent(boardId)}`, {
    method: 'DELETE',
  })
}

export function fetchDoneTasks(boardId: string) {
  return request<{ tasks: DoneTask[] }>(`/api/boards/${encodeURIComponent(boardId)}/tasks/done`)
}

export function restoreDoneTask(boardId: string, id: string) {
  return request<{ task: DoneTask }>(`/api/boards/${encodeURIComponent(boardId)}/tasks/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
    body: '{}',
  })
}

export function deleteDoneTask(boardId: string, id: string) {
  return request<{ ok: true; id: string; deletedAt: string }>(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/done/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )
}

export function deleteSelectedDoneTasks(boardId: string, ids: string[]) {
  return request<{ ok: true; deletedCount: number }>(
    `/api/boards/${encodeURIComponent(boardId)}/tasks/done/delete-selected`,
    {
      method: 'POST',
      body: JSON.stringify({ ids }),
    },
  )
}

export function deleteAllDoneTasks(boardId: string) {
  return request<{ ok: true; deletedCount: number }>(`/api/boards/${encodeURIComponent(boardId)}/tasks/done`, {
    method: 'DELETE',
  })
}

export function reorderBoards(updates: { id: string; sortOrder: number }[]) {
  return request<{ ok: true }>('/api/boards/reorder', {
    method: 'POST',
    body: JSON.stringify({ boards: updates }),
  })
}

export function getMe() {
  return request<{ hasSeenOnboarding: boolean }>('/api/me')
}

export function updateMe(data: { hasSeenOnboarding: boolean }) {
  return request<{ ok: true }>('/api/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
