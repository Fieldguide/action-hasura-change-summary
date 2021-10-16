import {HasuraMetadata, TreeEntry} from '../types'
import {lstatSync, readFileSync, readdirSync} from 'fs'

import {GitHubLoader} from '../GitHubLoader'
import {RequestParameters} from '@octokit/types'
import {isString} from 'lodash'
import {join} from 'path'

describe('GitHubLoader', () => {
  let target: GitHubLoader
  let metadata: HasuraMetadata
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

  describe('load v2', () => {
    describe('empty', () => {
      beforeEach(async () => {
        octokit.graphql = jest.fn(() => ({
          repository: {
            object: null
          }
        }))

        metadata = await target.load('src', true)
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
          version: 3,
          databases: []
        })
      })
    })

    describe('existing', () => {
      beforeEach(async () => {
        octokit.graphql = jest.fn(() => ({
          repository: {
            object: {
              entries: treeEntryFixtures(
                join('__tests__', 'fixtures', 'v2', 'metadata')
              )
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

      it('should return metadata', () => {
        expect(metadata).toStrictEqual({
          __converted_from: 2,
          version: 3,
          databases: [
            {
              name: 'default',
              tables: [
                {
                  table: {
                    schema: 'public',
                    name: 'users'
                  }
                }
              ]
            }
          ]
        })
      })
    })
  })

  describe('load v3', () => {
    beforeEach(async () => {
      octokit.graphql = jest.fn(
        (_query: string, {objectExpression}: RequestParameters) => {
          if (!isString(objectExpression)) {
            throw new Error('objectExpression is not a string')
          }

          const directory = objectExpression.slice('main:'.length)

          return {
            repository: {
              object: {
                entries: treeEntryFixtures(
                  join('__tests__', 'fixtures', 'v3', directory)
                )
              }
            }
          }
        }
      )

      metadata = await target.load('.')
    })

    const expectedObjectExpression: string[] = [
      'main:metadata',
      'main:metadata/databases',
      'main:metadata/databases/default/tables'
    ]

    it(`should make ${expectedObjectExpression.length} GraphQL calls`, () => {
      for (const objectExpression of expectedObjectExpression) {
        expect(octokit.graphql).toHaveBeenCalledWith(expect.any(String), {
          owner: 'OWNER',
          repo: 'REPO',
          objectExpression
        })
      }

      expect(octokit.graphql.mock.calls.length).toStrictEqual(
        expectedObjectExpression.length
      )
    })

    it('should return metadata', () => {
      expect(metadata).toStrictEqual({
        version: 3,
        databases: [
          {
            name: 'default',
            kind: 'postgres',
            tables: [
              {
                table: {
                  schema: 'public',
                  name: 'users'
                }
              }
            ]
          }
        ]
      })
    })
  })
})

function treeEntryFixtures(directory: string): TreeEntry<any>[] {
  return readdirSync(directory).map<TreeEntry<any>>(name => {
    const path = join(directory, name)

    if (lstatSync(path).isFile()) {
      return {
        name,
        object: {text: readFileSync(path, 'utf8')}
      }
    }

    return {name, object: {}}
  })
}
