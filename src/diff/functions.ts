import * as Mustache from 'mustache'

import {
  ChangeType,
  DeltaAddition,
  DeltaDeletion,
  DeltaModificationConventional,
  PermissionEntry,
  TableEntry
} from './types'
import {isArray, isObject, isString} from 'lodash'

import {DeletePermissionEntry} from '@hasura/metadata'
import {HasuraMetadataLatest} from '../load/types'
import prettier from 'prettier'

export function isTableEntry(object: any): object is TableEntry {
  return (
    isObject(object.table) &&
    isString(object.table.schema) &&
    isString(object.table.name)
  )
}

export function isPermissionEntry(object: any): object is PermissionEntry {
  return isString(object.role)
}

export function isDeletePermissionEntry(
  object: PermissionEntry
): object is DeletePermissionEntry {
  return !(object.permission as any).columns
}

export function isAddition<T>(delta: any): delta is DeltaAddition<T> {
  return isArray(delta) && 1 === delta.length
}

export function isDeletion<T>(delta: any): delta is DeltaDeletion<T> {
  return (
    isArray(delta) && 3 === delta.length && 0 === delta[1] && 0 === delta[2]
  )
}

export function isConventionalModification<T>(
  delta: any
): delta is DeltaModificationConventional<T> {
  return isArray(delta) && 2 === delta.length
}

export function emptyChanges<T>(): Record<ChangeType, T[]> {
  return {
    added: [],
    modified: [],
    deleted: []
  }
}

export function renderTemplate(
  template: string,
  view: any,
  partials: Record<string, string> = {}
): string {
  return prettier.format(Mustache.render(template, view, partials), {
    parser: 'html'
  })
}

export function tab(message: string, level = 0): string {
  return '  '.repeat(1 + level) + message
}

export function tablesFromMetadata(
  metadata: HasuraMetadataLatest,
  qualifyTableEntries: boolean
): TableEntry[] {
  return metadata.databases.reduce<TableEntry[]>((tables, database) => {
    return [
      ...tables,
      ...database.tables.map<TableEntry>(tableEntry => {
        return qualifyTableEntries
          ? qualifyTableEntry(tableEntry, database.name)
          : tableEntry
      })
    ]
  }, [])
}

export function qualifyTableEntry(
  tableEntry: TableEntry,
  database: string
): TableEntry {
  return {
    ...tableEntry,
    table: {...tableEntry.table, database}
  }
}
