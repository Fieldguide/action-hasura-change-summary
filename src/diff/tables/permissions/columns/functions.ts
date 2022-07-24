import {
  ChangeType,
  ChangeTypes,
  TablePermission,
  TablePermissionColumnChange,
  TablePermissionColumnChanges,
  TablePermissions,
  TablePermissionsChanges
} from '../../../types'
import {assertNeverChangeType, iconFromChangeType} from '../../utils'
import {
  ColumnChangeCount,
  ColumnPermissionChange,
  ColumnPermissionChangeCell,
  PermissionColumnChanges
} from './types'

import {isEqual} from 'lodash'

/**
 * Iterate through `tablePermissions` per role and operation that include column changes.
 */
export function* columnChangeIterator(
  tablePermissions: TablePermissionsChanges
): Generator<ColumnPermissionChange> {
  for (const permission of TablePermissions) {
    for (const changeType of ChangeTypes) {
      for (const {role, columns} of tablePermissions[permission][changeType]) {
        if (true === columns || columns.length) {
          yield {
            permission,
            role,
            columns
          }
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

/**
 * Return HTML table cell content illustrating permission `columnChanges`.
 */
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

/**
 * Return HTML content describing the specified column change.
 */
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
 * Determine if the `permission` column changes are equivalent across all roles.
 */
export function isPermissionConsistentAcrossRoles(
  roleColumnChangesMap: Map<string, Partial<PermissionColumnChanges>>,
  permission: TablePermission
): boolean {
  let firstColumnChanges: TablePermissionColumnChanges | undefined
  /** number of roles with consistent column changes */
  let consistentRoles = 1

  for (const columnChanges of roleColumnChangesMap.values()) {
    if (!firstColumnChanges) {
      firstColumnChanges = columnChanges[permission]
    } else if (isEqual(firstColumnChanges, columnChanges[permission])) {
      consistentRoles++
    } else {
      return false
    }
  }

  return (
    undefined !== firstColumnChanges &&
    roleColumnChangesMap.size === consistentRoles
  )
}
