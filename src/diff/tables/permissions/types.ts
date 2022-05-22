import {TablePermission, TablePermissionColumnChanges} from '../../types'

export type PermissionColumnChanges = Record<
  TablePermission,
  TablePermissionColumnChanges
>

export interface ColumnPermissionChange {
  permission: TablePermission
  role: string
  columns: TablePermissionColumnChanges
}

export interface ColumnPermissionChangeCell {
  rowspan: boolean
  content: string
}

export interface ColumnChangeCount {
  value: number
  isLowerBound: boolean
}
