[![ci](https://github.com/Fieldguide/action-hasura-change-summary/actions/workflows/ci.yml/badge.svg)](https://github.com/Fieldguide/action-hasura-change-summary/actions/workflows/ci.yml)

# Hasura Change Summary

[GitHub Action](https://github.com/features/actions) to generate readable [Hasura](https://hasura.io/) metadata change summaries.

<img src="https://i.imgur.com/icF3zBn.png" alt="Hasura Change Summary example comment" width="699">

## Usage

For example, with marocchino's [Sticky Pull Request Comment](https://github.com/marocchino/sticky-pull-request-comment):

```yaml
name: ci
on:
  pull_request:
    paths:
      - 'metadata/*.yaml'
jobs:
  hasura-change-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: Fieldguide/action-hasura-change-summary@v2
        id: hasura-change
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          hasura_endpoint: https://my-pr-${{ github.event.number }}-app.example.com
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          message: ${{ steps.hasura-change.outputs.change_html }}
```

## Inputs

| input              | description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| **`github_token`** | `GITHUB_TOKEN` secret                                                     |
| `project_dir`      | Hasura project directory, relative to `GITHUB_WORKSPACE`; defaults to `.` |
| `hasura_endpoint`  | Hasura GraphQL engine http(s) endpoint, used for deep console links       |

## Outputs

| output        | description         |
| ------------- | ------------------- |
| `change_html` | HTML change summary |
