import {HasuraMetadataV2} from '@hasura/metadata'
import {join} from 'path'

export function metadataPathFromProject(project: string): string {
  return join(project, 'metadata')
}

export function metadataFilenameFromProperty(
  property: keyof HasuraMetadataV2
): string {
  return `${property}.yaml`
}
