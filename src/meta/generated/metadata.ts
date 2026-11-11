/**
 * @fileoverview The metadata of every icon and brand mark, as data.
 * Written by `pnpm generate` from icons/meta and categories.json: edit the sources, never this file.
 * @layer Generated
 */

/** Every icon name, in name order. */
export const ICON_NAMES = [
  'alert-circle',
  'alert-triangle',
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'check',
  'check-circle',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'clock',
  'close',
  'cloud-check',
  'copy',
  'dashboard',
  'download',
  'duplicate',
  'eye',
  'eye-off',
  'file',
  'filter',
  'folder',
  'folder-stack',
  'grip',
  'history',
  'home',
  'info',
  'library',
  'lightning',
  'link',
  'loader',
  'lock',
  'menu',
  'more-horizontal',
  'more-vertical',
  'pencil',
  'pin',
  'play',
  'plus',
  'queued',
  'redo',
  'refresh',
  'repair',
  'scene',
  'search',
  'settings',
  'share',
  'sidebar',
  'sort',
  'templates',
  'trash',
  'undo',
  'upload',
  'user',
  'version'
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
  'alert-circle': {
    tags: ['error', 'problem', 'exclamation', 'attention'],
    categories: ['status'],
    useCases: ['Shows an error message', 'Marks a failed item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'alert-triangle': {
    tags: ['warning', 'caution', 'danger', 'exclamation'],
    categories: ['status'],
    useCases: ['Shows a warning message', 'Marks a field that needs attention'],
    aliases: [{ name: 'warning', deprecated: false }],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'arrow-left': {
    tags: ['back', 'previous', 'left', 'return'],
    categories: ['navigation'],
    useCases: ['Goes back to the previous screen', 'Moves to the previous step of a flow'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'arrow-right': {
    tags: ['forward', 'next', 'right', 'continue'],
    categories: ['navigation'],
    useCases: ['Moves to the next step of a flow', 'Marks a call to action that continues'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'arrow-up-right': {
    tags: ['external', 'open', 'outbound', 'new tab'],
    categories: ['navigation'],
    useCases: ['Marks a link that leaves the app', 'Opens an item in a new tab'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  check: {
    tags: ['tick', 'done', 'confirm', 'success'],
    categories: ['actions'],
    useCases: ['Confirms an action', 'Marks an item as done'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'check-circle': {
    tags: ['success', 'done', 'complete', 'approved'],
    categories: ['status'],
    useCases: ['Shows that a task finished', 'Marks a step as complete'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'chevron-down': {
    tags: ['caret', 'expand', 'down', 'dropdown'],
    categories: ['navigation'],
    useCases: ['Opens a dropdown menu', 'Expands a collapsed section'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'chevron-left': {
    tags: ['caret', 'back', 'previous', 'left'],
    categories: ['navigation'],
    useCases: ['Goes back to the previous page', 'Moves a carousel to the previous item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'chevron-right': {
    tags: ['caret', 'forward', 'next', 'right'],
    categories: ['navigation'],
    useCases: ['Opens a nested menu item', 'Moves a carousel to the next item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'chevron-up': {
    tags: ['caret', 'collapse', 'up', 'expand less'],
    categories: ['navigation'],
    useCases: ['Collapses an open section', 'Moves a selection up a list'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  clock: {
    tags: ['time', 'duration', 'schedule', 'pending'],
    categories: ['status'],
    useCases: ['Shows a time or a duration', 'Marks an item that is scheduled'],
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
  'cloud-check': {
    tags: ['saved', 'synced', 'backup', 'cloud'],
    categories: ['status'],
    useCases: ['Shows that changes are saved', 'Marks a project as synced'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  copy: {
    tags: ['clipboard', 'copy to clipboard', 'cards'],
    categories: ['actions'],
    useCases: ['Copies a value to the clipboard', 'Copies a link or a prompt'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  dashboard: {
    tags: ['overview', 'panels', 'tiles', 'home screen'],
    categories: ['navigation'],
    useCases: [
      'Links to the overview page of an app',
      'Marks the dashboard tab of a navigation bar'
    ],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  download: {
    tags: ['save', 'export', 'tray', 'arrow down'],
    categories: ['actions'],
    useCases: ['Downloads a file', 'Saves a render to the device'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  duplicate: {
    tags: ['clone', 'copy', 'make a copy', 'cards plus'],
    categories: ['actions'],
    useCases: ['Duplicates a scene or a project', 'Creates a copy of the selected item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  eye: {
    tags: ['visible', 'show', 'view', 'preview'],
    categories: ['status'],
    useCases: ['Shows a hidden layer', 'Reveals a password'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'eye-off': {
    tags: ['hidden', 'hide', 'invisible', 'conceal'],
    categories: ['status'],
    useCases: ['Hides a layer', 'Masks a password'],
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
  filter: {
    tags: ['funnel', 'narrow', 'refine', 'query'],
    categories: ['actions'],
    useCases: ['Opens the filters of a list', 'Shows that a filter is applied'],
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
  'folder-stack': {
    tags: ['folders', 'projects', 'collection', 'all files'],
    categories: ['navigation'],
    useCases: ['Links to the list of every project', 'Labels a group of folders'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  grip: {
    tags: ['drag', 'handle', 'reorder', 'dots'],
    categories: ['actions'],
    useCases: ['Marks the drag handle of a row', 'Reorders the items of a list'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  history: {
    tags: ['past', 'recent', 'activity', 'clock arrow'],
    categories: ['status'],
    useCases: ['Links to the version history', 'Shows recent activity'],
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
  info: {
    tags: ['information', 'details', 'about', 'help'],
    categories: ['status'],
    useCases: ['Shows a hint beside a setting', 'Opens the details of an item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  library: {
    tags: ['books', 'shelf', 'assets', 'collection'],
    categories: ['navigation'],
    useCases: ['Links to the asset library', 'Opens a collection of saved items'],
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
  link: {
    tags: ['chain', 'url', 'hyperlink', 'attach link'],
    categories: ['actions'],
    useCases: ['Inserts a link', 'Copies the link to an item'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  loader: {
    tags: ['loading', 'spinner', 'progress', 'busy'],
    categories: ['status'],
    useCases: ['Shows that content is loading', 'Marks a button that is busy'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  lock: {
    tags: ['locked', 'private', 'secure', 'padlock'],
    categories: ['status'],
    useCases: ['Marks a private project', 'Locks a layer against edits'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  menu: {
    tags: ['hamburger', 'navigation', 'lines', 'open menu'],
    categories: ['navigation'],
    useCases: [
      'Opens the navigation drawer on a small screen',
      'Shows the menu button of a toolbar'
    ],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'more-horizontal': {
    tags: ['ellipsis', 'overflow', 'options', 'dots'],
    categories: ['actions'],
    useCases: ['Opens the overflow menu of a row', 'Shows more actions of a card'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  'more-vertical': {
    tags: ['kebab', 'overflow', 'options', 'dots'],
    categories: ['actions'],
    useCases: ['Opens the overflow menu of a list item', 'Shows more actions in a header'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  pencil: {
    tags: ['edit', 'write', 'rename', 'modify'],
    categories: ['actions'],
    useCases: ['Starts editing a field or an item', 'Renames a project'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  pin: {
    tags: ['pushpin', 'keep', 'stick', 'favourite'],
    categories: ['actions'],
    useCases: ['Pins an item to the top of a list', 'Keeps a panel open'],
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
  queued: {
    tags: ['waiting', 'pending', 'hourglass', 'in line'],
    categories: ['status'],
    useCases: ['Marks a render waiting in the queue', 'Shows that a job has not started'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  redo: {
    tags: ['forward', 'repeat', 'history', 'u-turn'],
    categories: ['actions'],
    useCases: ['Redoes the last undone change', 'Reapplies an edit in the editor'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  refresh: {
    tags: ['reload', 'sync', 'retry', 'rotate'],
    categories: ['actions'],
    useCases: ['Reloads a list', 'Retries a failed request'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  repair: {
    tags: ['wrench', 'fix', 'maintenance', 'tool'],
    categories: ['status'],
    useCases: ['Marks an item being repaired', 'Starts an automatic fix'],
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
  share: {
    tags: ['send', 'network', 'nodes', 'social'],
    categories: ['actions'],
    useCases: ['Opens the share dialog', 'Shares a project with a link'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  sidebar: {
    tags: ['panel', 'layout', 'drawer', 'toggle sidebar'],
    categories: ['navigation'],
    useCases: ['Shows or hides the side panel', 'Switches the layout to one with a sidebar'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  sort: {
    tags: ['order', 'arrange', 'ascending', 'descending'],
    categories: ['actions'],
    useCases: ['Changes the sort order of a list', 'Sorts a table column'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  templates: {
    tags: ['layout', 'starter', 'blueprint', 'preset'],
    categories: ['navigation'],
    useCases: ['Links to the template gallery', 'Starts a new project from a template'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  trash: {
    tags: ['delete', 'remove', 'bin', 'discard'],
    categories: ['actions'],
    useCases: ['Deletes an item', 'Links to the deleted items'],
    aliases: [{ name: 'delete', deprecated: false }],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  undo: {
    tags: ['back', 'revert', 'history', 'u-turn'],
    categories: ['actions'],
    useCases: ['Undoes the last change', 'Reverts an edit in the editor'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  },
  upload: {
    tags: ['import', 'send', 'tray', 'arrow up'],
    categories: ['actions'],
    useCases: ['Uploads a file', 'Imports media into a project'],
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
  },
  version: {
    tags: ['versions', 'revision', 'stack', 'snapshot'],
    categories: ['status'],
    useCases: ['Shows the version of a project', 'Links to earlier versions of a file'],
    aliases: [],
    variants: ['line'],
    opticalSizes: [24],
    since: '0.1.0'
  }
} as const

/** The metadata of every brand mark, keyed by name. */
export const BRANDS = {} as const
