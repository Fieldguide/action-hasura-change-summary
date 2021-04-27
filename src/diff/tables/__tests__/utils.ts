import {readFileSync} from 'fs'
import {load} from 'js-yaml'
import {join} from 'path'
import {
  TableChange,
  TableEntryChange,
  TablePermissionsChanges
} from '../../types'
import {emptyTablePermissionsChanges} from '../permissions'

export function loadFixture<T>(path: string): T {
  const fixture = load(
    readFileSync(join(__dirname, 'fixtures', path), 'utf8')
  ) as unknown

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
