import * as core from '@actions/core'
import {HasuraMetadataV2} from '@hasura/metadata'
import {readFileSync} from 'fs'
import {load} from 'js-yaml'
import {join} from 'path'
import {EMPTY_METADATA} from '.'
import {metadataPathFromProject} from './functions'
import {MetadataLoader, MetadataProperty} from './types'

export class WorkspaceLoader implements MetadataLoader {
  constructor(private workspacePath: string) {}

  async load(
    projectDir: string,
    properties: MetadataProperty[]
  ): Promise<HasuraMetadataV2> {
    const metadata: HasuraMetadataV2 = {...EMPTY_METADATA}

    for (const property of properties) {
      const path = join(
        this.workspacePath,
        metadataPathFromProject(projectDir),
        `${property}.yaml`
      )

      core.debug(`Reading file: ${path}`)
      const yaml = readFileSync(path, 'utf8')

      core.debug(`Loading file: ${path}`)
      metadata[property] = load(yaml) as any
    }

    return metadata
  }
}
