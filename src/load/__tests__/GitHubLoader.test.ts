import {HasuraMetadataV2} from '@hasura/metadata'
import {readFileSync} from 'fs'
import {join} from 'path'
import {GitHubLoader} from '../GitHubLoader'

describe('GitHubLoader', () => {
  let target: GitHubLoader
  let metadata: HasuraMetadataV2
  let octokit: any

  beforeEach(() => {
    octokit = {}

    target = new GitHubLoader(
      octokit,
      {
        owner: 'OWNER',
        repo: 'REPO'
      },
      'main'
    )
  })

  describe('load', () => {
    describe('empty', () => {
      beforeEach(async () => {
        octokit.graphql = jest.fn(() => ({
          repository: {
            metadata: null
          }
        }))

        metadata = await target.load('src')
      })

      it('should make GraphQL call', () => {
        expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
          owner: 'OWNER',
          repo: 'REPO',
          objectExpression: 'main:src/metadata'
        })
      })

      it('should return empty metadata', () => {
        expect(metadata).toStrictEqual({
          version: 2,
          tables: []
        })
      })
    })

    describe('existing', () => {
      beforeEach(async () => {
        octokit.graphql = jest.fn(() => ({
          repository: {
            metadata: {
              entries: [
                {
                  name: 'tables.yaml',
                  object: {
                    text: readFixture('tables')
                  }
                },
                {
                  name: 'version.yaml',
                  object: {
                    text: readFixture('version')
                  }
                }
              ]
            }
          }
        }))

        metadata = await target.load('.')
      })

      it('should make GraphQL call', () => {
        expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
          owner: 'OWNER',
          repo: 'REPO',
          objectExpression: 'main:metadata'
        })
      })

      it('should return empty metadata', () => {
        expect(metadata).toStrictEqual({
          version: 2,
          tables: [
            {
              table: {
                schema: 'public',
                name: 'users'
              }
            }
          ]
        })
      })
    })
  })
})

function readFixture(property: keyof HasuraMetadataV2): string {
  return readFileSync(
    join('__tests__', 'fixtures', 'v2', 'metadata', `${property}.yaml`),
    'utf8'
  )
}
