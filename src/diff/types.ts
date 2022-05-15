import {
  Columns,
  DeletePermissionEntry,
  InsertPermissionEntry,
  QualifiedTable as QualifiedTableBase,
  SelectPermissionEntry,
  TableEntry as TableEntryBase,
  UpdatePermissionEntry
} from '@hasura/metadata'

/* #region metadata */
export interface QualifiedTable extends QualifiedTableBase {
  database?: string
}

export interface TableEntry extends TableEntryBase {
  table: QualifiedTable
}
/* #endregion */

/* #region changes */
export const ChangeTypes = ['added', 'modified', 'deleted'] as const

export type ChangeType = typeof ChangeTypes[number]

export interface ConsoleLink {
  console: {
    href: string
  }
}

/**
 * Resembles Hypertext Application Language (HAL)
 *
 * @see https://stateless.group/hal_specification.html
 */
export interface LinkableChange {
  _links?: ConsoleLink
}

export const TablePermissions = [
  'insert_permissions',
  'select_permissions',
  'update_permissions',
  'delete_permissions'
] as const

export type TablePermission = typeof TablePermissions[number]

export type TablePermissionColumn = string[] | Columns

export interface TablePermissionColumnsChanges {
  added: string[]
  modified: boolean
  deleted: string[]
}

export interface TablePermissionChange {
  role: string
  columns: TablePermissionColumnsChanges
}

export type TablePermissionChanges = Record<ChangeType, TablePermissionChange[]>

export type TablePermissionsChanges = Record<
  TablePermission,
  TablePermissionChanges
>

export type TableChange = QualifiedTable & LinkableChange

export interface TableEntryChange extends TablePermissionsChanges {
  table: TableChange
}

export type TableEntryChanges = Record<ChangeType, TableEntryChange[]>

export type VersionChange = 3 | undefined

export interface Changes {
  version: VersionChange
  tables: TableEntryChanges
}
/* #endregion */

export type PermissionEntry =
  | InsertPermissionEntry
  | SelectPermissionEntry
  | UpdatePermissionEntry
  | DeletePermissionEntry

/* #region jsondiffpatch */
export type DeltaAddition<T> = [T]

export type DeltaDeletion<T> = [T, 0, 0]

export type DeltaModificationConventional<T> = [T, T]

/** @see https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md */
export type Delta<T> =
  | DeltaAddition<T>
  | DeltaDeletion<T>
  | DeltaModificationConventional<T>
/* #endregion */

export interface DiffOptions {
  /** Hasura GraphQL engine http(s) endpoint, used for deep console links */
  hasuraEndpoint?: string
}
