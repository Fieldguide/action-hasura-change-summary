import {columnPermissionsViewFromTableChanges} from '..'
import {emptyTablePermissionsChanges} from '../..'

describe('columnPermissionsViewFromTableChanges', () => {
  test('no permission changes', () => {
    expect(
      columnPermissionsViewFromTableChanges(emptyTablePermissionsChanges())
    ).toStrictEqual(null)
  })

  test('no column changes', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
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
      })
    ).toStrictEqual(null)
  })

  test('add computed column', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        select_permissions: {
          added: [],
          modified: [
            {
              role: 'user',
              columns: [
                {
                  name: 'full_name',
                  isComputed: true,
                  type: 'added'
                }
              ]
            }
          ],
          deleted: []
        }
      })
    ).toStrictEqual({
      summary: '1 added column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '➕&nbsp;<em>full_name</em>',
                rowspan: true
              },
              {
                content: '',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })

  test('remove computed column', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        select_permissions: {
          added: [],
          modified: [
            {
              role: 'user',
              columns: [
                {
                  name: 'full_name',
                  isComputed: true,
                  type: 'deleted'
                }
              ]
            }
          ],
          deleted: []
        }
      })
    ).toStrictEqual({
      summary: '1 removed column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '➖&nbsp;<del><em>full_name</em></del>',
                rowspan: true
              },
              {
                content: '',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })

  test('mixed change types', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        select_permissions: {
          added: [],
          modified: [
            {
              role: 'user',
              columns: [
                {name: 'id', isComputed: false, type: 'added'},
                {name: 'name', isComputed: false, type: 'deleted'}
              ]
            }
          ],
          deleted: []
        }
      })
    ).toStrictEqual({
      summary: '2 updated column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '➕&nbsp;id<br />➖&nbsp;<del>name</del>',
                rowspan: true
              },
              {
                content: '',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })

  test('non-explicit column changes', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        select_permissions: {
          added: [],
          modified: [
            {
              role: 'user',
              columns: true
            }
          ],
          deleted: []
        }
      })
    ).toStrictEqual({
      summary: '1+ updated column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '<sup>➕</sup>/<sub>➖</sub>',
                rowspan: true
              },
              {
                content: '',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })

  test('consistent deletes across roles', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        update_permissions: {
          added: [],
          modified: [],
          deleted: [
            {
              role: 'manager',
              columns: [
                {name: 'id', isComputed: false, type: 'deleted'},
                {name: 'name', isComputed: false, type: 'deleted'}
              ]
            },
            {
              role: 'user',
              columns: [
                {name: 'id', isComputed: false, type: 'deleted'},
                {name: 'name', isComputed: false, type: 'deleted'}
              ]
            }
          ]
        }
      })
    ).toStrictEqual({
      summary: '4 removed column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'manager',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '',
                rowspan: false
              },
              {
                content: '➖&nbsp;<del>id</del><br />➖&nbsp;<del>name</del>',
                rowspan: true
              }
            ]
          },
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })

  test('inconsistent deletes across roles', () => {
    expect(
      columnPermissionsViewFromTableChanges({
        ...emptyTablePermissionsChanges(),
        update_permissions: {
          added: [],
          modified: [],
          deleted: [
            {
              role: 'manager',
              columns: [
                {name: 'id', isComputed: false, type: 'deleted'},
                {name: 'name', isComputed: false, type: 'deleted'}
              ]
            },
            {
              role: 'user',
              columns: [
                {name: 'id', isComputed: false, type: 'deleted'},
                {name: 'updated_at', isComputed: false, type: 'deleted'}
              ]
            }
          ]
        }
      })
    ).toStrictEqual({
      summary: '4 removed column permissions',
      table: {
        headRow: ['', 'insert', 'select', 'update'],
        body: [
          {
            role: 'manager',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '',
                rowspan: false
              },
              {
                content: '➖&nbsp;<del>id</del><br />➖&nbsp;<del>name</del>',
                rowspan: false
              }
            ]
          },
          {
            role: 'user',
            cells: [
              {
                content: '',
                rowspan: false
              },
              {
                content: '',
                rowspan: false
              },
              {
                content:
                  '➖&nbsp;<del>id</del><br />➖&nbsp;<del>updated_at</del>',
                rowspan: false
              }
            ]
          }
        ]
      }
    })
  })
})
