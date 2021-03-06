import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import {HasuraMetadataV2} from '@hasura/metadata'
import {load} from 'js-yaml'
import {isArray} from 'lodash'
import {METADATA_PROPERTIES} from './consts'
import {
  metadataFilenameFromProperty,
  metadataFromVersion,
  metadataFromVersionContents,
  metadataPathFromProject
} from './functions'
import {MetadataLoader} from './types'

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

  async load(projectDir: string): Promise<HasuraMetadataV2> {
    const objectExpression = `${this.baseRef}:${metadataPathFromProject(
      projectDir
    )}`

    core.info(`Loading metadata: ${objectExpression}`)
    const {repository} = await this.octokit.graphql<any>(QUERY, {
      ...this.repo,
      objectExpression
    })

    const entries = repository.metadata?.entries

    if (!isArray(entries)) {
      return metadataFromVersion(2)
    }

    core.info('Initializing metadata from version')
    const versionEntry = entries.find(
      entry => metadataFilenameFromProperty('version') === entry.name
    )

    if (!versionEntry) {
      throw new Error('No version metadata file')
    }

    const metadata = metadataFromVersionContents(versionEntry.object.text)

    for (const entry of entries) {
      core.debug(`Evaluating entry: ${entry.name}`)
      const property = METADATA_PROPERTIES.find(prop => {
        return metadataFilenameFromProperty(prop) === entry.name
      })

      if (property) {
        core.info(`Parsing ${property} YAML metadata`)
        metadata[property] = load(entry.object.text) as any
      }
    }

    return metadata
  }
}
