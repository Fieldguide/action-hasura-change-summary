import {
  HasuraMetadata,
  HasuraMetadataLatest,
  MetadataProperty,
  isMetadataV2,
  isMetadataV3
} from './types'

import {DEFAULT_DATABASE} from './consts'
import {isObject} from 'lodash'
import {load} from 'js-yaml'

export function metadataFilenameFromProperty(
  property: MetadataProperty
): string {
  const filename = `${property}.yaml`

  if ('databases' === property) {
    return `${property}/${filename}`
  }

  return filename
}

export function metadataFromVersionContents(
  fileContents: string
): HasuraMetadata {
  const metadata = load(fileContents) as HasuraMetadata

  if (!isObject(metadata) || !isFinite(metadata.version)) {
    throw new Error('Invalid version metadata file')
  }

  return metadataFromVersion(metadata.version)
}

export function metadataFromVersion(version: number): HasuraMetadata {
  switch (version) {
    case 2:
      return {
        version,
        tables: []
      }
    case 3:
      return {
        version,
        databases: []
      }
    default:
      throw new Error('Unsupported metadata version')
  }
}

export function convertMetadataToLatest(
  metadata: HasuraMetadata
): HasuraMetadataLatest {
  if (isMetadataV2(metadata)) {
    return {
      __converted_from: 2,
      version: 3,
      databases: [
        {
          ...DEFAULT_DATABASE,
          tables: metadata.tables
        }
      ]
    }
  }

  if (isMetadataV3(metadata)) {
    return metadata
  }

  return assertNever(metadata)
}

function assertNever(metadata: never): never {
  throw new Error(`Unexpected metadata: ${JSON.stringify(metadata)}`)
}
