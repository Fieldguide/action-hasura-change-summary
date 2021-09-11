import {TableEntry} from '@hasura/metadata'
import {diffTableEntries} from '..'
import {qualifyTableEntry} from '../../functions'
import {DiffOptions, TableEntryChanges} from '../../types'
import {loadFixture, tableEntryChange} from './utils'

test('no change', () => {
  expect(diff('empty', 'empty')).toStrictEqual({
    added: [],
    modified: [],
    deleted: []
  })
})

describe('added', () => {
  test('no endpoint', () => {
    expect(diff('empty', 'users_permissions/user_select_full')).toStrictEqual({
      added: [
        tableEntryChange(
          {
            database: undefined,
            schema: 'public',
            name: 'users'
          },
          {
            select_permissions: {
              added: [{role: 'user'}],
              modified: [],
              deleted: []
            }
          }
        )
      ],
      modified: [],
      deleted: []
    })
  })

  describe('with configured endpoint', () => {
    test('v2', () => {
      expect(
        diff('empty', 'users', {
          hasuraEndpoint: 'http://localhost:8080/'
        })
      ).toStrictEqual({
        added: [
          tableEntryChange({
            database: undefined,
            schema: 'public',
            name: 'users',
            _links: {
              console: {
                href: 'http://localhost:8080/console/data/schema/public/tables/users/modify'
              }
            }
          })
        ],
        modified: [],
        deleted: []
      })
    })

    test('v3 with database', () => {
      expect(
        diff(
          'empty',
          'users',
          {
            hasuraEndpoint: 'http://localhost:8080/'
          },
          'default'
        )
      ).toStrictEqual({
        added: [
          tableEntryChange({
            database: 'default',
            schema: 'public',
            name: 'users',
            _links: {
              console: {
                href: 'http://localhost:8080/console/data/default/schema/public/tables/users/modify'
              }
            }
          })
        ],
        modified: [],
        deleted: []
      })
    })
  })
})

describe('modified', () => {
  describe('add user select permissions', () => {
    for (const [oldFixture, newFixture] of [
      ['users', 'users_permissions/user_select_full'],
      [
        'users_permissions/manager',
        'users_permissions/manager_and_user_select_full'
      ]
    ]) {
      test(`${oldFixture} -> ${newFixture}`, () => {
        expect(diff(oldFixture, newFixture)).toStrictEqual({
          added: [],
          modified: [
            tableEntryChange(
              {
                database: undefined,
                schema: 'public',
                name: 'users'
              },
              {
                select_permissions: {
                  added: [{role: 'user'}],
                  modified: [],
                  deleted: []
                }
              }
            )
          ],
          deleted: []
        })
      })
    }
  })

  describe('add manager permissions', () => {
    for (const [oldFixture, newFixture] of [
      ['users', 'users_permissions/manager'],
      [
        'users_permissions/user_select_full',
        'users_permissions/manager_and_user_select_full'
      ],
      [
        'users_permissions/user_select_filtered',
        'users_permissions/manager_and_user_select_filtered'
      ]
    ]) {
      test(`${oldFixture} -> ${newFixture}`, () => {
        expect(diff(oldFixture, newFixture)).toStrictEqual({
          added: [],
          modified: [
            tableEntryChange(
              {
                database: undefined,
                schema: 'public',
                name: 'users'
              },
              {
                insert_permissions: {
                  added: [{role: 'manager'}],
                  modified: [],
                  deleted: []
                },
                select_permissions: {
                  added: [{role: 'manager'}],
                  modified: [],
                  deleted: []
                },
                update_permissions: {
                  added: [{role: 'manager'}],
                  modified: [],
                  deleted: []
                },
                delete_permissions: {
                  added: [{role: 'manager'}],
                  modified: [],
                  deleted: []
                }
              }
            )
          ],
          deleted: []
        })
      })
    }
  })

  describe('filter user select permissions', () => {
    for (const [oldFixture, newFixture] of [
      [
        'users_permissions/user_select_full',
        'users_permissions/user_select_filtered'
      ],
      [
        'users_permissions/user_select_filtered',
        'users_permissions/user_select_full'
      ],
      [
        'users_permissions/manager_and_user_select_full',
        'users_permissions/manager_and_user_select_filtered'
      ]
    ]) {
      test(`${oldFixture} -> ${newFixture}`, () => {
        expect(diff(oldFixture, newFixture)).toStrictEqual({
          added: [],
          modified: [
            tableEntryChange(
              {
                database: undefined,
                schema: 'public',
                name: 'users'
              },
              {
                select_permissions: {
                  added: [],
                  modified: [{role: 'user'}],
                  deleted: []
                }
              }
            )
          ],
          deleted: []
        })
      })
    }
  })

  describe('remove user select permissions', () => {
    for (const [oldFixture, newFixture] of [
      ['users_permissions/user_select_full', 'users'],
      [
        'users_permissions/manager_and_user_select_filtered',
        'users_permissions/manager'
      ]
    ]) {
      test(`${oldFixture} -> ${newFixture}`, () => {
        expect(diff(oldFixture, newFixture)).toStrictEqual({
          added: [],
          modified: [
            tableEntryChange(
              {
                database: undefined,
                schema: 'public',
                name: 'users'
              },
              {
                select_permissions: {
                  added: [],
                  modified: [],
                  deleted: [{role: 'user'}]
                }
              }
            )
          ],
          deleted: []
        })
      })
    }
  })
})

test('modified and deleted with table index changes', () => {
  expect(
    diff('todos_and_users', 'users_permissions/user_select_filtered')
  ).toStrictEqual({
    added: [],
    modified: [
      tableEntryChange(
        {
          database: undefined,
          schema: 'public',
          name: 'users'
        },
        {
          select_permissions: {
            added: [],
            modified: [{role: 'user'}],
            deleted: []
          }
        }
      )
    ],
    deleted: [
      tableEntryChange({
        database: undefined,
        schema: 'public',
        name: 'todos'
      })
    ]
  })
})

describe('deleted', () => {
  test('no endpoint', () => {
    expect(diff('users', 'empty')).toStrictEqual({
      added: [],
      modified: [],
      deleted: [
        tableEntryChange({
          database: undefined,
          schema: 'public',
          name: 'users'
        })
      ]
    })
  })

  test('with configured endpoint', () => {
    expect(
      diff('users', 'empty', {
        hasuraEndpoint: 'http://localhost:8080/'
      })
    ).toStrictEqual({
      added: [],
      modified: [],
      deleted: [
        tableEntryChange({
          database: undefined,
          schema: 'public',
          name: 'users'
        })
      ]
    })
  })
})

function diff(
  oldFixture: string,
  newFixture: string,
  options?: DiffOptions,
  database?: string
): TableEntryChanges {
  const loadTableEntryFixture = (fixture: string): TableEntry[] => {
    const tables = loadFixture<TableEntry[]>(`/${fixture}.yaml`)

    if (database) {
      return tables.map(table => qualifyTableEntry(table, database))
    }

    return tables
  }

  return diffTableEntries(
    loadTableEntryFixture(oldFixture),
    loadTableEntryFixture(newFixture),
    options
  )
}
