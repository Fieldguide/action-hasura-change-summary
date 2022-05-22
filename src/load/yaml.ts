import {dirname, join} from 'path'
import {isArray, isObject, isString} from 'lodash'

import {FileReader} from './types'
import yaml from 'js-yaml'

const INCLUDE_PREFIX = '!include '

export async function load<T>(path: string, read: FileReader): Promise<T> {
  const str = await read(path)

  return loadContent(yaml.load(str), dirname(path), read)
}

export async function loadContent<T>(
  content: unknown,
  directory: string,
  read: FileReader
): Promise<T> {
  const loadArrayValue = async (value: unknown): Promise<unknown> => {
    const includePath = includePathFromValue(value)

    if (includePath) {
      const path = join(directory, includePath)

      return loadContent(yaml.load(await read(path)), dirname(path), read)
    }

    return loadContent(value, directory, read)
  }

  if (isArray(content)) {
    const result = []

    for (const value of content) {
      result.push(await loadArrayValue(value))
    }

    return result as unknown as T
  }

  if (isObject(content)) {
    for (const [key, value] of Object.entries(content)) {
      const includePath = includePathFromValue(value)

      if (includePath) {
        const path = join(directory, includePath)

        ;(content as Record<string, unknown>)[key] = await loadContent(
          yaml.load(await read(path)),
          dirname(path),
          read
        )
      }
    }
  }

  return content as T
}

export function includePathFromValue(value: unknown): string | undefined {
  if (isString(value) && value.startsWith(INCLUDE_PREFIX)) {
    return value.substring(INCLUDE_PREFIX.length)
  }
}
