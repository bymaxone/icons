/**
 * @fileoverview The British spellings the metadata may not use. The catalogue is written in
 * American English, so a label, tag or use case that holds one of these words fails
 * `pnpm check:meta` with the American form. Only spellings are listed; a regional word with no
 * spelling variant (`torch`, `lift`, `trolley`) is a legitimate search tag and is left alone.
 * Alias names are not read: they are identifiers consumers import, and a British one is a
 * deliberate alias for people who search that way.
 * @layer Pipeline
 */

/** Pairs a British stem with its American one across the suffixes both forms take. */
function family(
  british: string,
  american: string,
  suffixes: readonly string[]
): [string, string][] {
  return suffixes.map((suffix) => [`${british}${suffix}`, `${american}${suffix}`])
}

const NOUN = ['', 's']
const OUR = ['', 's', 'ed', 'ing', 'ful', 'less']
const ISE = ['e', 'es', 'ed', 'ing', 'ation']

/** The British word, lower case, mapped to the American spelling the message asks for. */
export const BRITISH_SPELLINGS: ReadonlyMap<string, string> = new Map([
  ...family('colour', 'color', OUR),
  ...family('favour', 'favor', [...OUR, 'ite', 'ites']),
  ...family('flavour', 'flavor', OUR),
  ...family('behaviour', 'behavior', ['', 's', 'al']),
  ...family('honour', 'honor', OUR),
  ...family('labour', 'labor', OUR),
  ...family('humour', 'humor', OUR),
  ...family('harbour', 'harbor', OUR),
  ...family('armour', 'armor', OUR),
  ...family('neighbour', 'neighbor', ['', 's', 'ing', 'hood', 'hoods']),
  ...family('centre', 'center', NOUN),
  ...family('centred', 'centered', ['']),
  ...family('theatre', 'theater', NOUN),
  ...family('metre', 'meter', NOUN),
  ...family('litre', 'liter', NOUN),
  ...family('fibre', 'fiber', NOUN),
  ...family('tyre', 'tire', NOUN),
  ...family('cancelled', 'canceled', ['']),
  ...family('cancelling', 'canceling', ['']),
  ...family('travelled', 'traveled', ['']),
  ...family('travelling', 'traveling', ['']),
  ...family('traveller', 'traveler', NOUN),
  ...family('labelled', 'labeled', ['']),
  ...family('labelling', 'labeling', ['']),
  ...family('modelled', 'modeled', ['']),
  ...family('modelling', 'modeling', ['']),
  ...family('licence', 'license', NOUN),
  ...family('grey', 'gray', ['', 'scale']),
  ...family('dialling', 'dialing', ['']),
  ...family('dialled', 'dialed', ['']),
  ...family('cosy', 'cozy', ['']),
  ...family('catalogue', 'catalog', NOUN),
  ...family('programme', 'program', NOUN),
  ...family('jewellery', 'jewelry', ['']),
  ...family('analyse', 'analyze', ['', 's', 'd']),
  ...family('defence', 'defense', NOUN),
  ...family('offence', 'offense', NOUN),
  ...family('kerb', 'curb', NOUN),
  ...family('plough', 'plow', NOUN),
  ...family('pyjamas', 'pajamas', ['']),
  ...family('aluminium', 'aluminum', ['']),
  ...family('mould', 'mold', NOUN),
  ...family('sceptic', 'skeptic', ['', 'al']),
  ...family('storey', 'story', ['']),
  ...family('storeys', 'stories', ['']),
  ...family('enrol', 'enroll', ['']),
  ...family('fulfil', 'fulfill', ['']),
  ...family('whilst', 'while', ['']),
  ...family('maths', 'math', ['']),
  ...family('organis', 'organiz', ISE),
  ...family('recognis', 'recogniz', ISE),
  ...family('customis', 'customiz', ISE),
  ...family('personalis', 'personaliz', ISE),
  ...family('synchronis', 'synchroniz', ISE),
  ...family('minimis', 'minimiz', ISE),
  ...family('maximis', 'maximiz', ISE),
  ...family('optimis', 'optimiz', ISE),
  ...family('summaris', 'summariz', ISE),
  ...family('authoris', 'authoriz', ISE),
  ...family('categoris', 'categoriz', ISE),
  ...family('utilis', 'utiliz', ISE),
  ...family('visualis', 'visualiz', ISE),
  ...family('normalis', 'normaliz', ISE),
  ...family('initialis', 'initializ', ISE),
  ...family('realis', 'realiz', ISE)
])

/**
 * The words of a text that are listed British spellings, in the order they appear: the text is
 * lower-cased and split on every run of non-letters, so `Colour-picker` and `grey,` are read.
 *
 * @param text - A label, tag or use case.
 * @returns The listed words found, each with the American form to write instead.
 */
export function britishWords(text: string): { british: string; american: string }[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .flatMap((word) => {
      const american = BRITISH_SPELLINGS.get(word)
      return american === undefined ? [] : [{ british: word, american }]
    })
}
