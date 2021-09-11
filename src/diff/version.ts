import {ConvertedMetadataVersion} from '../load/types'
import {renderTemplate} from './functions'
import {VERSION_TEMPLATE} from './templates'
import {VersionChange} from './types'

export function diffVersion(
  oldConvertedFrom: ConvertedMetadataVersion,
  newConvertedFrom: ConvertedMetadataVersion
): VersionChange {
  if (2 === oldConvertedFrom && !newConvertedFrom) {
    return 3
  }
}

export function formatVersion(version: VersionChange): string {
  if (!version) {
    return ''
  }

  return renderTemplate(VERSION_TEMPLATE, {version})
}
