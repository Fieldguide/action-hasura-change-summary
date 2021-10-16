import * as core from '@actions/core'

import {Changes, DiffOptions} from './types'
import {diffTableEntries, formatTableEntries} from './tables'
import {diffVersion, formatVersion} from './version'
import {renderTemplate, tablesFromMetadata} from './functions'

import {CHANGE_TEMPLATE} from './templates'
import {HasuraMetadataLatest} from './../load/types'

export function diff(
  oldMetadata: HasuraMetadataLatest,
  newMetadata: HasuraMetadataLatest,
  options: DiffOptions = {}
): Changes {
  core.debug(`Diff options:\n${JSON.stringify(options, null, 2)}`)

  core.info('Diffing metadata version')
  const version = diffVersion(
    oldMetadata.__converted_from,
    newMetadata.__converted_from
  )

  core.startGroup('Diffing table metadata')
  const qualifyTableEntries = 2 !== newMetadata.__converted_from
  const tables = diffTableEntries(
    tablesFromMetadata(oldMetadata, qualifyTableEntries),
    tablesFromMetadata(newMetadata, qualifyTableEntries),
    options
  )
  core.endGroup()

  return {version, tables}
}

export function format(changes: Changes): string {
  const version = formatVersion(changes.version)
  const tables = formatTableEntries(changes.tables)

  if (!version && !tables) {
    return ''
  }

  return renderTemplate(CHANGE_TEMPLATE, {version, tables})
}
