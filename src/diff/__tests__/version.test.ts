import {diffVersion, formatVersion} from '../version'

describe('diffVersion', () => {
  test('v2 -> v2', () => {
    expect(diffVersion(2, 2)).toBeUndefined()
  })

  test('v2 -> v3', () => {
    expect(diffVersion(2, undefined)).toStrictEqual(3)
  })

  test('v3 -> v3', () => {
    expect(diffVersion(undefined, undefined)).toBeUndefined()
  })
})

describe('formatVersion', () => {
  test('not converted', () => {
    expect(formatVersion(undefined)).toStrictEqual('')
  })

  test('converted', () => {
    expect(formatVersion(3)).toStrictEqual(
      `<h3>Upgraded Config</h3>
<p>
  This project upgraded to <code>config v3</code>! Read about
  <a
    href="https://hasura.io/docs/latest/graphql/core/migrations/upgrade-v3.html#what-has-changed"
    >what has changed</a
  >.
</p>`
    )
  })
})
