import * as core from '@actions/core'

import {
  ChangeType,
  ChangeTypes,
  PermissionEntry,
  TablePermission,
  TablePermissionColumn,
  TablePermissionColumnChange,
  TablePermissionColumnChanges,
  TablePermissionColumns,
  TablePermissions,
  TablePermissionsChanges
} from '../../types'
import {
  ColumnChangeCount,
  ColumnPermissionChange,
  ColumnPermissionChangeCell,
  PermissionColumnChanges
} from './types'
import {assertNeverChangeType, iconFromChangeType} from '../utils'
import {compact, isArray, isEqual, isString} from 'lodash'
import {compareStrings, tableHeadingFromPermission} from './functions'
import {
  isDeletePermissionEntry,
  isSelectPermissionEntry,
  tab
} from '../../functions'

/**
 * Compute changes between insert, select, or update table column permissions.
 */
export function diffColumnPermissions(
  oldColumns: TablePermissionColumns,
  newColumns: TablePermissionColumns,
  tabLevel: number
): TablePermissionColumnChanges {
  if (isString(oldColumns) || isString(newColumns)) {
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

  if (isString(entry.permission.columns)) {
    return entry.permission.columns
  }

  return entry.permission.columns.map<TablePermissionColumn>(name => ({
    name,
    isComputed: false
  }))
}

/**
 * Return the mustache `COLUMN_PERMISSIONS_TEMPLATE` view data.
 */
export function columnPermissionsViewFromTableChanges(
  tablePermissions: TablePermissionsChanges
): null | Record<string, unknown> {
  /** changed columns, mapped by permission operator, and role */
  const roleColumnChangesMap = new Map<
    string,
    Partial<PermissionColumnChanges>
  >()

  const columnChangeCount: ColumnChangeCount = {value: 0, isLowerBound: false}
  const changeTypes = new Set<ChangeType>()

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
        changeTypes.add(type)
      }
    } else if (columns) {
      columnChangeCount.isLowerBound = true
      changeTypes.add('modified')
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
    summary: viewSummaryFromChanges(columnChangeCount, changeTypes),
    table: {
      headRow: ['', ...tablePermissionKeys.map(tableHeadingFromPermission)],
      body
    }
  }
}

export function* columnChangeIterator(
  tablePermissions: TablePermissionsChanges
): Generator<ColumnPermissionChange> {
  for (const permission of TablePermissions) {
    for (const changeType of ChangeTypes) {
      for (const {role, columns} of tablePermissions[permission][changeType]) {
        yield {
          permission,
          role,
          columns
        }
      }
    }
  }
}

export function viewSummaryFromChanges(
  changeCount: ColumnChangeCount,
  changeTypes: Set<ChangeType>
): string {
  const count =
    String(changeCount.value || 1) + (changeCount.isLowerBound ? '+' : '')

  const verb = viewSummaryVerbFromChangeTypes(changeTypes)

  return `${count} ${verb} column permissions`
}

export function viewSummaryVerbFromChangeTypes(
  changeTypes: Set<ChangeType>
): string {
  if (1 !== changeTypes.size) {
    return 'updated'
  }

  const changeType = changeTypes.values().next().value as ChangeType

  switch (changeType) {
    case 'added':
      return 'added'
    case 'modified':
      return 'updated'
    case 'deleted':
      return 'removed'
    default:
      return assertNeverChangeType(changeType)
  }
}

export function tableCellFromColumnChanges(
  columnChanges: TablePermissionColumnChanges,
  rowspan: boolean
): ColumnPermissionChangeCell {
  if (true === columnChanges) {
    return {content: iconFromChangeType('modified'), rowspan}
  }

  const content = columnChanges.map(contentFromColumnChange).join('<br />')

  return {content, rowspan}
}

export function contentFromColumnChange({
  name,
  isComputed,
  type
}: TablePermissionColumnChange): string {
  const icon = iconFromChangeType(type)

  if (isComputed) {
    name = `<em>${name}</em>`
  }

  switch (type) {
    case 'added':
      return `${icon}&nbsp;${name}`
    case 'deleted':
      return `${icon}&nbsp;<del>${name}</del>`
    default:
      assertNeverChangeType(type)
  }
}

/**
 * Determine if the `permission` column changes are equivalent across roles.
 */
export function isPermissionConsistentAcrossRoles(
  roleColumnChangesMap: Map<string, Partial<PermissionColumnChanges>>,
  permission: TablePermission
): boolean {
  let firstColumnChanges: TablePermissionColumnChanges | undefined

  for (const columnChanges of roleColumnChangesMap.values()) {
    if (!firstColumnChanges) {
      firstColumnChanges = columnChanges[permission]
    } else if (!isEqual(firstColumnChanges, columnChanges[permission])) {
      return false
    }
  }

  return undefined !== firstColumnChanges
}
