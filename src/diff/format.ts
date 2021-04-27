import {readFileSync} from 'fs'
import * as Mustache from 'mustache'
import prettier from 'prettier'

export function renderTemplate(
  path: string,
  view: any,
  partialPaths: Record<string, string> = {}
): string {
  return prettier.format(
    Mustache.render(
      readFileSync(path, 'utf8'),
      view,
      Object.entries(partialPaths).reduce<Record<string, string>>(
        (partials, [name, _path]) => {
          partials[name] = readFileSync(_path, 'utf8')

          return partials
        },
        {}
      )
    ),
    {parser: 'html'}
  )
}
