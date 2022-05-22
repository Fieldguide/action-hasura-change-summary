import * as core from '@actions/core'
import * as jsondiffpatch from 'jsondiffpatch'

import {
  DiffOptions,
  TableEntry,
  TableEntryChange,
  TableEntryChanges
} from '../types'
import {
  changeFromQualifiedTable,
  formatTableEntryChange,
  hashFromTable,
  tableEntryPredicate
} from './table'
import {diffTablePermissions, emptyTablePermissionsChanges} from './permissions'
import {emptyChanges, isAddition, isDeletion, isTableEntry} from '../functions'

import {forEach} from 'lodash'

const tableEntryDiffPatcher = jsondiffpatch.create({
  objectHash(object: unknown, index: number) {
    if (isTableEntry(object)) {
      return hashFromTable(object.table)
    }

    return `index:${index}`
  }
})

/**
 * Compute changes between table entries.
 */
export function diffTableEntries(
  oldTables: TableEntry[],
  newTables: TableEntry[],
  options: DiffOptions = {}
): TableEntryChanges {
  const tablesDelta = tableEntryDiffPatcher.diff(oldTables, newTables)
  const changes = emptyChanges<TableEntryChange>()

  if (undefined === tablesDelta) {
    return changes
  }

  forEach(tablesDelta, (delta: unknown, index: string) => {
    const tableIndex = Number(index)

    if (isAddition<TableEntry>(delta)) {
      const tableEntry = delta[0]
      const {table} = tableEntry

      core.info(`+ ${table.schema}.${table.name}`)
      changes.added.push({
        ...diffTablePermissions({table}, tableEntry),
        table: changeFromQualifiedTable(table, options)
      })
    } else if (isDeletion<TableEntry>(delta)) {
      const table = delta[0].table

      core.info(`- ${table.schema}.${table.name}`)
      changes.deleted.push({
        ...emptyTablePermissionsChanges(),
        table: changeFromQualifiedTable(table, {})
      })
    } else if (isFinite(tableIndex)) {
      const newTableEntry = newTables[tableIndex]
      const {table} = newTableEntry
      const oldTableEntry = oldTables.find(tableEntryPredicate(table))

      if (!oldTableEntry) {
        throw new Error(
          `Error finding old table entry ${table.schema}.${table.name} at new index ${tableIndex}`
        )
      }

      core.info(`+/- ${table.schema}.${table.name}`)
      changes.modified.push({
        ...diffTablePermissions(oldTableEntry, newTableEntry),
        table: changeFromQualifiedTable(table, options)
      })
    }
  })

  return changes
}

export function formatTableEntries(changes: TableEntryChanges): string {
  core.info('Formatting table changes')

  return (
    formatTableEntryChange('Tracked Tables', changes.added) +
    formatTableEntryChange('Updated Tables', changes.modified) +
    formatTableEntryChange('Untracked Tables', changes.deleted)
  ).trim()
}
