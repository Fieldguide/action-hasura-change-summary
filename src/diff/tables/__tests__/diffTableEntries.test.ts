import {
  DiffOptions,
  TableEntryChanges,
  TablePermissionColumnChanges
} from '../../types'
import {loadFixture, tableEntryChange} from './utils'

import {TableEntry} from '@hasura/metadata'
import {diffTableEntries} from '..'
import {isString} from 'lodash'
import {qualifyTableEntry} from '../../functions'

describe('no change', () => {
  test('v2', () => {
    expect(diff('empty', 'empty')).toStrictEqual<TableEntryChanges>({
      added: [],
      modified: [],
      deleted: []
    })
  })

  test('v3', () => {
    expect(
      diff(
        loadTableEntryFixture('users', 'default'),
        loadTableEntryFixture('users', 'default')
      )
    ).toStrictEqual<TableEntryChanges>({
      added: [],
      modified: [],
      deleted: []
    })
  })
})

describe('added', () => {
  test('no endpoint', () => {
    expect(
      diff('empty', 'users_permissions/user_select_full')
    ).toStrictEqual<TableEntryChanges>({
      added: [
        {
          table: {
            database: undefined,
            schema: 'public',
            name: 'users'
          },
          insert_permissions: {
            added: [],
            modified: [],
            deleted: []
          },
          select_permissions: {
            added: [
              {
                role: 'user',
                columns: [
                  {name: 'created_at', isComputed: false, type: 'added'},
                  {name: 'id', isComputed: false, type: 'added'},
                  {name: 'last_login_at', isComputed: false, type: 'added'},
                  {name: 'name', isComputed: false, type: 'added'}
                ]
              }
            ],
            modified: [],
            deleted: []
          },
          update_permissions: {
            added: [],
            modified: [],
            deleted: []
          },
          delete_permissions: {
            added: [],
            modified: [],
            deleted: []
          }
        }
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
      ).toStrictEqual<TableEntryChanges>({
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
          loadTableEntryFixture('empty', 'default'),
          loadTableEntryFixture('users', 'default'),
          {
            hasuraEndpoint: 'http://localhost:8080/'
          }
        )
      ).toStrictEqual<TableEntryChanges>({
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
        expect(diff(oldFixture, newFixture)).toStrictEqual<TableEntryChanges>({
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
                  added: [
                    {
                      role: 'user',
                      columns: [
                        {name: 'created_at', isComputed: false, type: 'added'},
                        {name: 'id', isComputed: false, type: 'added'},
                        {
                          name: 'last_login_at',
                          isComputed: false,
                          type: 'added'
                        },
                        {name: 'name', isComputed: false, type: 'added'}
                      ]
                    }
                  ],
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
        expect(diff(oldFixture, newFixture)).toStrictEqual<TableEntryChanges>({
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
                  added: [
                    {
                      role: 'manager',
                      columns: [
                        {name: 'name', isComputed: false, type: 'added'}
                      ]
                    }
                  ],
                  modified: [],
                  deleted: []
                },
                select_permissions: {
                  added: [
                    {
                      role: 'manager',
                      columns: [
                        {name: 'created_at', isComputed: false, type: 'added'},
                        {name: 'id', isComputed: false, type: 'added'},
                        {
                          name: 'last_login_at',
                          isComputed: false,
                          type: 'added'
                        },
                        {name: 'name', isComputed: false, type: 'added'}
                      ]
                    }
                  ],
                  modified: [],
                  deleted: []
                },
                update_permissions: {
                  added: [
                    {
                      role: 'manager',
                      columns: [
                        {name: 'name', isComputed: false, type: 'added'}
                      ]
                    }
                  ],
                  modified: [],
                  deleted: []
                },
                delete_permissions: {
                  added: [
                    {
                      role: 'manager',
                      columns: []
                    }
                  ],
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
        expect(diff(oldFixture, newFixture)).toStrictEqual<TableEntryChanges>({
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
                  modified: [
                    {
                      role: 'user',
                      columns: []
                    }
                  ],
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

  describe('update user column select permissions', () => {
    const tests: [string, string, TablePermissionColumnChanges][] = [
      [
        'users_permissions/user_select_full_id_column',
        'users_permissions/user_select_full',
        [
          {name: 'created_at', isComputed: false, type: 'added'},
          {name: 'last_login_at', isComputed: false, type: 'added'},
          {name: 'name', isComputed: false, type: 'added'}
        ]
      ],
      [
        'users_permissions/user_select_full',
        'users_permissions/user_select_full_id_column',
        [
          {name: 'created_at', isComputed: false, type: 'deleted'},
          {name: 'last_login_at', isComputed: false, type: 'deleted'},
          {name: 'name', isComputed: false, type: 'deleted'}
        ]
      ],
      [
        'users_permissions/user_select_full_all_columns',
        'users_permissions/user_select_full_id_column',
        true
      ]
    ]

    for (const [oldFixture, newFixture, columns] of tests) {
      test(`${oldFixture} -> ${newFixture}`, () => {
        expect(diff(oldFixture, newFixture)).toStrictEqual<TableEntryChanges>({
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
                  modified: [
                    {
                      role: 'user',
                      columns
                    }
                  ],
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
        expect(diff(oldFixture, newFixture)).toStrictEqual<TableEntryChanges>({
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
                  deleted: [
                    {
                      role: 'user',
                      columns: [
                        {
                          name: 'created_at',
                          isComputed: false,
                          type: 'deleted'
                        },
                        {name: 'id', isComputed: false, type: 'deleted'},
                        {
                          name: 'last_login_at',
                          isComputed: false,
                          type: 'deleted'
                        },
                        {name: 'name', isComputed: false, type: 'deleted'}
                      ]
                    }
                  ]
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
  ).toStrictEqual<TableEntryChanges>({
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
            modified: [
              {
                role: 'user',
                columns: []
              }
            ],
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
    expect(diff('users', 'empty')).toStrictEqual<TableEntryChanges>({
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
    ).toStrictEqual<TableEntryChanges>({
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
  oldFixture: string | TableEntry[],
  newFixture: string | TableEntry[],
  options?: DiffOptions
): TableEntryChanges {
  const oldTableEntries = isString(oldFixture)
    ? loadTableEntryFixture(oldFixture)
    : oldFixture
  const newTableEntries = isString(newFixture)
    ? loadTableEntryFixture(newFixture)
    : newFixture

  return diffTableEntries(oldTableEntries, newTableEntries, options)
}

function loadTableEntryFixture(
  fixture: string,
  database?: string
): TableEntry[] {
  const tables = loadFixture<TableEntry[]>(`/${fixture}.yaml`)

  if (database) {
    return tables.map(table => qualifyTableEntry(table, database))
  }

  return tables
}
