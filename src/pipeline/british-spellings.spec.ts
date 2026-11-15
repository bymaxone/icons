/**
 * Unit tests for the British spelling list.
 *
 * Layer: unit, pure functions.
 * Goal: pin that every listed spelling is found with its American form, that matching is by
 * whole word and case-insensitive, and that American text passes.
 * Mocks: none.
 */

import { BRITISH_SPELLINGS, britishWords } from './british-spellings.ts'

describe('BRITISH_SPELLINGS', () => {
  it('never maps a word to itself and never lists an American form as British', () => {
    /** Scenario: a typo in the table would flag correct text or ask for no change. */
    for (const [british, american] of [...BRITISH_SPELLINGS]) {
      expect(british).toMatch(/^[a-z]+$/)
      expect(american).not.toBe(british)
      expect(BRITISH_SPELLINGS.has(american)).toBe(false)
    }
  })

  it.each([
    ['centred', 'centered'],
    ['analysed', 'analyzed'],
    ['organised', 'organized'],
    ['colourful', 'colorful']
  ])('asks for the American form %s -> %s as it is spelled', (british, american) => {
    /** Scenario: a suffix glued onto a stem must give a real word, not a misspelling like centerd. */
    expect(BRITISH_SPELLINGS.get(british)).toBe(american)
  })

  it('reads words across runs of separators and returns nothing for a text without letters', () => {
    /** Scenario: runs of non-letters, digits and an empty text yield the listed words only. */
    expect(britishWords('  colour,,  favour -- 12 grey ')).toStrictEqual([
      { british: 'colour', american: 'color' },
      { british: 'favour', american: 'favor' },
      { british: 'grey', american: 'gray' }
    ])
    expect(britishWords('')).toStrictEqual([])
    expect(britishWords('123 -- 45')).toStrictEqual([])
  })

  it.each([...BRITISH_SPELLINGS])('flags %s and asks for %s', (british, american) => {
    /** Scenario: each listed spelling, alone and in a sentence in capitals, is found. */
    expect(britishWords(british)).toStrictEqual([{ british, american }])
    expect(britishWords(`Marks a ${british.toUpperCase()}, today`)).toStrictEqual([
      { british, american }
    ])
  })
})

/** Every listed pair, written out by hand as `british:american`, so the table cannot drift unseen. */
const EXPECTED_PAIRS: readonly string[] = [
  'colour:color',
  'colours:colors',
  'coloured:colored',
  'colouring:coloring',
  'colourful:colorful',
  'colourless:colorless',
  'favour:favor',
  'favours:favors',
  'favoured:favored',
  'favouring:favoring',
  'favourful:favorful',
  'favourless:favorless',
  'favourite:favorite',
  'favourites:favorites',
  'flavour:flavor',
  'flavours:flavors',
  'flavoured:flavored',
  'flavouring:flavoring',
  'flavourful:flavorful',
  'flavourless:flavorless',
  'behaviour:behavior',
  'behaviours:behaviors',
  'behavioural:behavioral',
  'honour:honor',
  'honours:honors',
  'honoured:honored',
  'honouring:honoring',
  'honourful:honorful',
  'honourless:honorless',
  'labour:labor',
  'labours:labors',
  'laboured:labored',
  'labouring:laboring',
  'labourful:laborful',
  'labourless:laborless',
  'humour:humor',
  'humours:humors',
  'humoured:humored',
  'humouring:humoring',
  'humourful:humorful',
  'humourless:humorless',
  'harbour:harbor',
  'harbours:harbors',
  'harboured:harbored',
  'harbouring:harboring',
  'harbourful:harborful',
  'harbourless:harborless',
  'armour:armor',
  'armours:armors',
  'armoured:armored',
  'armouring:armoring',
  'armourful:armorful',
  'armourless:armorless',
  'neighbour:neighbor',
  'neighbours:neighbors',
  'neighbouring:neighboring',
  'neighbourhood:neighborhood',
  'neighbourhoods:neighborhoods',
  'centre:center',
  'centres:centers',
  'centred:centered',
  'theatre:theater',
  'theatres:theaters',
  'metre:meter',
  'metres:meters',
  'litre:liter',
  'litres:liters',
  'fibre:fiber',
  'fibres:fibers',
  'tyre:tire',
  'tyres:tires',
  'cancelled:canceled',
  'cancelling:canceling',
  'travelled:traveled',
  'travelling:traveling',
  'traveller:traveler',
  'travellers:travelers',
  'labelled:labeled',
  'labelling:labeling',
  'modelled:modeled',
  'modelling:modeling',
  'licence:license',
  'licences:licenses',
  'grey:gray',
  'greyscale:grayscale',
  'dialling:dialing',
  'dialled:dialed',
  'cosy:cozy',
  'catalogue:catalog',
  'catalogues:catalogs',
  'programme:program',
  'programmes:programs',
  'jewellery:jewelry',
  'analyse:analyze',
  'analysed:analyzed',
  'analysing:analyzing',
  'defence:defense',
  'defences:defenses',
  'offence:offense',
  'offences:offenses',
  'kerb:curb',
  'kerbs:curbs',
  'plough:plow',
  'ploughs:plows',
  'pyjamas:pajamas',
  'aluminium:aluminum',
  'mould:mold',
  'moulds:molds',
  'sceptic:skeptic',
  'sceptical:skeptical',
  'storey:story',
  'storeys:stories',
  'enrol:enroll',
  'fulfil:fulfill',
  'whilst:while',
  'maths:math',
  'organise:organize',
  'organises:organizes',
  'organised:organized',
  'organising:organizing',
  'organisation:organization',
  'recognise:recognize',
  'recognises:recognizes',
  'recognised:recognized',
  'recognising:recognizing',
  'recognisation:recognization',
  'customise:customize',
  'customises:customizes',
  'customised:customized',
  'customising:customizing',
  'customisation:customization',
  'personalise:personalize',
  'personalises:personalizes',
  'personalised:personalized',
  'personalising:personalizing',
  'personalisation:personalization',
  'synchronise:synchronize',
  'synchronises:synchronizes',
  'synchronised:synchronized',
  'synchronising:synchronizing',
  'synchronisation:synchronization',
  'minimise:minimize',
  'minimises:minimizes',
  'minimised:minimized',
  'minimising:minimizing',
  'minimisation:minimization',
  'maximise:maximize',
  'maximises:maximizes',
  'maximised:maximized',
  'maximising:maximizing',
  'maximisation:maximization',
  'optimise:optimize',
  'optimises:optimizes',
  'optimised:optimized',
  'optimising:optimizing',
  'optimisation:optimization',
  'summarise:summarize',
  'summarises:summarizes',
  'summarised:summarized',
  'summarising:summarizing',
  'summarisation:summarization',
  'authorise:authorize',
  'authorises:authorizes',
  'authorised:authorized',
  'authorising:authorizing',
  'authorisation:authorization',
  'categorise:categorize',
  'categorises:categorizes',
  'categorised:categorized',
  'categorising:categorizing',
  'categorisation:categorization',
  'utilise:utilize',
  'utilises:utilizes',
  'utilised:utilized',
  'utilising:utilizing',
  'utilisation:utilization',
  'visualise:visualize',
  'visualises:visualizes',
  'visualised:visualized',
  'visualising:visualizing',
  'visualisation:visualization',
  'normalise:normalize',
  'normalises:normalizes',
  'normalised:normalized',
  'normalising:normalizing',
  'normalisation:normalization',
  'initialise:initialize',
  'initialises:initializes',
  'initialised:initialized',
  'initialising:initializing',
  'initialisation:initialization',
  'realise:realize',
  'realises:realizes',
  'realised:realized',
  'realising:realizing',
  'realisation:realization'
]

describe('BRITISH_SPELLINGS table', () => {
  it('lists exactly the expected pairs, in order, with no extra or missing entry', () => {
    /** Scenario: a stem, an American form or a suffix list altered or emptied changes the table and fails here. */
    expect(
      [...BRITISH_SPELLINGS].map(([british, american]) => `${british}:${american}`)
    ).toStrictEqual([...EXPECTED_PAIRS])
  })

  it('has as many entries as the spec table, which holds no duplicate', () => {
    /** Scenario: an entry vanishing or appearing silently changes the size and fails here. */
    expect(new Set(EXPECTED_PAIRS).size).toBe(EXPECTED_PAIRS.length)
    expect(BRITISH_SPELLINGS.size).toBe(EXPECTED_PAIRS.length)
  })

  it.each(EXPECTED_PAIRS.map((pair) => pair.split(':')))(
    'maps %s to %s and flags it whole',
    (british, american) => {
      /** Scenario: each hand-written pair is stored exactly and britishWords reports it. */
      expect(BRITISH_SPELLINGS.get(british ?? '')).toBe(american)
      expect(britishWords(`A ${british ?? ''}.`)).toStrictEqual([{ british, american }])
    }
  )
})

describe('britishWords', () => {
  it('keeps analyses, the plural noun of analysis, and flags the verb forms', () => {
    /** Scenario: `analyses` is American as a plural noun, so only the verb forms are British. */
    expect(britishWords('Shows statistical analyses')).toStrictEqual([])
    expect(britishWords('analysing')).toStrictEqual([
      { british: 'analysing', american: 'analyzing' }
    ])
  })

  it('passes American text', () => {
    /** Scenario: the American forms and a regional word with no spelling variant are fine. */
    expect(britishWords('Samples a color; the torch and the cancellation')).toStrictEqual([])
  })

  it('matches whole words only', () => {
    /** Scenario: "centred" is listed but "decentre" and "centreless" are other words. */
    expect(britishWords('decentre centreless')).toStrictEqual([])
  })

  it('flags a word joined by a hyphen and reports them in order', () => {
    /** Scenario: `colour-picker` holds a listed word; two words come out in reading order. */
    expect(britishWords('Grey colour-picker')).toStrictEqual([
      { british: 'grey', american: 'gray' },
      { british: 'colour', american: 'color' }
    ])
  })

  it('does not read inherited object keys as spellings', () => {
    /** Scenario: "constructor" and "toString" are properties of every object, not words of the list. */
    expect(britishWords('constructor toString valueOf')).toStrictEqual([])
  })
})
