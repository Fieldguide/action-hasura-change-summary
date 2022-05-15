import * as core from '@actions/core'

import {
  ChangeType,
  ChangeTypes,
  PermissionEntry,
  TablePermission,
  TablePermissionColumn,
  TablePermissionColumnsChanges,
  TablePermissions,
  TablePermissionsChanges
} from '../../types'
import {
  ColumnChangeType,
  ColumnPermissionChange,
  ColumnPermissionChangeCell,
  PermissionColumnChanges
} from './types'
import {assertNeverChangeType, iconFromChangeType} from '../utils'
import {compact, isEqual, isString} from 'lodash'
import {isDeletePermissionEntry, tab} from '../../functions'
import {sortStrings, tableHeadingFromPermission} from './functions'

// TODO: add computed columns for select

/**
 * Compute changes between insert, select, or update table column permissions.
 */
export function diffColumnPermissions(
  oldColumns: TablePermissionColumn,
  newColumns: TablePermissionColumn,
  tabLevel: number
): TablePermissionColumnsChanges {
  if (isString(oldColumns) || isString(newColumns)) {
    if (oldColumns !== newColumns) {
      core.info(
        tab(
          `+/- columns: ${JSON.stringify(oldColumns)} -> ${JSON.stringify(
            newColumns
          )}`,
          tabLevel
        )
      )
    }

    return {
      added: [],
      modified: true,
      deleted: []
    }
  }

  const columnChangeTypeMap = oldColumns.reduce<
    Map<string, 'added' | 'deleted'>
  >((map, oldColumn) => {
    return map.set(oldColumn, 'deleted')
  }, new Map())

  for (const newColumn of newColumns) {
    if (!columnChangeTypeMap.delete(newColumn)) {
      columnChangeTypeMap.set(newColumn, 'added')
    }
  }

  const {added, deleted} = Array.from(columnChangeTypeMap.entries()).reduce<
    Omit<TablePermissionColumnsChanges, 'modified'>
  >(
    (changes, [column, changeType]) => {
      changes[changeType].push(column)

      return changes
    },
    {added: [], deleted: []}
  )

  if (columnChangeTypeMap.size) {
    core.info(tab('+/- columns', tabLevel)) // TODO: split out + and -?
  }

  return {
    added: sortStrings(added),
    modified: Boolean(columnChangeTypeMap.size), // TODO revisit
    deleted: sortStrings(deleted)
  }
}

export function columnsFromPermissionEntry(
  entry: PermissionEntry
): TablePermissionColumn {
  return isDeletePermissionEntry(entry) ? [] : entry.permission.columns
}

export function columnPermissionsViewFromTableChanges(
  tablePermissions: TablePermissionsChanges
): null | Record<string, unknown> {
  let columnChangeCount = 0
  /** change type, mapped by column name, permission operator, and role */
  const roleColumnChangesMap = new Map<
    string,
    Partial<PermissionColumnChanges>
  >()

  for (const {permission, role, column, changeType} of columnChangeIterator(
    tablePermissions
  )) {
    roleColumnChangesMap.set(role, {
      ...roleColumnChangesMap.get(role),
      [permission]: {
        ...roleColumnChangesMap.get(role)?.[permission],
        [column]: changeType
      }
    })
    columnChangeCount++
  }

  if (!roleColumnChangesMap.size) {
    return null
  }

  const isPermissionConsistentAcrossRolesMap = TablePermissions.reduce<
    Map<TablePermission, boolean>
  >((map, permission) => {
    return map.set(
      permission,
      isPermissionConsistentAcrossRoles(roleColumnChangesMap, permission)
    )
  }, new Map())

  const tablePermissionKeys = TablePermissions.filter(
    permission => 'delete_permissions' !== permission
  )

  return {
    summary: `${columnChangeCount} updated column permissions`,
    table: {
      headRow: ['', ...tablePermissionKeys.map(tableHeadingFromPermission)],
      body: Array.from(roleColumnChangesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([role, permissionChanges], index) => ({
          role,
          cells: compact(
            tablePermissionKeys.map(permission => {
              const isConsistentAcrossRoles =
                isPermissionConsistentAcrossRolesMap.get(permission) ?? false

              if (isConsistentAcrossRoles && index > 0) {
                return null
              }

              return tableCellFromColumnChanges(
                permissionChanges[permission],
                isConsistentAcrossRoles
              )
            })
          )
        }))
    }
  }
}

export function* columnChangeIterator(
  tablePermissions: TablePermissionsChanges
): Generator<ColumnPermissionChange> {
  for (const permission of TablePermissions) {
    for (const changeType of ChangeTypes) {
      for (const {role, columns} of tablePermissions[permission][changeType]) {
        for (const column of columns.added) {
          yield {
            permission,
            role,
            column,
            changeType: 'added'
          }
        }

        // TODO modified

        for (const column of columns.deleted) {
          yield {
            permission,
            role,
            column,
            changeType: 'deleted'
          }
        }
      }
    }
  }
}

export function tableCellFromColumnChanges(
  columnChanges: Record<string, ChangeType> | undefined,
  rowspan: boolean
): ColumnPermissionChangeCell {
  if (!columnChanges) {
    return {content: '', rowspan}
  }

  const content = sortStrings(Object.keys(columnChanges))
    .map(column => {
      return columnContentFromChangeType(column, columnChanges[column])
    })
    .join('<br />')

  return {content, rowspan}
}

export function columnContentFromChangeType(
  column: string,
  changeType: ChangeType
): string {
  const icon = iconFromChangeType(changeType)

  switch (changeType) {
    case 'added':
    case 'modified':
      return `${icon} ${column}`
    case 'deleted':
      return `${icon} <del>${column}</del>`
    default:
      assertNeverChangeType(changeType)
  }
}

export function isPermissionConsistentAcrossRoles(
  roleColumnChangesMap: Map<string, Partial<PermissionColumnChanges>>,
  permission: TablePermission
): boolean {
  let firstColumnChanges: ColumnChangeType | undefined

  for (const columnChanges of roleColumnChangesMap.values()) {
    if (!firstColumnChanges) {
      firstColumnChanges = columnChanges[permission]
    } else if (!isEqual(firstColumnChanges, columnChanges[permission])) {
      return false
    }
  }

  return undefined !== firstColumnChanges
}
