import * as core from '@actions/core'
import {TableEntry} from '@hasura/metadata'
import * as jsondiffpatch from 'jsondiffpatch'
import {forEach} from 'lodash'
import {emptyChanges, isAddition, isDeletion, isTableEntry} from '../functions'
import {DiffOptions, TableEntryChange, TableEntryChanges} from '../types'
import {diffTablePermissions, emptyTablePermissionsChanges} from './permissions'
import {changeFromQualifiedTable, formatTableEntryChange} from './table'

const diffPatcher = jsondiffpatch.create({
  objectHash(object: any, index: number) {
    if (isTableEntry(object)) {
      return `table:${object.table.schema}:${object.table.name}`
    }

    return `index:${index}`
  }
})

export function diffTableEntries(
  oldTables: TableEntry[],
  newTables: TableEntry[],
  options: DiffOptions = {}
): TableEntryChanges {
  core.info('Diffing table metadata')
  const tablesDelta = diffPatcher.diff(oldTables, newTables)
  const changes = emptyChanges<TableEntryChange>()

  if (undefined === tablesDelta) {
    return changes
  }

  forEach(tablesDelta, (delta: any, index: string) => {
    const tableIndex = Number(index)

    if (isAddition<TableEntry>(delta)) {
      const table = delta[0].table

      core.info(`+ ${table.schema}.${table.name}`)
      changes.added.push({
        ...emptyTablePermissionsChanges(),
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

      core.startGroup(`+/- ${table.schema}.${table.name}`)
      changes.modified.push({
        ...diffTablePermissions(
          oldTables[tableIndex], // TODO: vet old index
          newTableEntry
        ),
        table: changeFromQualifiedTable(table, options)
      })
      core.endGroup()
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
