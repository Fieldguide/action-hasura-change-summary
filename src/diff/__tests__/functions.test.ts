import {tablesFromMetadata} from '../functions'

describe('tablesFromMetadata', () => {
  test('converted from v2', () => {
    expect(
      tablesFromMetadata({
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
    ).toStrictEqual([
      {
        table: {
          schema: 'public',
          name: 'users'
        }
      }
    ])
  })

  test('v3', () => {
    expect(
      tablesFromMetadata({
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
          },
          {
            name: 'foo',
            tables: [
              {
                table: {
                  schema: 'public',
                  name: 'todos'
                }
              }
            ]
          }
        ]
      })
    ).toStrictEqual([
      {
        table: {
          database: 'default',
          schema: 'public',
          name: 'users'
        }
      },
      {
        table: {
          database: 'foo',
          schema: 'public',
          name: 'todos'
        }
      }
    ])
  })
})
