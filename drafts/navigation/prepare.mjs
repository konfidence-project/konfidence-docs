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
function adaptLinks(markdown, origin, routes, assets, fragments) {
  function destination(url) {
    const local = url.replace(/^https:\/\/konfidence\.cloud\/docs\//, '/docs/')
    if (/^(?:[\w+.-]+:|\/\/|\?)/.test(local)) return url
    const [, path, suffix] = /^([^#?]*)(.*)$/.exec(local)
    if (path.startsWith('/') && !path.startsWith('/docs/')) return url
    const original = !path ? origin : path.startsWith('/docs/')
      ? path.slice('/docs/'.length)
      : posix.join(posix.dirname(origin), path)
    for (const candidate of [original, original + '.md', posix.join(original, 'index.md')]) {
      if (fragments[candidate + suffix]) return '/' + fragments[candidate + suffix].replace(/\.md(?=#|$)/, '')
      if (!path) return url
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
        const prefix = attribute === 'href' && /^\/(?!\/|platforms\/)/.test(path) ? '/platforms' : ''
        return attribute + '=' + quote + prefix + path + quote
      })
  }).join('')
}

// Explicit content overrides hold the reviewed splits. Other pages still use
// the original sources. Both resolve links relative to their source location.
function sourcePage(path, docs, routes, assets, fragments, content) {
  const origin = relative(docs, path).split(sep).join('/')
  const override = join(content, origin)
  const input = !origin.startsWith('../') && existsSync(override) ? override : path
  const markdown = readFileSync(input, 'utf8').replace(
    /<!--@include:\s*([^>\n]+?)\s*-->/g,
    (_match, include) => sourcePage(resolve(dirname(path), include), docs, routes, assets, fragments, content),
  )
  return adaptLinks(markdown, origin, routes, assets, fragments)
}

// Import the maintained documentation instead of keeping edited page copies.
// content/ contains explicit editorial drafts; pages/ contains selection screens.
export function navigationSources(root) {
  const docs = resolve(root, '../../src/docs')
  const pages = join(root, 'pages')
  const content = join(root, 'content')
  const output = join(root, '.generated')
  const routeFile = join(root, 'routes.json')
  const fragmentFile = join(root, 'fragments.json')
  const homepage = resolve(docs, '../index.md')
  const contributing = resolve(docs, '../../CONTRIBUTING.md')

  function prepare() {
    const routes = JSON.parse(readFileSync(routeFile, 'utf8'))
    const fragments = JSON.parse(readFileSync(fragmentFile, 'utf8'))
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
      routes[origin] = origin.replace('extend-customize/', 'community/')
    }
    const destinations = new Set()
    for (const [origin, destination] of Object.entries(routes)) {
      // The original docs index only redirects to the Quickstart.
      if (origin === 'index.md') continue
      if (destinations.has(destination)) throw new Error('Duplicate documentation route: ' + destination)
      destinations.add(destination)
      write(destination, sourcePage(join(docs, origin), docs, routes, assets, fragments, content))
    }
    for (const asset of assets) write(join('_media/docs', asset), readFileSync(join(docs, asset)))
    write('reference/api.json', readFileSync(join(docs, 'reference/api.json')))
    write('index.md', readFileSync(homepage))
    for (const page of filesIn(pages)) {
      const destination = relative(pages, page)
      if (destinations.has(destination)) throw new Error('A preview page overrides original content: ' + destination)
      write(destination, readFileSync(page))
    }
    for (const file of filesIn(output)) {
      if (!expected.has(file)) unlinkSync(file)
    }
  }

  prepare()
  return {
    name: 'navigation-draft-sources',
    configureServer(server) {
      const inputs = [pages, docs, content, routeFile, fragmentFile, homepage, contributing]
      server.watcher.add(inputs)
      server.watcher.on('all', (_event, path) => {
        if (inputs.some(input => path === input || path.startsWith(input + sep))) prepare()
      })
    },
  }
}
