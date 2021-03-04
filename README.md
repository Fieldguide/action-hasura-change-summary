[![build-test](https://github.com/namoscato/action-hasura-change-summary/actions/workflows/test.yml/badge.svg)](https://github.com/namoscato/action-hasura-change-summary/actions/workflows/test.yml)

# Hasura Change Summary

[GitHub Action](https://github.com/features/actions) to generate readable [Hasura](https://hasura.io/) metadata change summaries.

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
      - uses: namoscato/action-hasura-change-summary@v1
        id: hasura-change
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          message: ${{ steps.hasura-change.outputs.change_markdown }}
```

## Inputs

| input              | default | description                                              |
| ------------------ | ------- | -------------------------------------------------------- |
| **`github_token`** |         | `GITHUB_TOKEN` secret                                    |
| `project_dir`      | `'.'`   | Hasura project directory, relative to `GITHUB_WORKSPACE` |

## Outputs

| output            | description             |
| ----------------- | ----------------------- |
| `change`          | Structured change JSON  |
| `change_markdown` | Markdown change summary |
