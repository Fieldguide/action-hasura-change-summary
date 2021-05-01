import {QualifiedTable} from '@hasura/metadata'
import urlcat from 'urlcat'
import {renderTemplate} from '../format'
import {DiffOptions, TableChange, TableEntryChange} from '../types'
import {viewFromTablePermissionChanges} from './permissions'
import {PERMISSIONS_TEMPLATE, TABLE_TEMPLATE} from './templates'
import {consoleLinkFromUrl} from './utils'

export function changeFromQualifiedTable(
  {schema, name}: QualifiedTable,
  {hasuraEndpoint}: DiffOptions
): TableChange {
  const change: TableChange = {schema, name}

  if (hasuraEndpoint) {
    change._links = consoleLinkFromUrl(
      urlcat(
        hasuraEndpoint,
        '/console/data/schema/:schema/tables/:name/modify',
        {schema, name}
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
      permissions: PERMISSIONS_TEMPLATE
    }
  )
}
