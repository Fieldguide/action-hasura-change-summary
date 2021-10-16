import * as core from '@actions/core'

import {
  HasuraMetadata,
  HasuraMetadataLatest,
  MetadataLoader,
  MetadataProperty
} from './types'
import {
  convertMetadataToLatest,
  metadataFilenameFromProperty,
  metadataFromVersion,
  metadataFromVersionContents
} from './functions'

import {join} from 'path'
import {load} from './yaml'

export abstract class AbstractMetadataLoader implements MetadataLoader {
  protected abstract readFile(path: string): Promise<string>

  async load(
    projectDir: string,
    emptyFallback = false
  ): Promise<HasuraMetadataLatest> {
    let metadata

    try {
      core.info('Initializing metadata from version')
      metadata = metadataFromVersionContents(
        await this.readFile(this.filePathFromProperty(projectDir, 'version'))
      )
    } catch (error) {
      if (emptyFallback) {
        return convertMetadataToLatest(metadataFromVersion(3))
      }

      throw error
    }

    const metadataProperties = Object.keys(metadata).filter(
      key => 'version' !== key
    ) as MetadataProperty[]

    for (const property of metadataProperties) {
      core.info(`Parsing ${property} YAML metadata`)
      metadata[property as keyof HasuraMetadata] = await load(
        this.filePathFromProperty(projectDir, property),
        this.readFile.bind(this)
      )
    }

    return convertMetadataToLatest(metadata)
  }

  protected metadataPathFromProject(projectDir: string): string {
    return join(projectDir, 'metadata')
  }

  private filePathFromProperty(
    projectDir: string,
    property: MetadataProperty
  ): string {
    return join(
      this.metadataPathFromProject(projectDir),
      metadataFilenameFromProperty(property)
    )
  }
}
