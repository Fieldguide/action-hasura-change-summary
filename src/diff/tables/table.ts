import {
  COLUMN_PERMISSIONS_TEMPLATE,
  PERMISSIONS_TEMPLATE
} from './permissions/templates'
import {
  DiffOptions,
  QualifiedTable,
  TableChange,
  TableEntryChange
} from '../types'

import {DEFAULT_DATABASE_NAME} from '../../load/consts'
import {TABLE_TEMPLATE} from './templates'
import {TableEntry} from '@hasura/metadata'
import {consoleLinkFromUrl} from './utils'
import {renderTemplate} from '../functions'
import urlcat from 'urlcat'
import {viewFromTablePermissionChanges} from './permissions'

export function changeFromQualifiedTable(
  {database, schema, name}: QualifiedTable,
  {hasuraEndpoint}: DiffOptions
): TableChange {
  const change: TableChange = {database, schema, name}

  if (hasuraEndpoint) {
    change._links = consoleLinkFromUrl(
      urlcat(
        hasuraEndpoint,
        `/console/data/${
          database ? ':database/' : ''
        }schema/:schema/tables/:name/modify`,
        {database, schema, name}
      )
    )
  }

  return change
}

export function formatTableEntryChange(
  heading: string,
  tableEntries: TableEntryChange[]
): string {
  if (0 === tableEntries.length) {
    return ''
  }

  return renderTemplate(
    TABLE_TEMPLATE,
    {
      heading,
      tables: tableEntries.map(({table, ...tablePermissions}) => ({
        table,
        permissions: viewFromTablePermissionChanges(tablePermissions)
      }))
    },
    {
      permissions: PERMISSIONS_TEMPLATE,
      columnPermissions: COLUMN_PERMISSIONS_TEMPLATE
    }
  )
}

export function hashFromTable({
  database = DEFAULT_DATABASE_NAME,
  schema,
  name
}: QualifiedTable): string {
  return `table:${database}:${schema}:${name}`
}

export function tableEntryPredicate(
  table: QualifiedTable
): (tableEntry: TableEntry) => boolean {
  const tableHash = hashFromTable(table)

  return (tableEntry: TableEntry): boolean => {
    return hashFromTable(tableEntry.table) === tableHash
  }
}
