import 'html-validate/jest'
import {format} from '..'
import {tableEntryChange} from '../tables/__tests__/utils'

describe('format', () => {
  describe('empty', () => {
    expect(
      format({
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
                    added: [{role: 'user'}],
                    modified: [],
                    deleted: []
                  }
                }
              )
            ],
            deleted: []
          }
        })
      ).toHTMLValidate()
    })
  })
})
