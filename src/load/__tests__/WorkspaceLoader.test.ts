import {WorkspaceLoader} from '../WorkspaceLoader'

describe('WorkspaceLoader', () => {
  let target: WorkspaceLoader

  beforeEach(() => {
    target = new WorkspaceLoader('./')
  })

  test('load', () => {
    target.load('fixtures').then(metadata => {
      expect(metadata).toStrictEqual({
        version: 2,
        tables: [
          {
            table: {
              schema: 'public',
              name: 'users'
            }
          }
        ]
      })
    })
  })
})
