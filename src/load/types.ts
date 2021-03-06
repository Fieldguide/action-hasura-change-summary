import {HasuraMetadataV2} from '@hasura/metadata'

export type MetadataProperty = keyof HasuraMetadataV2

export interface MetadataLoader {
  load(projectDir: string): Promise<HasuraMetadataV2>
}
