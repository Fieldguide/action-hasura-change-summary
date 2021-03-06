import {readFileSync} from 'fs'
import {load} from 'js-yaml'
import {join} from 'path'

export function loadFixture<T>(path: string): T {
  const fixture = load(
    readFileSync(join(__dirname, 'fixtures', path), 'utf8')
  ) as unknown

  return fixture as T
}
