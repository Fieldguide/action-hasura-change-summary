import {HasuraMetadataV2} from '@hasura/metadata'
import {diffTables} from './tables'
import {Change} from './types'

export function diffV2(
  oldMetadata: HasuraMetadataV2,
  newMetadata: HasuraMetadataV2
): Change {
  return {
    tables: diffTables(oldMetadata.tables, newMetadata.tables)
  }
}
