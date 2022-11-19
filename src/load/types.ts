import {HasuraMetadataV2, TableEntry} from '@hasura/metadata'
import {isObject, isString} from 'lodash'

export interface Database {
  name: string
  tables: TableEntry[]
}

export interface HasuraMetadataV3 extends Omit<HasuraMetadataV2, 'tables'> {
  version: 3
  databases: Database[]
}

export type ConvertedMetadataVersion = 2 | undefined

export interface HasuraMetadataLatest extends HasuraMetadataV3 {
  __converted_from?: ConvertedMetadataVersion
}

export type HasuraMetadata = HasuraMetadataV2 | HasuraMetadataV3

type KeysOfUnion<T> = T extends T ? keyof T : never

export type MetadataProperty = KeysOfUnion<HasuraMetadata>

export interface MetadataLoader {
  /**
   * @param emptyFallback default to empty metadata when version cannot be read
   */
  load(
    projectDir: string,
    emptyFallback: boolean
  ): Promise<HasuraMetadataLatest>
}

export type FileReader = (path: string) => Promise<string>

export function isMetadataV2(
  metadata: HasuraMetadata
): metadata is HasuraMetadataV2 {
  return 2 === metadata.version
}

export function isMetadataV3(
  metadata: HasuraMetadata
): metadata is HasuraMetadataV3 {
  return 3 === metadata.version
}

export interface TreeEntry<T extends object> {
  name: string
  object: T
}

export type TreeEntryBlob = TreeEntry<{
  text: string
}>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTreeEntryBlob(entry: TreeEntry<any>): entry is TreeEntryBlob {
  return (
    isObject(entry) &&
    isObject(entry.object) &&
    isString((entry.object as {text: string}).text)
  )
}

export interface MetadataContentsGraphqlResponse {
  repository: {
    object?: {
      entries?: TreeEntryBlob[]
    }
  }
}
