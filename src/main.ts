import * as core from '@actions/core'
import * as github from '@actions/github'

import {diff, format} from './diff'

import {GitHubLoader} from './load/GitHubLoader'
import {WorkspaceLoader} from './load/WorkspaceLoader'

async function run(): Promise<void> {
  try {
    const projectDir = core.getInput('project_dir')

    core.startGroup(`Loading old metadata in: ${projectDir}`)
    const oldMetadata = await new GitHubLoader(
      github.getOctokit(core.getInput('github_token')),
      github.context.repo,
      process.env.GITHUB_BASE_REF ?? ''
    ).load(projectDir, true)
    core.endGroup()

    core.startGroup(`Loading new metadata in: ${projectDir}`)
    const newMetadata = await new WorkspaceLoader(
      process.env.GITHUB_WORKSPACE ?? ''
    ).load(projectDir)
    core.endGroup()

    const changes = diff(oldMetadata, newMetadata, {
      hasuraEndpoint: core.getInput('hasura_endpoint')
    })
    const changeHtml = format(changes)

    core.info('Writing job summary')
    await core.summary.addRaw(changeHtml).addEOL().write()

    core.setOutput('change_html', changeHtml)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      core.debug(error.stack)
    }
  }
}

run()
