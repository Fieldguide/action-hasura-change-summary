import * as core from '@actions/core'

import {AbstractMetadataLoader} from './AbstractMetadataLoader'
import {join} from 'path'
import {readFileSync} from 'fs'

export class WorkspaceLoader extends AbstractMetadataLoader {
  constructor(private workspacePath: string) {
    super()
  }

  protected metadataPathFromProject(projectDir: string): string {
    return join(this.workspacePath, super.metadataPathFromProject(projectDir))
  }

  protected async readFile(path: string): Promise<string> {
    core.debug(`Reading file: ${path}`)
    return readFileSync(path, 'utf8')
  }
}
