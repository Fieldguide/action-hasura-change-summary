import {WorkspaceLoader} from '../WorkspaceLoader'

describe('WorkspaceLoader', () => {
  let target: WorkspaceLoader

  beforeEach(() => {
    target = new WorkspaceLoader('./')
  })

  test('load v2', async () => {
    const metadata = await target.load('./__tests__/fixtures/v2')

    expect(metadata).toStrictEqual({
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
  })

  test('load v3', async () => {
    const metadata = await target.load('./__tests__/fixtures/v3')

    expect(metadata).toStrictEqual({
      version: 3,
      databases: [
        {
          name: 'default',
          kind: 'postgres',
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
  })
})
