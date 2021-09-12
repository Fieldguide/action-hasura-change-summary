import {Database, MetadataProperty} from './types'

export const METADATA_PROPERTIES: MetadataProperty[] = ['databases']

export const DEFAULT_DATABASE_NAME = 'default'

export const DEFAULT_DATABASE: Database = {
  name: DEFAULT_DATABASE_NAME,
  tables: []
}

export const METADATA_CONTENTS_GRAPHQL_QUERY = `
query metadataContents($owner: String!, $repo: String!, $objectExpression: String!) {
  repository(owner: $owner, name: $repo) {
    object(expression: $objectExpression) {
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
