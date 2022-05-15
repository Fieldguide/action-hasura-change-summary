import {ChangeType, TablePermission} from '../../types'

export type ColumnChangeType = Record<string, ChangeType>

export type PermissionColumnChanges = Record<TablePermission, ColumnChangeType>

export interface ColumnPermissionChange {
  permission: TablePermission
  role: string
  column: string
  changeType: ChangeType
}

export interface ColumnPermissionChangeCell {
  rowspan: boolean
  content: string
}
