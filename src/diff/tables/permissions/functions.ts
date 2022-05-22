import {PermissionEntry, TablePermission} from '../../types'

export function sortStrings(strings: string[]): string[] {
  return [...strings].sort(compareStrings)
}

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b)
}

export function hashFromPermission(permission: PermissionEntry): string {
  return `permission:${permission.role}`
}

export function permissionEntryPredicate(
  permissionEntry: PermissionEntry
): (permission: PermissionEntry) => boolean {
  const permissionEntryHash = hashFromPermission(permissionEntry)

  return (permission: PermissionEntry): boolean => {
    return hashFromPermission(permission) === permissionEntryHash
  }
}

/**
 * Return `<th>` content identifying a `permission` operation.
 */
export function tableHeadingFromPermission(
  permission: TablePermission
): string {
  return permission.split('_')[0]
}
