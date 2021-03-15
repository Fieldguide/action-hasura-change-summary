import {HasuraMetadataV2} from '@hasura/metadata'
import {diffTables, formatTables} from './tables'
import {Changes, DiffOptions} from './types'

export function diff(
  oldMetadata: HasuraMetadataV2,
  newMetadata: HasuraMetadataV2,
  options: DiffOptions = {}
): Changes {
  return {
    tables: diffTables(oldMetadata.tables, newMetadata.tables, options)
  }
}

export function format(changes: Changes): string {
  return formatTables(changes.tables)
}
