import {HasuraMetadataV2} from '@hasura/metadata'
import {readFileSync} from 'fs'
import {load} from 'js-yaml'
import {join} from 'path'
import {metadataPathFromProject} from './functions'
import {MetadataLoader, MetadataProperty} from './types'

export class WorkspaceLoader implements MetadataLoader {
  constructor(private workspacePath: string) {}

  async load(
    projectDir: string,
    properties: MetadataProperty[]
  ): Promise<HasuraMetadataV2> {
    const metadata = {} as HasuraMetadataV2

    for (const property of properties) {
      const yaml = readFileSync(
        join(
          this.workspacePath,
          metadataPathFromProject(projectDir),
          `${property}.yaml`
        ),
        'utf8'
      )

      metadata[property] = load(yaml) as any
    }

    return metadata
  }
}
