import * as core from '@actions/core'
import * as github from '@actions/github'
import {diffV2} from './diff'
import {GitHubLoader} from './load/GitHubLoader'
import {MetadataProperty} from './load/types'
import {WorkspaceLoader} from './load/WorkspaceLoader'

export const PROPERTIES: MetadataProperty[] = ['tables', 'version']

async function run(): Promise<void> {
  try {
    const projectDir = core.getInput('project_dir')

    const oldMetadata = await new GitHubLoader(
      github.getOctokit(core.getInput('github_token')),
      github.context.repo,
      process.env.GITHUB_BASE_REF || ''
    ).load(projectDir, PROPERTIES)

    const newMetadata = await new WorkspaceLoader(
      process.env.GITHUB_WORKSPACE ?? ''
    ).load(projectDir, PROPERTIES)

    const diff = diffV2(oldMetadata, newMetadata)

    core.debug(JSON.stringify(diff, null, 2))
  } catch (error) {
    core.setFailed(error.message)
    core.debug(error.stack)
  }
}

run()
