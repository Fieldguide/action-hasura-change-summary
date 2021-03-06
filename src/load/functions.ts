import {isObject} from 'lodash'
import {HasuraMetadataV2} from '@hasura/metadata'
import {load} from 'js-yaml'
import {join} from 'path'

export function metadataPathFromProject(project: string): string {
  return join(project, 'metadata')
}

export function metadataFilenameFromProperty(
  property: keyof HasuraMetadataV2
): string {
  return `${property}.yaml`
}

export function metadataFromVersionContents(
  fileContents: string
): HasuraMetadataV2 {
  const metadata = load(fileContents) as HasuraMetadataV2

  if (!isObject(metadata) || !isFinite(metadata.version)) {
    throw new Error('Invalid version metadata file')
  }

  return metadataFromVersion(metadata.version)
}

export function metadataFromVersion(version: number): HasuraMetadataV2 {
  if (2 !== version) {
    throw new Error('Unsupported metadata version')
  }

  return {
    version,
    tables: []
  }
}
