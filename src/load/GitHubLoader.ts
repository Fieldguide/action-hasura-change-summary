import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import {HasuraMetadataV2} from '@hasura/metadata'
import {load} from 'js-yaml'
import {
  metadataFilenameFromProperty,
  metadataPathFromProject
} from './functions'
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
    const metadata = {} as HasuraMetadataV2
    const {data} = await this.octokit.graphql(QUERY, {
      ...this.repo,
      objectExpression: `${this.baseRef}:${metadataPathFromProject(projectDir)}`
    })

    for (const entry of data.repository.metadata.entries) {
      const property = properties.find(prop => {
        return metadataFilenameFromProperty(prop) === entry.name
      })

      if (property) {
        metadata[property] = load(entry.object.text) as any
      }
    }

    return metadata
  }
}
