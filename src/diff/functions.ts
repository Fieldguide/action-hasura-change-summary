import {DeletePermissionEntry, TableEntry} from '@hasura/metadata'
import {isArray, isObject, isString} from 'lodash'
import {
  ChangeType,
  DeltaAddition,
  DeltaDeletion,
  DeltaModificationConventional,
  PermissionEntry
} from './types'

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
