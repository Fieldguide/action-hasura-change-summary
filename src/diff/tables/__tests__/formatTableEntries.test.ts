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
              added: [
                {
                  role: 'user',
                  columns: {
                    added: ['created_at', 'name'],
                    modified: true,
                    deleted: []
                  }
                },
                {
                  role: 'manager',
                  columns: {
                    added: ['created_at', 'name'],
                    modified: true,
                    deleted: []
                  }
                }
              ],
              modified: [],
              deleted: []
            },
            update_permissions: {
              added: [],
              modified: [
                {
                  role: 'user',
                  columns: {
                    added: ['name'],
                    modified: true,
                    deleted: ['created_at', 'id']
                  }
                }
              ],
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
          <th scope="row">manager</th>
          <td align="center"></td>
          <td align="center">➕</td>
          <td align="center"></td>
          <td align="center"></td>
        </tr>
        <tr>
          <th scope="row">user</th>
          <td align="center"></td>
          <td align="center">➕</td>
          <td align="center"><sup>➕</sup>/<sub>➖</sub></td>
          <td align="center"></td>
        </tr>
      </tbody>
    </table>
    <details>
      <summary>7 updated column permissions</summary>
      <table>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">insert</th>
            <th scope="col">select</th>
            <th scope="col">update</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">manager</th>
            <td></td>
            <td rowspan="0">➕ created_at<br />➕ name</td>
            <td></td>
          </tr>
          <tr>
            <th scope="row">user</th>
            <td></td>
            <td>➖ <del>created_at</del><br />➖ <del>id</del><br />➕ name</td>
          </tr>
        </tbody>
      </table>
    </details>
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
