import * as core from '@actions/core'
import * as jsondiffpatch from 'jsondiffpatch'

import {
  ChangeType,
  ChangeTypes,
  PermissionEntry,
  TableEntry,
  TablePermissionChange,
  TablePermissionChanges,
  TablePermissions,
  TablePermissionsChanges
} from '../../types'
import {
  columnPermissionsViewFromTableChanges,
  columnsFromPermissionEntry,
  diffColumnPermissions
} from './columns'
import {
  emptyChanges,
  isAddition,
  isDeletePermissionEntry,
  isDeletion,
  isPermissionEntry,
  tab
} from '../../functions'
import {forEach, isArray} from 'lodash'
import {
  hashFromPermission,
  permissionEntryPredicate,
  sortStrings,
  tableHeadingFromPermission
} from './functions'

import {PermissionsChangeType} from '../types'
import {iconFromChangeType} from '../utils'

const permissionEntryDiffPatcher = jsondiffpatch.create({
  objectHash(object: unknown, index: number) {
    if (isPermissionEntry(object)) {
      return hashFromPermission(object)
    }

    return `index:${index}`
  }
})

/**
 * Compute changes between insert, select, update, and delete table permissions.
 */
export function diffTablePermissions(
  oldTable: TableEntry,
  newTable: TableEntry
): TablePermissionsChanges {
  return TablePermissions.reduce<TablePermissionsChanges>(
    (changes, permission) => {
      core.info(tab(permission))
      changes[permission] = diffPermissions(
        oldTable[permission] ?? [],
        newTable[permission] ?? [],
        1
      )

      return changes
    },
    emptyTablePermissionsChanges()
  )
}

/**
 * Compute changes between a table operation's permissions.
 *
 * @param oldPermissions set of old permissions per role
 * @param oldPermissions set of new permissions per role
 */
export function diffPermissions(
  oldPermissions: PermissionEntry[],
  newPermissions: PermissionEntry[],
  tabLevel = 0
): TablePermissionChanges {
  const permissionsDelta = permissionEntryDiffPatcher.diff(
    oldPermissions.map(normalizePermissionEntry),
    newPermissions.map(normalizePermissionEntry)
  )
  const changes = emptyChanges<TablePermissionChange>()

  forEach(permissionsDelta, (delta: unknown, index: string) => {
    const permissionIndex = Number(index)

    if (isAddition<PermissionEntry>(delta)) {
      const role = delta[0].role

      core.info(tab(`+ ${role}`, tabLevel))
      changes.added.push({
        role,
        columns: diffColumnPermissions(
          [],
          columnsFromPermissionEntry(delta[0]),
          1 + tabLevel
        )
      })
    } else if (isDeletion<PermissionEntry>(delta)) {
      const role = delta[0].role

      core.info(tab(`- ${role}`, tabLevel))
      changes.deleted.push({
        role,
        columns: diffColumnPermissions(
          columnsFromPermissionEntry(delta[0]),
          [],
          1 + tabLevel
        )
      })
    } else if (isFinite(permissionIndex)) {
      const newPermissionEntry = newPermissions[permissionIndex]
      const {role} = newPermissions[permissionIndex]
      const oldPermissionEntry = oldPermissions.find(
        permissionEntryPredicate(newPermissionEntry)
      )

      if (!oldPermissionEntry) {
        throw new Error(
          `Error finding old "${role}" permission entry at new index ${permissionIndex}`
        )
      }

      core.info(tab(`+/- ${role}`, tabLevel))
      changes.modified.push({
        role,
        columns: diffColumnPermissions(
          columnsFromPermissionEntry(oldPermissionEntry),
          columnsFromPermissionEntry(newPermissionEntry),
          1 + tabLevel
        )
      })
    }
  })

  return changes
}

export function emptyTablePermissionsChanges(): TablePermissionsChanges {
  return {
    insert_permissions: emptyChanges<TablePermissionChange>(),
    select_permissions: emptyChanges<TablePermissionChange>(),
    update_permissions: emptyChanges<TablePermissionChange>(),
    delete_permissions: emptyChanges<TablePermissionChange>()
  }
}

/**
 * Return the permission `entry` with predictably sorted column names.
 */
export function normalizePermissionEntry(
  entry: PermissionEntry
): PermissionEntry {
  if (isDeletePermissionEntry(entry) || !isArray(entry.permission.columns)) {
    return entry
  }

  return {
    ...entry,
    permission: {
      ...entry.permission,
      columns: sortStrings(entry.permission.columns)
    }
  }
}

/**
 * Return the mustache `PERMISSIONS_TEMPLATE` view data.
 */
export function viewFromTablePermissionChanges(
  tablePermissions: TablePermissionsChanges
): null | Record<string, unknown> {
  /** change type, mapped by permission operation and role */
  const rolePermissionChangesMap = TablePermissions.reduce<
    Map<string, Partial<PermissionsChangeType>>
  >((map, permission) => {
    for (const changeType of ChangeTypes) {
      for (const change of tablePermissions[permission][changeType]) {
        map.set(change.role, {
          ...map.get(change.role),
          [permission]: changeType
        })
      }
    }

    return map
  }, new Map())

  if (!rolePermissionChangesMap.size) {
    return null
  }

  return {
    table: {
      headRow: ['', ...TablePermissions.map(tableHeadingFromPermission)],
      body: Array.from(rolePermissionChangesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([role, permissionChanges]) => ({
          role,
          cells: TablePermissions.map(permission => {
            return tableCellFromChangeType(permissionChanges[permission])
          })
        }))
    },
    columnPermissions: columnPermissionsViewFromTableChanges(tablePermissions)
  }
}

/**
 * Return `<td>` content illustrating permission `changeType`.
 */
export function tableCellFromChangeType(changeType?: ChangeType): string {
  return changeType ? iconFromChangeType(changeType) : ''
}
