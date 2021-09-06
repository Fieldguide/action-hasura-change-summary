import * as core from '@actions/core'
import {HasuraMetadataLatest} from './../load/types'
import {renderTemplate, tablesFromMetadata} from './functions'
import {diffTableEntries, formatTableEntries} from './tables'
import {CHANGE_TEMPLATE} from './templates'
import {Changes, DiffOptions} from './types'

export function diff(
  oldMetadata: HasuraMetadataLatest,
  newMetadata: HasuraMetadataLatest,
  options: DiffOptions = {}
): Changes {
  core.debug(`Diff options:\n${JSON.stringify(options, null, 2)}`)

  core.startGroup('Diffing table metadata')
  const tables = diffTableEntries(
    tablesFromMetadata(oldMetadata),
    tablesFromMetadata(newMetadata),
    options
  )
  core.endGroup()

  return {tables}
}

export function format(changes: Changes): string {
  const tables = formatTableEntries(changes.tables)

  if (!tables) {
    return ''
  }

  return renderTemplate(CHANGE_TEMPLATE, {tables})
}
