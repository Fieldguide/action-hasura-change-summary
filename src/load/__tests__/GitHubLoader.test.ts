import {HasuraMetadataV2} from '@hasura/metadata'
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

        metadata = await target.load('src', ['tables'])
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
  })
})
