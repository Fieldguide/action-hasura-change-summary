import * as Mustache from 'mustache'
import {readFileSync} from 'fs'
import {join} from 'path'
import prettier from 'prettier'

export function renderTemplate(
  paths: string[],
  view: any,
  partialPaths: Record<string, string[]> = {}
): string {
  return prettier.format(
    Mustache.render(
      readPaths(paths),
      view,
      Object.entries(partialPaths).reduce<Record<string, string>>(
        (partials, [name, _paths]) => {
          partials[name] = readPaths(_paths)

          return partials
        },
        {}
      )
    ),
    {parser: 'html'}
  )
}

export function readPaths(paths: string[]): string {
  return readFileSync(join(...paths), 'utf8')
}
