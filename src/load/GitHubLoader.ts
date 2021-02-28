import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import {HasuraMetadataV2} from '@hasura/metadata'
import {load} from 'js-yaml'
import {isArray} from 'lodash'
import {
  metadataFilenameFromProperty,
  metadataPathFromProject
} from './functions'
import {EMPTY_METADATA} from './index'
import {MetadataLoader, MetadataProperty} from './types'

const QUERY = `
query metadataContents($owner: String!, $repo: String!, $objectExpression: String!) {
  repository(owner: $owner, name: $repo) {
    metadata: object(expression: $objectExpression) {
      ... on Tree {
        entries {
          name
          object {
            ... on Blob {
              text
            }
          }
        }
      }
    }
  }
}`

export class GitHubLoader implements MetadataLoader {
  constructor(
    private octokit: InstanceType<typeof GitHub>,
    private repo: Context['repo'],
    private baseRef: string
  ) {}

  async load(
    projectDir: string,
    properties: MetadataProperty[]
  ): Promise<HasuraMetadataV2> {
    const metadata: HasuraMetadataV2 = {...EMPTY_METADATA}
    const objectExpression = `${this.baseRef}:${metadataPathFromProject(
      projectDir
    )}`

    core.debug(`Loading metadata: ${objectExpression}`)
    const {repository} = await this.octokit.graphql<any>(QUERY, {
      ...this.repo,
      objectExpression
    })
    const entries = repository.metadata?.entries

    if (!isArray(entries)) {
      return metadata
    }

    for (const entry of entries) {
      core.debug(`Evaluating entry: ${entry.name}`)
      const property = properties.find(prop => {
        return metadataFilenameFromProperty(prop) === entry.name
      })

      if (property) {
        core.debug(`Loading entry: ${entry.name}`)
        metadata[property] = load(entry.object.text) as any
      }
    }

    return metadata
  }
}
