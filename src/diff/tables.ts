import * as core from '@actions/core'
import {QualifiedTable, TableEntry} from '@hasura/metadata'
import * as jsondiffpatch from 'jsondiffpatch'
import {forEach} from 'lodash'
import {isAddition, isDeletion, isTableEntry, TableChange} from './types'

const diffPatcher = jsondiffpatch.create({
  objectHash(object: any, index: number) {
    if (isTableEntry(object)) {
      return `table:${object.table.schema}:${object.table.name}`
    }

    return `index:${index}`
  }
})

export function diffTables(
  oldTables: TableEntry[],
  newTables: TableEntry[]
): TableChange {
  core.info('Diffing table metadata')
  const tablesDelta = diffPatcher.diff(oldTables, newTables)
  const change: TableChange = {
    tracked: [],
    untracked: [],
    updated: []
  }

  if (undefined === tablesDelta) {
    return change
  }

  forEach(tablesDelta, (delta: any, index: string) => {
    const tableIndex = Number(index)

    core.debug(`Processing delta: ${delta}`)

    if (isAddition<TableEntry>(delta)) {
      change.tracked.push(delta[0].table)
    } else if (isDeletion<TableEntry>(delta)) {
      change.untracked.push(delta[0].table)
    } else if (isFinite(tableIndex)) {
      change.updated.push(newTables[tableIndex].table)
    }
  })

  return change
}

export function formatTables(change: TableChange): string {
  core.info('Formatting table change')

  return (
    formatTableChange('Tracked Tables', change.tracked) +
    formatTableChange('Updated Tables', change.updated) +
    formatTableChange('Untracked Tables', change.untracked)
  ).trim()
}

export function formatTableChange(
  header: string,
  tables: QualifiedTable[]
): string {
  if (0 === tables.length) {
    return ''
  }

  return `### ${header}\n\n${tables
    .map(table => formatQualifiedTable(table))
    .join('\n')}\n\n`
}

export function formatQualifiedTable(table: QualifiedTable): string {
  return `* \`${table.schema}.${table.name}\``
}
