export const TABLE_TEMPLATE = `<h3>{{heading}}</h3>
<ul>
  {{#tables}}
  <li>
    {{#table}}
      <p>
        {{#_links}}<a href="{{console.href}}">{{/_links}}
        <code>{{schema}}.{{name}}</code>
        {{#_links}}</a>{{/_links}} {{#permissions}}permissions:{{/permissions}}
      </p>
      {{#permissions}}
        {{> permissions}}
      {{/permissions}}
    {{/table}}
  </li>
  {{/tables}}
</ul>
`

export const PERMISSIONS_TEMPLATE = `<table>
<thead>
  <tr>
    {{#headRow}}
    <th>{{.}}</th>
    {{/headRow}}
  </tr>
</thead>
<tbody>
  {{#body}}
    <tr>
      <th>{{role}}</th>
      {{#cells}}
        <td>{{.}}</td>
      {{/cells}}
    </tr>
  {{/body}}
</tbody>
</table>
`
