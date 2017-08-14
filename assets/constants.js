/* eslint-disable */
/* Don't modify anything outside the {} brackets.
 * Insides of the {} brackets should be formatted as a JSON object.
 * JSON rules:
 * 1. All keys and string values must be enclosed in double quotes.
 * 2. Each key/value pair should be on a new line.
 * 3. All values and keys must be constant, you can't use any Javascript
 *    functions.
 */
var constants = {
  "//": "Whether to allow custom event reporting to Google Analytics.",
  "CAN_SEND_ANALYTICS_EVENTS": false,

  "ALL_CATEGORIES": ["Algebra", "Algorithms", "Architecture", "Arithmetic",
    "Art", "Astronomy", "Biology", "Business", "Calculus", "Chemistry",
    "Combinatorics", "Computing", "Economics", "Education", "Engineering",
    "English", "Environment", "Gaulish", "Geography", "Geometry", "Government",
    "Graph Theory", "History", "Languages", "Latin", "Law", "Logic",
    "Mathematics", "Medicine", "Music", "Philosophy", "Physics", "Poetry",
    "Probability", "Programming", "Puzzles", "Reading", "Spanish", "Sport",
    "Statistics", "Trigonometry", "Welcome"],
  "ACTIVITY_TYPE_EXPLORATION": "exploration",
  "ACTIVITY_TYPE_COLLECTION": "collection",
  "DISABLED_EXPLORATION_IDS": ["5"],
  "TESTING_CONSTANT": "test",
  "LIBRARY_TILE_WIDTH_PX": 208,
  "DASHBOARD_TYPE_CREATOR": "creator",
  "DASHBOARD_TYPE_LEARNER": "learner",
  "DEFAULT_COLOR": "#a33f40",
  "DEFAULT_THUMBNAIL_ICON": "Lightbulb",
  "DEFAULT_CATEGORY_ICON": "Lightbulb",

  "//": "The default language code for an exploration.",
  "DEFAULT_LANGUAGE_CODE": "en",

  "//": [
    "List of supported default categories. For now, each category has a specific ",
    "color associated with it. Each category also has a thumbnail icon whose ",
    "filename is '{{CategoryName}}.svg'."
  ],
  "CATEGORIES_TO_COLORS": {
    "Mathematics": "#cd672b",
    "Algebra": "#cd672b",
    "Arithmetic": "#d68453",
    "Calculus": "#b86330",
    "Logic": "#d68453",
    "Combinatorics": "#cf5935",
    "Graph Theory": "#cf5935",
    "Probability": "#cf5935",
    "Statistics": "#cd672b",
    "Geometry": "#d46949",
    "Trigonometry": "#d46949",

    "Algorithms": "#d0982a",
    "Computing": "#bb8b2f",
    "Programming": "#d9aa53",

    "Astronomy": "#879d6c",
    "Biology": "#97a766",
    "Chemistry": "#aab883",
    "Engineering": "#8b9862",
    "Environment": "#aba86d",
    "Medicine": "#97a766",
    "Physics": "#879d6c",

    "Architecture": "#6e3466",
    "Art": "#895a83",
    "Music": "#6a3862",
    "Philosophy": "#613968",
    "Poetry": "#7f507f",

    "English": "#193a69",
    "Languages": "#1b4174",
    "Latin": "#3d5a89",
    "Reading": "#193a69",
    "Spanish": "#405185",
    "Gaulish": "#1b4174",

    "Business": "#387163",
    "Economics": "#5d8b7f",
    "Geography": "#3c6d62",
    "Government": "#538270",
    "History": "#3d6b52",
    "Law": "#538270",

    "Education": "#942e20",
    "Puzzles": "#a8554a",
    "Sport": "#893327",
    "Welcome": "#992a2b"
  },

  "//": [
    "List of supported language codes. Each description has a ",
    "parenthetical part that may be stripped out to give a shorter ",
    "description."
  ],
  "ALL_LANGUAGE_CODES": [{
    "code": "en",
    "description": "English"
  }, {
    "code": "ar",
    "description": "العربية (Arabic)"
  }, {
    "code": "bg",
    "description": "български (Bulgarian)"
  }, {
    "code": "ca",
    "description": "català (Catalan)"
  }, {
    "code": "zh",
    "description": "中文 (Chinese)"
  }, {
    "code": "hr",
    "description": "hrvatski (Croatian)"
  }, {
    "code": "cs",
    "description": "čeština (Czech)"
  }, {
    "code": "da",
    "description": "dansk (Danish)"
  }, {
    "code": "nl",
    "description": "Nederlands (Dutch)"
  }, {
    "code": "tl",
    "description": "Filipino (Filipino)"
  }, {
    "code": "fi",
    "description": "suomi (Finnish)"
  }, {
    "code": "fr",
    "description": "français (French)"
  }, {
    "code": "de",
    "description": "Deutsch (German)"
  }, {
    "code": "el",
    "description": "ελληνικά (Greek)"
  }, {
    "code": "he",
    "description": "עברית (Hebrew)"
  }, {
    "code": "hi",
    "description": "हिन्दी (Hindi)"
  }, {
    "code": "hu",
    "description": "magyar (Hungarian)"
  }, {
    "code": "id",
    "description": "Bahasa Indonesia (Indonesian)"
  }, {
    "code": "it",
    "description": "italiano (Italian)"
  }, {
    "code": "ja",
    "description": "日本語 (Japanese)"
  }, {
    "code": "ko",
    "description": "한국어 (Korean)"
  }, {
    "code": "lv",
    "description": "latviešu (Latvian)"
  }, {
    "code": "lt",
    "description": "lietuvių (Lithuanian)"
  }, {
    "code": "no",
    "description": "Norsk (Norwegian)"
  }, {
    "code": "fa",
    "description": "فارسی (Persian)"
  }, {
    "code": "pl",
    "description": "polski (Polish)"
  }, {
    "code": "pt",
    "description": "português (Portuguese)"
  }, {
    "code": "ro",
    "description": "română (Romanian)"
  }, {
    "code": "ru",
    "description": "русский (Russian)"
  }, {
    "code": "sr",
    "description": "српски (Serbian)"
  }, {
    "code": "sk",
    "description": "slovenčina (Slovak)"
  }, {
    "code": "sl",
    "description": "slovenščina (Slovenian)"
  }, {
    "code": "es",
    "description": "español (Spanish)"
  }, {
    "code": "sv",
    "description": "svenska (Swedish)"
  }, {
    "code": "th",
    "description": "ภาษาไทย (Thai)"
  }, {
    "code": "tr",
    "description": "Türkçe (Turkish)"
  }, {
    "code": "uk",
    "description": "українська (Ukrainian)"
  }, {
    "code": "vi",
    "description": "Tiếng Việt (Vietnamese)"
  }],

  "//": [
    "NOTE TO DEVELOPERS: While adding another language, please ensure that the ",
    "languages are in alphabetical order."
  ],
  "SUPPORTED_SITE_LANGUAGES": [{
    "id": "id",
    "text": "Bahasa Indonesia"
  }, {
    "id": "en",
    "text": "English"
  }, {
    "id": "de",
    "text": "Deutsch"
  }, {
    "id": "fr",
    "text": "Français"
  }, {
    "id": "nl",
    "text": "Nederlands"
  }, {
    "id": "es",
    "text": "Español"
  }, {
    "id": "hu",
    "text": "Magyar"
  }, {
    "id": "pt",
    "text": "Português"
  }, {
    "id": "pt-br",
    "text": "Português (Brasil)"
  }, {
    "id": "mk",
    "text": "македонски јазик"
  }, {
    "id": "vi",
    "text": "Tiếng Việt"
  }, {
    "id": "hi",
    "text": "हिन्दी"
  }, {
    "id": "bn",
    "text": "বাংলা"
  }, {
    "id": "tr",
    "text": "Türkçe"
  }, {
    "id": "zh-hans",
    "text": "中文(简体)"
  }, {
    "id": "zh-hant",
    "text": "中文(繁體)"
  }],

  "SUPPORTED_AUDIO_LANGUAGES": [{
    "id": "en",
    "text": "English"
  }, {
    "id": "hi-en",
    "text": "Hinglish"
  }]

};
