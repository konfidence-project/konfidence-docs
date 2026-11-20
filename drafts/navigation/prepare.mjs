import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path'

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : [path]
  })
}

// Inherited pages keep their source directory for resolving links, even when
// a guide moves to a different section in the preview.
function adaptLinks(markdown, origin, routes, assets) {
  function destination(url) {
    const local = url.replace(/^https:\/\/konfidence\.cloud\/docs\//, '/docs/')
    if (/^(?:[\w+.-]+:|\/\/|[?#])/.test(local)) return url
    const [, path, suffix] = /^([^#?]*)(.*)$/.exec(local)
    if (path.startsWith('/') && !path.startsWith('/docs/')) return url
    const original = path.startsWith('/docs/')
      ? path.slice('/docs/'.length)
      : posix.join(posix.dirname(origin), path)
    for (const candidate of [original, original + '.md', posix.join(original, 'index.md')]) {
      if (routes[candidate]) return '/' + routes[candidate].slice(0, -3) + suffix
    }
    return assets.has(original) ? '/_media/docs/' + original + suffix : url
  }

  const parts = markdown.split(/(^[ \t]*`{3,}[^\n]*\n[\s\S]*?^[ \t]*`{3,}[ \t]*$)/gm)
  return parts.map((part, i) => {
    if (i % 2) return part
    return part
      .replace(/(\]\()([^\s)]+)/g, (_, prefix, url) => prefix + destination(url))
      .replace(/^(\[[^\]]+\]:\s*)(\S+)/gm, (_, prefix, url) => prefix + destination(url))
      .replace(/\b(href|src)=(["'])(.*?)\2/g, (_, attribute, quote, url) => {
        const path = destination(url)
        const prefix = attribute === 'href' && /^\/(?!\/)/.test(path) ? '/platforms' : ''
        return attribute + '=' + quote + prefix + path + quote
      })
  }).join('')
}

function inheritedPage(markdown, origin, info, routes, assets) {
  const frontmatter = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(markdown)
  const fields = (frontmatter?.[1] ?? '').split('\n')
    .filter(line => !/^(?:title|editLink|lastUpdated):/.test(line))
  const body = markdown.slice(frontmatter?.[0].length ?? 0).trimStart()
  const metadata = [
    '---', 'title: ' + JSON.stringify(info.title), 'scope: ' + JSON.stringify(info.scope),
    'editLink: false', 'lastUpdated: false', ...fields, '---',
  ]
  return metadata.join('\n') + '\n' + adaptLinks(body, origin, routes, assets)
}

// Assemble only the reader-facing site. Changed pages have editable sources
// under pages/. Reference imports, ADRs and illustrations stay in src/docs/.
export function navigationSources(root) {
  const docs = resolve(root, '../../src/docs')
  const pages = join(root, 'pages')
  const output = join(root, '.generated')
  const routeFile = join(root, 'routes.json')
  const inheritedFile = join(root, 'inherited.json')

  function prepare() {
    const routes = JSON.parse(readFileSync(routeFile, 'utf8'))
    const inherited = JSON.parse(readFileSync(inheritedFile, 'utf8'))
    const originals = filesIn(docs).map(path => relative(docs, path).split(sep).join('/'))
    const assets = new Set(originals.filter(path => !['.md', '.json'].includes(extname(path))))
    const expected = new Set()
    function write(name, content) {
      const path = join(output, name)
      expected.add(path)
      if (existsSync(path) && readFileSync(path).equals(Buffer.from(content))) return
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, content)
    }

    for (const origin of originals.filter(path => /^extend-customize\/decisions\/adr-[^/]+\.md$/.test(path))) {
      const markdown = readFileSync(join(docs, origin), 'utf8')
      const title = /^title:\s*"?(.+?)"?\s*$/m.exec(markdown)?.[1]
      if (!title) throw new Error('Missing ADR title in ' + origin)
      routes[origin] = origin.replace('extend-customize/', 'community/')
      inherited[origin] = { title, scope: 'Engineering decisions' }
    }
    for (const [origin, info] of Object.entries(inherited)) {
      const markdown = readFileSync(join(docs, origin), 'utf8')
      write(routes[origin], inheritedPage(markdown, origin, info, routes, assets))
    }
    for (const asset of assets) write(join('_media/docs', asset), readFileSync(join(docs, asset)))
    write('reference/api.json', readFileSync(join(docs, 'reference/api.json')))
    for (const page of filesIn(pages)) write(relative(pages, page), readFileSync(page))
    for (const file of filesIn(output)) {
      if (!expected.has(file)) unlinkSync(file)
    }
  }

  prepare()
  return {
    name: 'navigation-draft-sources',
    configureServer(server) {
      const inputs = [pages, docs, routeFile, inheritedFile]
      server.watcher.add(inputs)
      server.watcher.on('all', (_event, path) => {
        if (inputs.some(input => path === input || path.startsWith(input + sep))) prepare()
      })
    },
  }
}
