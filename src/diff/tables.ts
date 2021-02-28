import {TableEntry} from '@hasura/metadata'
import * as jsondiffpatch from 'jsondiffpatch'
import {forEach} from 'lodash'
import {isAddition, isDeletion, isTableEntry, TableChange} from './types'

const diffPatcher = jsondiffpatch.create({
  objectHash(object: any, index: number) {
    if (isTableEntry(object)) {
      return `table:${object.table.schema}:${object.table.name}`
    }

    return `index:${index}`
  }
})

export function diffTables(
  oldTables: TableEntry[],
  newTables: TableEntry[]
): TableChange {
  const tablesDelta = diffPatcher.diff(oldTables, newTables)
  const change: TableChange = {
    tracked: [],
    untracked: [],
    updated: []
  }

  if (undefined === tablesDelta) {
    return change
  }

  forEach(tablesDelta, (delta: any, index: string) => {
    const tableIndex = Number(index)

    if (isAddition<TableEntry>(delta)) {
      change.tracked.push(delta[0].table)
    } else if (isDeletion<TableEntry>(delta)) {
      change.untracked.push(delta[0].table)
    } else if (isFinite(tableIndex)) {
      change.updated.push(newTables[tableIndex].table)
    }
  })

  return change
}
