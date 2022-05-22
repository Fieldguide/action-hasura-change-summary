export const TABLE_TEMPLATE = `<h3>{{heading}} ({{tables.length}})</h3>
<ul>
  {{#tables}}
  <li>
    {{#table}}
      <p>
        {{#_links}}<a href="{{console.href}}">{{/_links}}<code>{{#database}}{{.}}.{{/database}}{{schema}}.{{name}}</code>{{#_links}}</a>{{/_links}}
        {{#permissions}}permissions:{{/permissions}}
      </p>
      {{#permissions}}
        {{> permissions}}
      {{/permissions}}
    {{/table}}
  </li>
  {{/tables}}
</ul>
`
