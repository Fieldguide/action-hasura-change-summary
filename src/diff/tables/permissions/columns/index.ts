import * as core from '@actions/core'

import {
  ChangeType,
  PermissionEntry,
  TablePermission,
  TablePermissionColumn,
  TablePermissionColumnChange,
  TablePermissionColumnChanges,
  TablePermissionColumns,
  TablePermissions,
  TablePermissionsChanges
} from '../../../types'
import {ColumnChangeCount, PermissionColumnChanges} from './types'
import {
  columnChangeIterator,
  isPermissionConsistentAcrossRoles,
  tableCellFromColumnChanges,
  viewSummaryFromChanges
} from './functions'
import {compact, isArray} from 'lodash'
import {compareStrings, tableHeadingFromPermission} from '../functions'
import {
  isDeletePermissionEntry,
  isSelectPermissionEntry,
  tab
} from '../../../functions'

/**
 * Return normalized columns and computed fields from the specified permission `entry`.
 */
export function columnsFromPermissionEntry(
  entry: PermissionEntry
): TablePermissionColumns {
  if (
    isSelectPermissionEntry(entry) &&
    isArray(entry.permission.columns) &&
    entry.permission.computed_fields
  ) {
    return [
      ...entry.permission.columns.map<TablePermissionColumn>(name => ({
        name,
        isComputed: false
      })),
      ...entry.permission.computed_fields.map<TablePermissionColumn>(name => ({
        name,
        isComputed: true
      }))
    ]
  }

  if (isDeletePermissionEntry(entry)) {
    // this type predicate narrowing must exist _after_ isSelectPermissionEntry given that
    // SelectPermissionEntry and UpdatePermissionEntry effectively extend DeletePermissionEntry,
    // and TypeScript does not yet have the concept of "exact" types
    return []
  }

  if (!isArray(entry.permission.columns)) {
    return entry.permission.columns
  }

  return entry.permission.columns.map<TablePermissionColumn>(name => ({
    name,
    isComputed: false
  }))
}

/**
 * Compute changes between insert, select, or update table column permissions.
 */
export function diffColumnPermissions(
  oldColumns: TablePermissionColumns,
  newColumns: TablePermissionColumns,
  tabLevel: number
): TablePermissionColumnChanges {
  if (!isArray(oldColumns) || !isArray(newColumns)) {
    if (oldColumns === newColumns) {
      return []
    }

    core.info(
      tab(
        `+/- columns: ${JSON.stringify(oldColumns)} -> ${JSON.stringify(
          newColumns
        )}`,
        tabLevel
      )
    )

    return true
  }

  /** column changes, mapped by name */
  const columnChangeHash = oldColumns.reduce<
    Map<string, TablePermissionColumnChange>
  >((map, oldColumn) => {
    return map.set(oldColumn.name, {...oldColumn, type: 'deleted'})
  }, new Map())

  for (const newColumn of newColumns) {
    if (!columnChangeHash.delete(newColumn.name)) {
      columnChangeHash.set(newColumn.name, {...newColumn, type: 'added'})
    }
  }

  if (columnChangeHash.size) {
    core.info(tab(`+/- ${columnChangeHash.size} columns`, tabLevel))
  }

  return Array.from(columnChangeHash.values()).sort((a, b) => {
    return compareStrings(a.name, b.name)
  })
}

/**
 * Return the mustache `COLUMN_PERMISSIONS_TEMPLATE` view data.
 */
export function columnPermissionsViewFromTableChanges(
  tablePermissions: TablePermissionsChanges
): null | Record<string, unknown> {
  /** changed columns, mapped by permission operator and role */
  const roleColumnChangesMap = new Map<
    string,
    Partial<PermissionColumnChanges>
  >()

  const columnChangeCount: ColumnChangeCount = {value: 0, isLowerBound: false}
  const columnChangeTypes = new Set<ChangeType>()

  for (const {permission, role, columns} of columnChangeIterator(
    tablePermissions
  )) {
    roleColumnChangesMap.set(role, {
      ...roleColumnChangesMap.get(role),
      [permission]: columns
    })

    if (isArray(columns)) {
      columnChangeCount.value += columns.length

      for (const {type} of columns) {
        columnChangeTypes.add(type)
      }
    } else {
      columnChangeCount.isLowerBound = true
      columnChangeTypes.add('modified')
    }
  }

  if (!roleColumnChangesMap.size) {
    return null
  }

  const permissionIsConsistentAcrossRolesMap = TablePermissions.reduce<
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

  /** table rows per role */
  const body = Array.from(roleColumnChangesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([role, permissionChanges], rowIndex) => ({
      role,
      cells: compact(
        tablePermissionKeys.map(permission => {
          const isConsistentAcrossRoles =
            permissionIsConsistentAcrossRolesMap.get(permission) ?? false

          if (isConsistentAcrossRoles && rowIndex > 0) {
            return null // leverage previous role rowspan
          }

          return tableCellFromColumnChanges(
            permissionChanges[permission] ?? [],
            isConsistentAcrossRoles
          )
        })
      )
    }))

  return {
    summary: viewSummaryFromChanges(columnChangeCount, columnChangeTypes),
    table: {
      headRow: ['', ...tablePermissionKeys.map(tableHeadingFromPermission)],
      body
    }
  }
}
