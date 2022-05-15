import 'html-validate/jest'

import {format} from '..'
import {tableEntryChange} from '../tables/__tests__/utils'

describe('format', () => {
  describe('empty', () => {
    expect(
      format({
        version: undefined,
        tables: {
          added: [],
          modified: [],
          deleted: []
        }
      })
    ).toStrictEqual('')
  })

  describe('added and modified', () => {
    test('valid HTML', () => {
      expect(
        format({
          version: 3,
          tables: {
            added: [
              tableEntryChange({
                schema: 'public',
                name: 'users',
                _links: {
                  console: {href: 'URL'}
                }
              })
            ],
            modified: [
              tableEntryChange(
                {
                  schema: 'public',
                  name: 'todos'
                },
                {
                  select_permissions: {
                    added: [
                      {
                        role: 'user',
                        columns: {
                          added: [],
                          modified: false,
                          deleted: []
                        }
                      }
                    ],
                    modified: [],
                    deleted: []
                  }
                }
              )
            ],
            deleted: []
          }
        })
      ).toHTMLValidate({
        rules: {
          'no-deprecated-attr': 'off'
        }
      })
    })
  })
})
