import {QualifiedTable, TableEntry} from '@hasura/metadata'
import {isArray, isObject, isString} from 'lodash'

export type TableChangeType = 'tracked' | 'untracked' | 'updated'

export interface TableChange extends QualifiedTable {
  consoleUrl?: string
}

export type TableChanges = Record<TableChangeType, TableChange[]>

export interface Changes {
  tables: TableChanges
}

export type DeltaAddition<T> = [T]

export type DeltaDeletion<T> = [T, 0, 0]

export type DeltaModificationConventional<T> = [T, T]

/** @see https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md */
export type Delta<T> =
  | DeltaAddition<T>
  | DeltaDeletion<T>
  | DeltaModificationConventional<T>

export function isTableEntry(object: any): object is TableEntry {
  return (
    isObject(object.table) &&
    isString(object.table.schema) &&
    isString(object.table.name)
  )
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

export interface DiffOptions {
  /** Hasura GraphQL engine http(s) endpoint, used for deep console links */
  hasuraEndpoint?: string
}
