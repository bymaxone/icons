/**
 * @fileoverview The metadata of every icon and brand mark, as data.
 * Written by `pnpm generate` from icons/meta and categories.json: edit the sources, never this file.
 * @layer Generated
 */

/** Every icon name, in name order. */
export const ICON_NAMES = [
  'check',
  'close',
  'file',
  'folder',
  'home',
  'lightning',
  'play',
  'plus',
  'scene',
  'search',
  'settings',
  'user'
] as const

/** Every brand name, in name order. */
export const BRAND_NAMES = [] as const

/** Every category name, in the order of categories.json. */
export const CATEGORY_NAMES = [
  'navigation',
  'actions',
  'media-video',
  'audio-voice',
  'files',
  'status',
  'credits-billing',
  'people-roles',
  'formats',
  'editor-canvas',
  'ai-agent',
  'system'
] as const

/** The categories, in the order of categories.json. */
export const CATEGORIES = [
  { name: 'navigation', title: 'Navigation' },
  { name: 'actions', title: 'Actions' },
  { name: 'media-video', title: 'Media and video' },
  { name: 'audio-voice', title: 'Audio and voice' },
  { name: 'files', title: 'Files' },
  { name: 'status', title: 'Status' },
  { name: 'credits-billing', title: 'Credits and billing' },
  { name: 'people-roles', title: 'People and roles' },
  { name: 'formats', title: 'Formats' },
  { name: 'editor-canvas', title: 'Editor and canvas' },
  { name: 'ai-agent', title: 'AI and agent' },
  { name: 'system', title: 'System' }
] as const

/** The metadata of every icon, keyed by name. */
export const ICONS = {
  check: {
    tags: ['tick', 'done', 'confirm', 'success'],
    categories: ['actions'],
    useCases: ['Confirms an action', 'Marks an item as done'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  close: {
    tags: ['x', 'cross', 'dismiss', 'cancel'],
    categories: ['actions'],
    useCases: ['Closes a dialog or panel', 'Removes a chip or tag'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  file: {
    tags: ['document', 'page', 'paper', 'sheet'],
    categories: ['files'],
    useCases: ['Represents a document in a list', 'Opens a file picker'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  folder: {
    tags: ['directory', 'collection', 'group', 'project'],
    categories: ['files'],
    useCases: ['Represents a folder in a file tree', 'Groups related items'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  home: {
    tags: ['house', 'start', 'main page', 'dashboard home'],
    categories: ['navigation'],
    useCases: ['Links to the start page of an app', 'Marks the home tab of a navigation bar'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  lightning: {
    tags: ['bolt', 'credit', 'energy', 'power'],
    categories: ['credits-billing'],
    useCases: ['Shows a credit balance', 'Marks an action that spends credits'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  play: {
    tags: ['start', 'media', 'video', 'resume'],
    categories: ['media-video'],
    useCases: ['Starts playback of a video or audio track', 'Runs a preview'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  plus: {
    tags: ['add', 'new', 'create', 'more'],
    categories: ['actions'],
    useCases: ['Creates a new item', 'Adds an entry to a list'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  scene: {
    tags: ['clapperboard', 'take', 'episode', 'film'],
    categories: ['media-video'],
    useCases: ['Represents a scene of an episode', 'Opens the scene editor'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  search: {
    tags: ['magnifier', 'find', 'lookup', 'query'],
    categories: ['navigation'],
    useCases: ['Opens a search field', 'Labels a search input'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  settings: {
    tags: ['gear', 'cog', 'preferences', 'configuration'],
    categories: ['navigation'],
    useCases: ['Opens the settings page', 'Shows configuration options of an item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  user: {
    tags: ['person', 'account', 'profile', 'avatar'],
    categories: ['people-roles'],
    useCases: ['Links to the user profile', 'Stands in for a missing avatar'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  }
} as const

/** The metadata of every brand mark, keyed by name. */
export const BRANDS = {} as const
