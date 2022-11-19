[![ci](https://github.com/Fieldguide/action-hasura-change-summary/actions/workflows/ci.yml/badge.svg)](https://github.com/Fieldguide/action-hasura-change-summary/actions/workflows/ci.yml)

# Hasura Change Summary

[GitHub Action](https://github.com/features/actions) to generate readable [Hasura](https://hasura.io/) metadata change summaries.

<img src="https://user-images.githubusercontent.com/847532/169708857-5aed1ebb-76c4-43de-8309-469c0e8cf2f2.jpg" alt="Hasura Change Summary example comment" width="689">

## Features

This action currently supports changes to database table metadata including row-level and column-level permissions.

[Other metadata](https://hasura.io/docs/latest/graphql/core/migrations/reference/metadata-format/) such as actions, cron triggers, and remote schemas are not currently supported.

## Usage

For example, with marocchino's [Sticky Pull Request Comment](https://github.com/marocchino/sticky-pull-request-comment):

```yaml
name: ci

on:
  pull_request:
    paths:
      - 'metadata/**.yaml'

jobs:
  hasura-change-summary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Detect Hasura metadata changes
        uses: Fieldguide/action-hasura-change-summary@v2
        id: hasura-change-summary
        with:
          hasura_endpoint: https://my-pr-${{ github.event.number }}-app.example.com

      - name: Create or update summary comment
        uses: marocchino/sticky-pull-request-comment@v2
        if: steps.hasura-change-summary.outputs.change_html
        with:
          header: hasura-change-summary
          message: ${{ steps.hasura-change-summary.outputs.change_html }}
```

## Inputs

| input             | description                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github_token`    | Repository `GITHUB_TOKEN` or personal access token secret; defaults to [`github.token`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication) |
| `project_dir`     | Hasura project directory, relative to `GITHUB_WORKSPACE`; defaults to `.`                                                                                                  |
| `hasura_endpoint` | Hasura GraphQL engine http(s) endpoint, used for deep console links                                                                                                        |

## Outputs

| output        | description         |
| ------------- | ------------------- |
| `change_html` | HTML change summary |
