import yaml from 'js-yaml'
import {isArray, isObject, isString} from 'lodash'
import {dirname, join} from 'path'
import {FileReader} from './types'

const INCLUDE_PREFIX = '!include '

export async function load(path: string, read: FileReader): Promise<any> {
  return await loadContent(yaml.load(await read(path)), dirname(path), read)
}

export async function loadContent(
  content: any,
  directory: string,
  read: FileReader
): Promise<any> {
  const loadArrayValue = async (value: any): Promise<any> => {
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

    return result
  }

  if (isObject(content)) {
    for (const [key, value] of Object.entries(content)) {
      const includePath = includePathFromValue(value)

      if (includePath) {
        const path = join(directory, includePath)

        ;(content as any)[key] = await loadContent(
          yaml.load(await read(path)),
          dirname(path),
          read
        )
      }
    }
  }

  return content
}

export function includePathFromValue(value: any): string | undefined {
  if (isString(value) && value.startsWith(INCLUDE_PREFIX)) {
    return value.substr(INCLUDE_PREFIX.length)
  }
}
