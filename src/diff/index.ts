import {HasuraMetadataV2} from '@hasura/metadata'
import {diffTables, formatTables} from './tables'
import {Change} from './types'

export function diff(
  oldMetadata: HasuraMetadataV2,
  newMetadata: HasuraMetadataV2
): Change {
  return {
    tables: diffTables(oldMetadata.tables, newMetadata.tables)
  }
}

export function format(change: Change): string {
  return formatTables(change.tables)
}
