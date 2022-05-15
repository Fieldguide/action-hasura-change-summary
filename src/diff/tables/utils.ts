import {ChangeType, ConsoleLink} from './../types'

export function consoleLinkFromUrl(url: string): ConsoleLink {
  return {
    console: {href: url}
  }
}

export function iconFromChangeType(changeType: ChangeType): string {
  switch (changeType) {
    case 'added':
      return '➕'
    case 'modified':
      return '<sup>➕</sup>/<sub>➖</sub>'
    case 'deleted':
      return '➖'
    default:
      assertNeverChangeType(changeType)
  }
}

export function assertNeverChangeType(changeType: never): never {
  throw new Error(`Unexpected change type: ${changeType}`)
}
