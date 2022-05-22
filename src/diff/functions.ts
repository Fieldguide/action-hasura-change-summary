import {
  DeletePermissionEntry,
  InsertPermission,
  SelectPermission,
  SelectPermissionEntry
} from '@hasura/metadata'
import {isArray, isObject, isString} from 'lodash'
import * as Mustache from 'mustache'
import prettier from 'prettier'
import {HasuraMetadataLatest} from '../load/types'
import {
  ChangeType,
  DeltaAddition,
  DeltaDeletion,
  DeltaModificationConventional,
  PermissionEntry,
  TableEntry
} from './types'

export function isTableEntry(object: unknown): object is TableEntry {
  return (
    isObject(object) &&
    isObject((object as TableEntry).table) &&
    isString((object as TableEntry).table.schema) &&
    isString((object as TableEntry).table.name)
  )
}

export function isPermissionEntry(object: unknown): object is PermissionEntry {
  return isObject(object) && isString((object as PermissionEntry).role)
}

export function isSelectPermissionEntry(
  object: PermissionEntry
): object is SelectPermissionEntry {
  return Boolean((object.permission as SelectPermission).computed_fields)
}

export function isDeletePermissionEntry(
  object: PermissionEntry
): object is DeletePermissionEntry {
  return !(object.permission as InsertPermission).columns
}

export function isAddition<T>(delta: unknown): delta is DeltaAddition<T> {
  return isArray(delta) && 1 === delta.length
}

export function isDeletion<T>(delta: unknown): delta is DeltaDeletion<T> {
  return (
    isArray(delta) && 3 === delta.length && 0 === delta[1] && 0 === delta[2]
  )
}

export function isConventionalModification<T>(
  delta: unknown
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
  view: Record<string, unknown>,
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
