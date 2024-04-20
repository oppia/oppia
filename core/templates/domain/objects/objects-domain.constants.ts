// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Constants for objects domain.
 */

export const ObjectsDomainConstants = {
  FRACTION_PARSING_ERROR_I18N_KEYS: {
    INVALID_CHARS_LENGTH: 'I18N_INTERACTIONS_FRACTIONS_INVALID_CHARS_LENGTH',
    INVALID_CHARS: 'I18N_INTERACTIONS_FRACTIONS_INVALID_CHARS',
    INVALID_FORMAT: 'I18N_INTERACTIONS_FRACTIONS_INVALID_FORMAT',
    DIVISION_BY_ZERO: 'I18N_INTERACTIONS_FRACTIONS_DIVISION_BY_ZERO',
  },

  NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS: {
    INVALID_VALUE: 'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_VALUE',
    INVALID_CURRENCY: 'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_CURRENCY',
    INVALID_CURRENCY_FORMAT:
      'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_CURRENCY_FORMAT',
    INVALID_UNIT_CHARS:
      'I18N_INTERACTIONS_NUMBER_WITH_UNITS_INVALID_UNIT_CHARS',
  },

  CURRENCY_UNITS: {
    dollar: {
      name: 'dollar',
      aliases: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
      front_units: ['$'],
      base_unit: null,
    },
    rupee: {
      name: 'rupee',
      aliases: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
      front_units: ['Rs ', '₹'],
      base_unit: null,
    },
    cent: {
      name: 'cent',
      aliases: ['cents', 'Cents', 'Cent'],
      front_units: [],
      base_unit: '0.01 dollar',
    },
    paise: {
      name: 'paise',
      aliases: ['paisa', 'Paise', 'Paisa'],
      front_units: [],
      base_unit: '0.01 rupee',
    },
  } as {
    [key: string]: {
      name: string;
      aliases: string[];
      front_units: string[];
      base_unit: string | null;
    };
  },

  RATIO_PARSING_ERROR_I18N_KEYS: {
    INVALID_COLONS: 'I18N_INTERACTIONS_RATIO_INVALID_COLONS',
    INVALID_CHARS: 'I18N_INTERACTIONS_RATIO_INVALID_CHARS',
    INVALID_FORMAT: 'I18N_INTERACTIONS_RATIO_INVALID_FORMAT',
    NON_INTEGER_ELEMENTS: 'I18N_INTERACTIONS_RATIO_NON_INTEGER_ELEMENTS',
    INCLUDES_ZERO: 'I18N_INTERACTIONS_RATIO_INCLUDES_ZERO',
    EMPTY_STRING: 'I18N_INTERACTIONS_RATIO_EMPTY_STRING',
  },

  // Used for converting units to their canonical forms.
  // Keys represent unit name, and values are their canonical forms.
  // Example: 'm' and 'meter' both map to 'm' (meters)
  UNIT_TO_NORMALIZED_UNIT_MAPPING: {
    // Length.
    m: 'm',
    meter: 'm',
    in: 'in',
    inch: 'in',
    ft: 'ft',
    foot: 'ft',
    yd: 'yd',
    yard: 'yd',
    mi: 'mi',
    mile: 'mi',
    li: 'link',
    link: 'li',
    rd: 'rd',
    rod: 'rd',
    ch: 'ch',
    chain: 'ch',
    angstrom: 'angstrom',
    mil: 'mil',
    km: 'km',

    // Surface area.
    m2: 'm2',
    sqin: 'sqin',
    sqft: 'sqft',
    sqyd: 'sqyd',
    sqmi: 'sqmi',
    sqrd: 'sqrd',
    sqch: 'sqch',
    sqmil: 'sqmil',
    acre: 'acre',
    hectare: 'hectare',

    // Volume.
    m3: 'm3',
    litre: 'l',
    L: 'l',
    l: 'l',
    lt: 'l',
    cc: 'cc',
    cuin: 'cuin',
    cuft: 'cuft',
    cuyd: 'cuyd',
    teaspoon: 'teaspoon',
    tablespoon: 'tablespoon',

    // Liquid volume.
    minim: 'minim',
    fluiddram: 'fldr',
    fldr: 'fldr',
    fluidounce: 'floz',
    floz: 'floz',
    gill: 'gi',
    gi: 'gi',
    cup: 'cp',
    cp: 'cp',
    pint: 'pt',
    pt: 'pt',
    quart: 'qt',
    gallon: 'gal',
    gal: 'gal',
    beerbarrel: 'bbl',
    bbl: 'bbl',
    oilbarrel: 'obl',
    obl: 'obl',
    hogshead: 'hogshead',
    drop: 'gtt',
    gtt: 'gtt',

    // Angles.
    rad: 'rad',
    radian: 'rad',
    deg: 'deg',
    degree: 'deg',
    grad: 'grad',
    gradian: 'grad',
    cycle: 'cycle',
    arcsec: 'arcsec',
    arcsecond: 'arcsec',
    arcmin: 'arcmin',
    arcminute: 'arcmin',

    // Time.
    second: 's',
    seconds: 's',
    s: 's',
    sec: 's',
    secs: 's',
    minute: 'min',
    minutes: 'min',
    min: 'min',
    mins: 'min',
    hr: 'hr',
    hrs: 'hr',
    hour: 'hr',
    hours: 'hr',
    day: 'day',
    days: 'day',
    week: 'week',
    weeks: 'week',
    month: 'month',
    months: 'month',
    year: 'year',
    years: 'year',
    decade: 'decade',
    decades: 'decade',
    century: 'century',
    centuries: 'century',
    millennium: 'millennium',
    millennia: 'millennium',

    // Frequency.
    Hz: 'Hz',

    // Mass.
    kg: 'kg',
    kilogram: 'kg',
    g: 'g',
    gram: 'g',
    tonne: 'ton',
    ton: 'ton',
    gr: 'gr',
    grain: 'gr',
    dr: 'dr',
    dram: 'dr',
    oz: 'oz',
    ounce: 'oz',
    lbm: 'lb',
    lb: 'lb',
    lbs: 'lb',
    poundmass: 'lb',
    cwt: 'cwt',
    hundredweight: 'cwt',
    stick: 'stick',
    stone: 'stone',

    // Temperature.
    K: 'K',
    kelvin: 'K',
    degC: 'degC',
    celsius: 'degC',
    degF: 'degF',
    fahrenheit: 'degF',
    degR: 'degR',
    rankine: 'degR',

    // Amount of substance.
    mol: 'mol',
    mole: 'mol',

    // Luminous intensity.
    cd: 'cd',
    candela: 'cd',

    // Force.
    N: 'N',
    newton: 'N',
    dyn: 'dyn',
    dyne: 'dyn',
    lbf: 'lbf',
    poundforce: 'lbf',
    kip: 'kip',

    // Energy.
    J: 'J',
    joule: 'J',
    erg: 'erg',
    Wh: 'Wh',
    BTU: 'BTU',
    eV: 'eV',
    electronvolt: 'eV',

    // Power.
    W: 'W',
    watt: 'W',
    hp: 'hp',

    // Pressure.
    Pa: 'Pa',
    psi: 'psi',
    atm: 'atm',
    torr: 'torr',
    bar: 'bar',
    mmHg: 'mmHg',
    mmH2O: 'mmH2O',
    cmH2O: 'cmH2O',

    // Electricity and magnetism.
    A: 'A',
    ampere: 'A',
    V: 'V',
    volt: 'V',
    C: 'C',
    coulomb: 'C',
    ohm: 'ohm',
    F: 'F',
    farad: 'farad',
    Wb: 'Wb',
    weber: 'Wb',
    T: 'T',
    tesla: 'T',
    H: 'H',
    henry: 'H',
    S: 'S',
    siemens: 'S',

    // Binary.
    b: 'b',
    bit: 'bit',
    B: 'B',
    byte: 'B',

    // Currency.
    $: 'dollar',
    USD: 'dollar',
    dollar: 'dollar',
    dollars: 'dollar',
    Dollar: 'dollar',
    Dollars: 'dollar',
    '₹': 'Rs',
    Rs: 'Rs',
    Rupee: 'Rs',
    Rupees: 'Rs',
    rupee: 'Rs',
    rupees: 'Rs',
    Cent: 'Cent',
    Cents: 'Cent',
    cent: 'Cent',
    cents: 'Cent',
    Paisa: 'Paisa',
    paise: 'Paisa',
  } as {[key: string]: string},

  // Used for converting unit prefixes to their canonical forms.
  // Keys represent prefix name, and values are their canonical forms.
  // Example: 'kilo' and 'k' both map to 'k' (kilo)
  PREFIX_TO_NORMALIZED_PREFIX_MAPPING: {
    deca: 'da',
    da: 'da',
    hecto: 'h',
    h: 'h',
    kilo: 'k',
    k: 'k',
    mega: 'M',
    M: 'M',
    giga: 'G',
    G: 'G',
    tera: 'T',
    T: 'T',
    peta: 'P',
    P: 'P',
    exa: 'E',
    E: 'E',
    zetta: 'Z',
    Z: 'Z',
    yotta: 'Y',
    Y: 'Y',
    deci: 'd',
    d: 'd',
    centi: 'c',
    c: 'c',
    milli: 'm',
    m: 'm',
    micro: 'u',
    u: 'u',
    nano: 'n',
    n: 'n',
    pico: 'p',
    p: 'p',
    femto: 'f',
    f: 'f',
    atto: 'a',
    a: 'a',
    zepto: 'z',
    z: 'z',
    yocto: 'y',
    y: 'y',
    kibi: 'Ki',
    Ki: 'Ki',
    mebi: 'Mi',
    Mi: 'Mi',
    gibi: 'Gi',
    Gi: 'Gi',
    tebi: 'Ti',
    Ti: 'Ti',
    pebi: 'Pi',
    Pi: 'Pi',
    exi: 'Ei',
    Ei: 'Ei',
    zebi: 'Zi',
    Zi: 'Zi',
    yobi: 'Yi',
    Yi: 'Yi',
    MM: 'MM',
  } as {[key: string]: string},
} as const;
