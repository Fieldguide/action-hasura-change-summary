import * as core from '@actions/core'
import {QualifiedTable, TableEntry} from '@hasura/metadata'
import * as jsondiffpatch from 'jsondiffpatch'
import {forEach} from 'lodash'
import urlcat from 'urlcat'
import {
  DiffOptions,
  isAddition,
  isDeletion,
  isTableEntry,
  TableChange,
  TableChanges
} from './types'

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
  newTables: TableEntry[],
  options: DiffOptions = {}
): TableChanges {
  core.info('Diffing table metadata')
  const tablesDelta = diffPatcher.diff(oldTables, newTables)
  const changes: TableChanges = {
    tracked: [],
    untracked: [],
    updated: []
  }

  if (undefined === tablesDelta) {
    return changes
  }

  forEach(tablesDelta, (delta: any, index: string) => {
    const tableIndex = Number(index)

    core.debug(`Processing delta: ${delta}`)

    if (isAddition<TableEntry>(delta)) {
      changes.tracked.push(changeFromQualifiedTable(delta[0].table, options))
    } else if (isDeletion<TableEntry>(delta)) {
      changes.untracked.push(changeFromQualifiedTable(delta[0].table, {}))
    } else if (isFinite(tableIndex)) {
      changes.updated.push(
        changeFromQualifiedTable(newTables[tableIndex].table, options)
      )
    }
  })

  return changes
}

export function changeFromQualifiedTable(
  {schema, name}: QualifiedTable,
  {hasuraEndpoint}: DiffOptions
): TableChange {
  const change: TableChange = {schema, name}

  if (hasuraEndpoint) {
    change.consoleUrl = urlcat(
      hasuraEndpoint,
      '/console/data/schema/:schema/tables/:name/browse',
      {schema, name}
    )
  }

  return change
}

export function formatTables(changes: TableChanges): string {
  core.info('Formatting table change')

  return (
    formatTableChange('Tracked Tables', changes.tracked) +
    formatTableChange('Updated Tables', changes.updated) +
    formatTableChange('Untracked Tables', changes.untracked)
  ).trim()
}

export function formatTableChange(
  header: string,
  tables: TableChange[]
): string {
  if (0 === tables.length) {
    return ''
  }

  return `### ${header}\n\n${tables
    .map(table => formatQualifiedTable(table))
    .join('\n')}\n\n`
}

export function formatQualifiedTable({
  schema,
  name,
  consoleUrl
}: TableChange): string {
  let table = `\`${schema}.${name}\``

  if (consoleUrl) {
    table = `[${table}](${consoleUrl})`
  }

  return `* ${table}`
}
