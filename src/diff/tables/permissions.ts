import * as core from '@actions/core'
import * as jsondiffpatch from 'jsondiffpatch'

import {
  ChangeType,
  ChangeTypes,
  PermissionEntry,
  TableEntry,
  TablePermission,
  TablePermissionChange,
  TablePermissionChanges,
  TablePermissions,
  TablePermissionsChanges
} from '../types'
import {
  emptyChanges,
  isAddition,
  isDeletePermissionEntry,
  isDeletion,
  isPermissionEntry,
  tab
} from '../functions'
import {forEach, isArray} from 'lodash'

import {PermissionsChangeType} from './types'
import {iconFromChangeType} from './utils'

const diffPatcher = jsondiffpatch.create({
  objectHash(object: unknown, index: number) {
    if (isPermissionEntry(object)) {
      return `permission:${object.role}`
    }

    return `index:${index}`
  }
})

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

export function diffPermissions(
  oldPermissions: PermissionEntry[],
  newPermissions: PermissionEntry[],
  tabLevel?: number
): TablePermissionChanges {
  const permissionsDelta = diffPatcher.diff(
    oldPermissions.map(normalizePermissionEntry),
    newPermissions.map(normalizePermissionEntry)
  )
  const changes = emptyChanges<TablePermissionChange>()

  forEach(permissionsDelta, (delta: unknown, index: string) => {
    const permissionIndex = Number(index)

    if (isAddition<PermissionEntry>(delta)) {
      const role = delta[0].role

      core.info(tab(`+ ${role}`, tabLevel))
      changes.added.push({role})
    } else if (isDeletion<PermissionEntry>(delta)) {
      const role = delta[0].role

      core.info(tab(`- ${role}`, tabLevel))
      changes.deleted.push({role})
    } else if (isFinite(permissionIndex)) {
      const role = newPermissions[permissionIndex].role

      core.info(tab(`+/- ${role}`, tabLevel))
      changes.modified.push({role})
    }
  })

  return changes
}

export function permissionsFromTableEntry({
  insert_permissions,
  select_permissions,
  update_permissions,
  delete_permissions
}: TableEntry): Partial<TableEntry> {
  return {
    insert_permissions,
    select_permissions,
    update_permissions,
    delete_permissions
  }
}

export function emptyTablePermissionsChanges(): TablePermissionsChanges {
  return {
    insert_permissions: emptyChanges<TablePermissionChange>(),
    select_permissions: emptyChanges<TablePermissionChange>(),
    update_permissions: emptyChanges<TablePermissionChange>(),
    delete_permissions: emptyChanges<TablePermissionChange>()
  }
}

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
      columns: entry.permission.columns.sort((a, b) => a.localeCompare(b))
    }
  }
}

export function viewFromTablePermissionChanges(
  tablePermissions: TablePermissionsChanges
): null | Record<string, unknown> {
  const rolePermissionChangesMap = TablePermissions.reduce<
    Record<string, Partial<PermissionsChangeType>>
  >((map, permission) => {
    for (const changeType of ChangeTypes) {
      for (const change of tablePermissions[permission][changeType]) {
        if (undefined === map[change.role]) {
          map[change.role] = {}
        }

        map[change.role][permission] = changeType
      }
    }

    return map
  }, {})

  if (0 === Object.keys(rolePermissionChangesMap).length) {
    return null
  }

  return {
    headRow: ['', ...TablePermissions.map(tableHeadingFromPermission)],
    body: Object.entries(rolePermissionChangesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([role, permissionChanges]) => ({
        role,
        cells: TablePermissions.map(permission =>
          tableCellFromChangeType(permissionChanges[permission])
        )
      }))
  }
}

export function tableHeadingFromPermission(
  permission: TablePermission
): string {
  return permission.split('_')[0]
}

export function tableCellFromChangeType(changeType?: ChangeType): string {
  return changeType ? iconFromChangeType(changeType) : ''
}
