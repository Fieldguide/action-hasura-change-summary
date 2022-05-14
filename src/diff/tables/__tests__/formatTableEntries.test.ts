import {formatTableEntries} from '..'
import {tableEntryChange} from './utils'

test('added', () => {
  expect(
    formatTableEntries({
      added: [
        tableEntryChange({
          schema: 'public',
          name: 'users'
        }),
        tableEntryChange({
          schema: 'public',
          name: 'todos',
          _links: {
            console: {href: 'URL'}
          }
        })
      ],
      modified: [],
      deleted: []
    })
  ).toStrictEqual(
    `<h3>Tracked Tables (2)</h3>
<ul>
  <li>
    <p>
      <code>public.users</code>
    </p>
  </li>
  <li>
    <p>
      <a href="URL"><code>public.todos</code></a>
    </p>
  </li>
</ul>`
  )
})

test('added and modified', () => {
  expect(
    formatTableEntries({
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
    })
  ).toStrictEqual(
    `<h3>Tracked Tables (1)</h3>
<ul>
  <li>
    <p>
      <a href="URL"><code>public.users</code></a>
    </p>
  </li>
</ul>
<h3>Updated Tables (1)</h3>
<ul>
  <li>
    <p>
      <code>public.todos</code>
      permissions:
    </p>
    <table>
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">insert</th>
          <th scope="col">select</th>
          <th scope="col">update</th>
          <th scope="col">delete</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">user</th>
          <td align="center"></td>
          <td align="center">➕</td>
          <td align="center"></td>
          <td align="center"></td>
        </tr>
      </tbody>
    </table>
  </li>
</ul>`
  )
})

test('deleted', () => {
  expect(
    formatTableEntries({
      added: [],
      modified: [],
      deleted: [
        tableEntryChange({
          database: 'default',
          schema: 'public',
          name: 'users'
        })
      ]
    })
  ).toStrictEqual(`<h3>Untracked Tables (1)</h3>
<ul>
  <li>
    <p>
      <code>default.public.users</code>
    </p>
  </li>
</ul>`)
})
