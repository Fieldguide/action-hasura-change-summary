import {TableEntry} from '@hasura/metadata'
import {diffTables, formatTables} from '../tables'
import {DiffOptions, TableChanges} from '../types'
import {loadFixture} from './utils'

describe('tables', () => {
  describe('diffTables', () => {
    test('no change', () => {
      expect(diff('empty', 'empty')).toStrictEqual({
        tracked: [],
        untracked: [],
        updated: []
      })
    })

    describe('tracked', () => {
      test('no endpoint', () => {
        expect(diff('empty', 'users')).toStrictEqual({
          tracked: [
            {
              schema: 'public',
              name: 'users'
            }
          ],
          untracked: [],
          updated: []
        })
      })

      test('with configured endpoint', () => {
        expect(
          diff('empty', 'users', {
            hasuraEndpoint: 'http://localhost:8080/'
          })
        ).toStrictEqual({
          tracked: [
            {
              schema: 'public',
              name: 'users',
              consoleUrl:
                'http://localhost:8080/console/data/schema/public/tables/users/browse'
            }
          ],
          untracked: [],
          updated: []
        })
      })
    })

    describe('untracked', () => {
      test('no endpoint', () => {
        expect(diff('users', 'empty')).toStrictEqual({
          tracked: [],
          untracked: [
            {
              schema: 'public',
              name: 'users'
            }
          ],
          updated: []
        })
      })

      test('with configured endpoint', () => {
        expect(
          diff('users', 'empty', {
            hasuraEndpoint: 'http://localhost:8080/'
          })
        ).toStrictEqual({
          tracked: [],
          untracked: [
            {
              schema: 'public',
              name: 'users'
            }
          ],
          updated: []
        })
      })
    })

    test('update', () => {
      expect(diff('users', 'users_permissions_full_select')).toStrictEqual({
        tracked: [],
        untracked: [],
        updated: [
          {
            schema: 'public',
            name: 'users'
          }
        ]
      })
      expect(diff('users_permissions_full_select', 'users')).toStrictEqual({
        tracked: [],
        untracked: [],
        updated: [
          {
            schema: 'public',
            name: 'users'
          }
        ]
      })
    })
  })

  describe('formatTables', () => {
    test('tracked', () => {
      expect(
        formatTables({
          tracked: [
            {
              schema: 'public',
              name: 'users'
            },
            {
              schema: 'public',
              name: 'todos',
              consoleUrl: 'URL'
            }
          ],
          untracked: [],
          updated: []
        })
      ).toStrictEqual(
        '### Tracked Tables\n\n* `public.users`\n* [`public.todos`](URL)'
      )
    })

    test('tracked and updated', () => {
      expect(
        formatTables({
          tracked: [
            {
              schema: 'public',
              name: 'users',
              consoleUrl: 'URL'
            }
          ],
          untracked: [],
          updated: [
            {
              schema: 'public',
              name: 'todos'
            }
          ]
        })
      ).toStrictEqual(
        '### Tracked Tables\n\n* [`public.users`](URL)\n\n### Updated Tables\n\n* `public.todos`'
      )
    })

    test('untracked', () => {
      expect(
        formatTables({
          tracked: [],
          untracked: [
            {
              schema: 'public',
              name: 'users'
            }
          ],
          updated: []
        })
      ).toStrictEqual('### Untracked Tables\n\n* `public.users`')
    })
  })
})

function diff(
  oldFixture: string,
  newFixture: string,
  options?: DiffOptions
): TableChanges {
  return diffTables(
    loadFixture<TableEntry[]>(`tables/${oldFixture}.yaml`),
    loadFixture<TableEntry[]>(`tables/${newFixture}.yaml`),
    options
  )
}
