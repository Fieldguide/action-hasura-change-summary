import * as core from '@actions/core'
import {HasuraMetadataV2} from '@hasura/metadata'
import {renderTemplate} from './functions'
import {diffTableEntries, formatTableEntries} from './tables'
import {CHANGE_TEMPLATE} from './templates'
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

  return renderTemplate(CHANGE_TEMPLATE, {tables})
}
