import {
  TableChange,
  TableEntryChange,
  TablePermissionsChanges
} from '../../types'

import {emptyTablePermissionsChanges} from '../permissions'
import {join} from 'path'
import {load} from 'js-yaml'
import {readFileSync} from 'fs'

export function loadFixture<T>(path: string): T {
  const fixture = load(readFileSync(join(__dirname, 'fixtures', path), 'utf8'))

  return fixture as T
}

export function tableEntryChange(
  table: TableChange,
  permissions?: Partial<TablePermissionsChanges>
): TableEntryChange {
  return {
    ...emptyTablePermissionsChanges(),
    ...permissions,
    table
  }
}
