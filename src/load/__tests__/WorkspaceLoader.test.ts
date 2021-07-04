import {WorkspaceLoader} from '../WorkspaceLoader'

describe('WorkspaceLoader', () => {
  let target: WorkspaceLoader

  beforeEach(() => {
    target = new WorkspaceLoader('./')
  })

  test('load v2', async () => {
    const metadata = await target.load('./__tests__/fixtures/v2')

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
