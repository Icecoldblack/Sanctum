import type { Disguise } from '@/features/disguise/presets'
import { renderIcon } from '@/features/disguise/renderIcon'

/** Must match the inline script in index.html. */
export const SHELL_CACHE_KEY = 'app-shell'

let generation = 0

/**
 * Makes the browser tab, bookmarks, and "Add to Home Screen" show the disguise: the document
 * title, favicon, iOS home-screen tags, theme color, and a generated web-app manifest.
 */
export async function applyDisguise(disguise: Disguise): Promise<void> {
  const current = ++generation
  document.title = disguise.name

  const [favicon, appleIcon, icon192, icon512, maskable512] = await Promise.all([
    renderIcon(disguise.icon, 64, 'rounded', disguise.name),
    renderIcon(disguise.icon, 180, 'full-bleed', disguise.name),
    renderIcon(disguise.icon, 192, 'rounded', disguise.name),
    renderIcon(disguise.icon, 512, 'rounded', disguise.name),
    renderIcon(disguise.icon, 512, 'full-bleed', disguise.name),
  ])
  // A newer disguise was chosen while these rendered.
  if (current !== generation) return

  const themeColor = disguise.icon.kind === 'symbol' ? disguise.icon.background : '#fafaf5'

  setLink('icon', favicon, 'image/png')
  try {
    // Read by the inline script in index.html so the next load shows the disguise from the first
    // paint, instead of flashing the real name while the app boots.
    localStorage.setItem(SHELL_CACHE_KEY, JSON.stringify({ title: disguise.name, icon: favicon, theme: themeColor }))
  } catch {
    // Not critical.
  }
  setLink('apple-touch-icon', appleIcon)
  setMeta('apple-mobile-web-app-title', disguise.name)
  setMeta('application-name', disguise.name)
  setMeta('apple-mobile-web-app-capable', 'yes')
  setMeta('mobile-web-app-capable', 'yes')
  setMeta('theme-color', themeColor)

  const origin = window.location.origin
  const manifest = {
    id: '/',
    name: disguise.name,
    short_name: disguise.name,
    // Absolute URLs: a data: manifest has no base URL of its own.
    start_url: `${origin}/`,
    scope: `${origin}/`,
    display: 'standalone',
    background_color: '#fafaf5',
    theme_color: themeColor,
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  setLink('manifest', `data:application/manifest+json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifest))}`)
}

function setLink(rel: string, href: string, type?: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  if (type) link.type = type
  else link.removeAttribute('type')
  link.href = href
}

function setMeta(name: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}
