import * as Mustache from 'mustache'
import prettier from 'prettier'

export function renderTemplate(
  template: string,
  view: any,
  partials: Record<string, string> = {}
): string {
  return prettier.format(Mustache.render(template, view, partials), {
    parser: 'html'
  })
}
