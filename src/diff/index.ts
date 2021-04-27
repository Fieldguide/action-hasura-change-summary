import * as core from '@actions/core'
import {HasuraMetadataV2} from '@hasura/metadata'
import {readFileSync} from 'fs'
import {renderTemplate} from './format'
import {diffTableEntries, formatTableEntries} from './tables'
import {Changes, DiffOptions} from './types'

export function diff(
  oldMetadata: HasuraMetadataV2,
  newMetadata: HasuraMetadataV2,
  options: DiffOptions = {}
): Changes {
  core.debug(`Diff options:\n${JSON.stringify(options, null, 2)}`)

  return {
    tables: diffTableEntries(oldMetadata.tables, newMetadata.tables, options)
  }
}

export function format(changes: Changes): string {
  const tables = formatTableEntries(changes.tables)

  if (!tables) {
    return ''
  }

  return renderTemplate(
    readFileSync(require.resolve('./change.mustache'), 'utf-8'),
    {tables}
  )
}
