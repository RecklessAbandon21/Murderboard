import { Task } from './models/Task.js'

export async function runMigrations() {
  // Drop legacy single-field index if it exists
  const collection = Task.collection
  try {
    await collection.dropIndex('taskId_1')
  } catch (error) {
    const codeName = typeof error === 'object' && error && 'codeName' in error ? error.codeName : null
    if (codeName !== 'IndexNotFound' && codeName !== 'NamespaceNotFound') {
      throw error
    }
  }

  await Task.syncIndexes()
}
