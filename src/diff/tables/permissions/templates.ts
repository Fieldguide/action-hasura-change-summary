export const PERMISSIONS_TEMPLATE = `{{#table}}
<table>
<thead>
  <tr>
    {{#headRow}}
    <th scope="col">{{.}}</th>
    {{/headRow}}
  </tr>
</thead>
<tbody>
  {{#body}}
    <tr>
      <th scope="row">{{role}}</th>
      {{#cells}}
        <td align="center">{{{.}}}</td>
      {{/cells}}
    </tr>
  {{/body}}
</tbody>
</table>
{{/table}}
{{#columnPermissions}}
  {{> columnPermissions}}
{{/columnPermissions}}
`

export const COLUMN_PERMISSIONS_TEMPLATE = `<details>
<summary>{{summary}}</summary>
{{#table}}
<table>
<thead>
  <tr>
    {{#headRow}}
    <th scope="col">{{.}}</th>
    {{/headRow}}
  </tr>
</thead>
<tbody>
  {{#body}}
    <tr>
      <th scope="row">{{role}}</th>
      {{#cells}}
        <td{{#rowspan}} rowspan="0"{{/rowspan}}>{{{content}}}</td>
      {{/cells}}
    </tr>
  {{/body}}
</tbody>
</table>
{{/table}}
</details>
`
