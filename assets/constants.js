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
    "code": "bn",
    "description": "বাংলা (Bangla)"
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
    "code": "kab",
    "description": "Taqbaylit (Kabyle)"
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
    "id": "es",
    "text": "Español"
  }, {
    "id": "pt-br",
    "text": "Português (Brasil)"
  }, {
    "id": "ar",
    "text": "العربية"
  }, {
    "id": "kab",
    "text": "Taqbaylit"
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
    "id": "zh-hans",
    "text": "中文(简体)"
  }, {
    "id": "zh-hant",
    "text": "中文(繁體)"
  }],

  "//": [
    "Related languages are used to prioritize an exploration's language when ",
    "setting the default audio language."
  ],
  "SUPPORTED_AUDIO_LANGUAGES": [{
    "id": "en",
    "text": "English",
    "related_languages": ["en"]
  }, {
    "id": "ar",
    "text": "Arabic",
    "related_languages": ["ar"]
  }, {
    "id": "bg",
    "text": "Bulgarian",
    "related_languages": ["bg"]
  }, {
    "id": "bn",
    "text": "Bangla",
    "related_languages": ["bn"]
  }, {
    "id": "ca",
    "text": "Catalan",
    "related_languages": ["ca"]
  }, {
    "id": "zh",
    "text": "Chinese",
    "related_languages": ["zh"]
  }, {
    "id": "hr",
    "text": "Croatian",
    "related_languages": ["hr"]
  }, {
    "id": "cs",
    "text": "Czech",
    "related_languages": ["cs"]
  }, {
    "id": "da",
    "text": "Danish",
    "related_languages": ["da"]
  }, {
    "id": "nl",
    "text": "Dutch",
    "related_languages": ["nl"]
  }, {
    "id": "tl",
    "text": "Filipino",
    "related_languages": ["tl"]
  }, {
    "id": "fi",
    "text": "Finnish",
    "related_languages": ["fi"]
  }, {
    "id": "fr",
    "text": "French",
    "related_languages": ["fr"]
  }, {
    "id": "de",
    "text": "German",
    "related_languages": ["de"]
  }, {
    "id": "el",
    "text": "Greek",
    "related_languages": ["el"]
  }, {
    "id": "he",
    "text": "Hebrew",
    "related_languages": ["he"]
  }, {
    "id": "hi",
    "text": "Hindi",
    "related_languages": ["hi"]
  }, {
    "id": "hi-en",
    "text": "Hinglish",
    "related_languages": ["hi", "en"]
  }, {
    "id": "hu",
    "text": "Hungarian",
    "related_languages": ["hu"]
  }, {
    "id": "id",
    "text": "Indonesian",
    "related_languages": ["id"]
  }, {
    "id": "it",
    "text": "Italian",
    "related_languages": ["it"]
  }, {
    "id": "ja",
    "text": "Japanese",
    "related_languages": ["ja"]
  }, {
    "id": "kab",
    "text": "Kabyle",
    "related_languages": ["kab"]
  }, {
    "id": "ko",
    "text": "Korean",
    "related_languages": ["ko"]
  }, {
    "id": "lv",
    "text": "Latvian",
    "related_languages": ["lv"]
  }, {
    "id": "lt",
    "text": "Lithuanian",
    "related_languages": ["lt"]
  }, {
    "id": "no",
    "text": "Norwegian",
    "related_languages": ["no"]
  }, {
    "id": "fa",
    "text": "Persian",
    "related_languages": ["fa"]
  }, {
    "id": "pl",
    "text": "Polish",
    "related_languages": ["pl"]
  }, {
    "id": "pt",
    "text": "Portuguese",
    "related_languages": ["pt"]
  }, {
    "id": "ro",
    "text": "Romanian",
    "related_languages": ["ro"]
  }, {
    "id": "ru",
    "text": "Russian",
    "related_languages": ["ru"]
  }, {
    "id": "sr",
    "text": "Serbian",
    "related_languages": ["sr"]
  }, {
    "id": "sk",
    "text": "Slovak",
    "related_languages": ["sk"]
  }, {
    "id": "sl",
    "text": "Slovenian",
    "related_languages": ["sl"]
  }, {
    "id": "es",
    "text": "Spanish",
    "related_languages": ["es"]
  }, {
    "id": "sv",
    "text": "Swedish",
    "related_languages": ["sw"]
  }, {
    "id": "th",
    "text": "Thai",
    "related_languages": ["th"]
  }, {
    "id": "tr",
    "text": "Turkish",
    "related_languages": ["tr"]
  }, {
    "id": "uk",
    "text": "Ukrainian",
    "related_languages": ["uk"]
  }, {
    "id": "vi",
    "text": "Vietnamese",
    "related_languages": ["vi"]
  }],

  "AUTOGENERATED_AUDIO_LANGUAGES": [{
    "id": "en-auto",
    "text": "English (auto)",
    "exploration_language": "en",
    "speech_synthesis_code": "en-GB",
    "speech_synthesis_code_mobile": "en_US"
  }],

  "//" : "Types of view in creator dashboard page.",
  "ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS": {
    "CARD": "card",
    "LIST": "list"
  },

  "WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS": [],

  "FEEDBACK_SUBJECT_MAX_CHAR_LIMIT": 50,

  "SUPPORTED_SPEECH_RECOGNITION_LANGUAGES": [{
      "code": "en",
      "description": "English"
    }, {
      "code": "af",
      "description": "Afrikaans"
    }, {
      "code": "am",
      "description": "Amharic"
    }, {
      "code": "ar",
      "description": "العربية (Arabic)"
    }, {
      "code": "az",
      "description": "Azerbaijani"
    }, {
      "code": "bn",
      "description": "Bengali"
    }, {
      "code": "bg",
      "description": "български (Bulgarian)"
    }, {
      "code": "ca",
      "description": "català (Catalan)"
    }, {
      "code": "cs",
      "description": "čeština (Czech)"
    }, {
      "code": "da",
      "description": "dansk (Danish)"
    }, {
      "code": "de",
      "description": "Deutsch (German)"
    }, {
      "code": "el",
      "description": "Greek"
    }, {
      "code": "es",
      "description": "español (Spanish)"
    }, {
      "code": "fa",
      "description": "Persian"
    }, {
      "code": "fi",
      "description": "suomi (Finnish)"
    }, {
      "code": "fil",
      "description": "Filipino (Pilipinas)"
    }, {
      "code": "fr",
      "description": "français (French)"
    }, {
      "code": "gl",
      "description": "Galego (España)"
    }, {
      "code": "gu",
      "description": "Gujarati"
    }, {
      "code": "he",
      "description": "עברית (Hebrew)"
    }, {
      "code": "hi",
      "description": "हिन्दी (Hindi)"
    }, {
      "code": "hr",
      "description": "hrvatski (Croatian)"
    }, {
      "code": "hu",
      "description": "magyar (Hungarian)"
    }, {
      "code": "hy",
      "description": "Armenian"
    }, {
      "code": "id",
      "description": "Bahasa Indonesia (Indonesian)"
    }, {
      "code": "is",
      "description": "Icelandic"
    }, {
      "code": "it",
      "description": "italiano (Italian)"
    }, {
      "code": "ja",
      "description": "Japanese"
    }, {
      "code": "ka",
      "description": "Georgian (Georgia)"
    }, {
      "code": "kab",
      "description": "Taqbaylit (Kabyle)"
    }, {
      "code": "km",
      "description": "Khmer"
    }, {
      "code": "kn",
      "description": "Kannada"
    }, {
      "code": "ko",
      "description": "Korean"
    }, {
      "code": "lo",
      "description": "Lao"
    }, {
      "code": "lt",
      "description": "lietuvių (Lithuanian)"
    }, {
      "code": "lv",
      "description": "latviešu (Latvian)"
    }, {
      "code": "ml",
      "description": "Malayalam"
    }, {
      "code": "mr",
      "description": "Marathi"
    }, {
      "code": "ms",
      "description": "Bahasa Melayu"
    }, {
      "code": "nb",
      "description": "Norwegian Bokmål"
    }, {
      "code": "ne",
      "description": "Nepali"
    }, {
      "code": "nl",
      "description": "Nederlands"
    }, {
      "code": "no",
      "description": "Norsk (Norwegian)"
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
      "code": "si",
      "description": "Sinhala"
    }, {
      "code": "sk",
      "description": "slovenčina (Slovak)"
    }, {
      "code": "sl",
      "description": "Slovenian"
    }, {
      "code": "sr",
      "description": "српски (Serbian)"
    }, {
      "code": "su",
      "description": "Sundanese"
    }, {
      "code": "sv",
      "description": "Svnska"
    }, {
      "code": "sw",
      "description": "Swahili"
    }, {
      "code": "ta",
      "description": "Tamil"
    }, {
      "code": "te",
      "description": "Telugu"
    }, {
      "code": "th",
      "description": "ภาษาไทย (Thai)"
    }, {
      "code": "tl",
      "description": "Filipino (Filipino)"
    }, {
      "code": "tr",
      "description": "Türkçe (Turkish)"
    }, {
      "code": "uk",
      "description": "українська (Ukrainian)"
    }, {
      "code": "ur",
      "description": "Urdu"
    }, {
      "code": "vi",
      "description": "Tiếng Việt (Vietnamese)"
    }, {
      "code": "zh",
      "description": "中文 (Chinese)"
    }, {
      "code": "zu",
      "description": "Zulu"
    }]

};
