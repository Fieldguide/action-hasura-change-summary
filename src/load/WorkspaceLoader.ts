import * as core from '@actions/core'
import {HasuraMetadataV2} from '@hasura/metadata'
import {readFileSync} from 'fs'
import {load} from 'js-yaml'
import {join} from 'path'
import {METADATA_PROPERTIES} from './consts'
import {
  metadataFilenameFromProperty,
  metadataFromVersionContents,
  metadataPathFromProject
} from './functions'
import {MetadataLoader} from './types'

export class WorkspaceLoader implements MetadataLoader {
  constructor(private workspacePath: string) {}

  async load(projectDir: string): Promise<HasuraMetadataV2> {
    core.debug('Initializing metadata from version')
    const metadata = metadataFromVersionContents(
      this.readFile(projectDir, 'version')
    )

    for (const property of METADATA_PROPERTIES) {
      const yaml = this.readFile(projectDir, property)

      core.debug(`Parsing ${property} YAML metadata`)
      metadata[property] = load(yaml) as any
    }

    return metadata
  }

  private readFile(
    projectDir: string,
    property: keyof HasuraMetadataV2
  ): string {
    const path = join(
      this.workspacePath,
      metadataPathFromProject(projectDir),
      metadataFilenameFromProperty(property)
    )

    core.debug(`Reading file: ${path}`)
    return readFileSync(path, 'utf8')
  }
}
