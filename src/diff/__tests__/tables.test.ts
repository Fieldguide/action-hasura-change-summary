import {QualifiedTable, TableEntry} from '@hasura/metadata'
import {diffTables, formatTables} from '../tables'
import {TableChange} from '../types'
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

    test('tracked', () => {
      expect(diff('empty', 'users')).toStrictEqual({
        tracked: [table('public', 'users')],
        untracked: [],
        updated: []
      })
    })

    test('untracked', () => {
      expect(diff('users', 'empty')).toStrictEqual({
        tracked: [],
        untracked: [table('public', 'users')],
        updated: []
      })
    })

    test('update', () => {
      expect(diff('users', 'users_permissions_full_select')).toStrictEqual({
        tracked: [],
        untracked: [],
        updated: [table('public', 'users')]
      })
      expect(diff('users_permissions_full_select', 'users')).toStrictEqual({
        tracked: [],
        untracked: [],
        updated: [table('public', 'users')]
      })
    })
  })

  describe('formatTables', () => {
    test('tracked', () => {
      expect(
        formatTables({
          tracked: [table('public', 'users'), table('public', 'todos')],
          untracked: [],
          updated: []
        })
      ).toStrictEqual(
        '### Tracked Tables\n\n* `public.users`\n* `public.todos`'
      )
    })

    test('tracked and updated', () => {
      expect(
        formatTables({
          tracked: [table('public', 'users')],
          untracked: [],
          updated: [table('public', 'todos')]
        })
      ).toStrictEqual(
        '### Tracked Tables\n\n* `public.users`\n\n### Updated Tables\n\n* `public.todos`'
      )
    })

    test('untracked', () => {
      expect(
        formatTables({
          tracked: [],
          untracked: [table('public', 'users')],
          updated: []
        })
      ).toStrictEqual('### Untracked Tables\n\n* `public.users`')
    })
  })
})

function diff(oldFixture: string, newFixture: string): TableChange {
  return diffTables(
    loadFixture<TableEntry[]>(`tables/${oldFixture}.yaml`),
    loadFixture<TableEntry[]>(`tables/${newFixture}.yaml`)
  )
}

function table(schema: string, name: string): QualifiedTable {
  return {
    schema,
    name
  }
}
