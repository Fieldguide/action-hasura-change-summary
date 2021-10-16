import * as core from '@actions/core'

import {TreeEntryBlob, isTreeEntryBlob} from './types'
import {basename, dirname} from 'path'

import {AbstractMetadataLoader} from './AbstractMetadataLoader'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import {METADATA_CONTENTS_GRAPHQL_QUERY} from './consts'
import {isArray} from 'lodash'

export class GitHubLoader extends AbstractMetadataLoader {
  private directoryContents: Map<string, TreeEntryBlob[]> = new Map()

  constructor(
    private octokit: InstanceType<typeof GitHub>,
    private repo: Context['repo'],
    private baseRef: string
  ) {
    super()
  }

  protected async readFile(path: string): Promise<string> {
    const entries = await this.fetchDirectoryContents(dirname(path))

    const filename = basename(path)
    const entry = entries.find(({name}) => name === filename)

    if (!entry) {
      throw new Error(`Error reading file: ${path}`)
    }

    return entry.object.text
  }

  private async fetchDirectoryContents(
    directory: string
  ): Promise<TreeEntryBlob[]> {
    if (!this.directoryContents.has(directory)) {
      const objectExpression = `${this.baseRef}:${directory}`

      core.debug(`Fetching directory contents: ${objectExpression}`)
      const {repository} = await this.octokit.graphql<any>(
        METADATA_CONTENTS_GRAPHQL_QUERY,
        {
          ...this.repo,
          objectExpression
        }
      )

      const entries = repository.object?.entries

      this.directoryContents.set(
        directory,
        isArray(entries) ? entries.filter(isTreeEntryBlob) : []
      )
    }

    return this.directoryContents.get(directory) ?? []
  }
}
