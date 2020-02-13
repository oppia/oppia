/* eslint-disable quote-props */
/* eslint-disable quotes */
/* Don't modify anything outside the {} brackets.
 * Insides of the {} brackets should be formatted as a JSON object.
 * JSON rules:
 * 1. All keys and string values must be enclosed in double quotes.
 * 2. Each key/value pair should be on a new line.
 * 3. All values and keys must be constant, you can't use any Javascript
 *    functions.
 */

/**
 * @fileoverview Initializes constants for the Oppia codebase.
 */

export = {
  // Whether to allow custom event reporting to Google Analytics.
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

  // These categories are shown in the library navbar. The categories should
  // be in sorted order.
  "SEARCH_DROPDOWN_CATEGORIES": ["Algorithms", "Architecture", "Art",
    "Biology", "Business", "Chemistry", "Economics", "English", "Geography",
    "History", "Mathematics", "Medicine", "Music", "Physics", "Programming",
    "Reading", "Statistics"],

  // The default language code for an exploration.
  "DEFAULT_LANGUAGE_CODE": "en",

  // List of supported default categories. For now, each category has a specific
  // color associated with it. Each category also has a thumbnail icon whose
  // filename is '{{CategoryName}}.svg'.
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

  // List of supported content languages in which we can create explorations or
  // other entities. Each description has a parenthetical part that may be
  // stripped out to give a shorter description.
  "SUPPORTED_CONTENT_LANGUAGES": [{
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

  // NOTE TO DEVELOPERS: While adding another language, please ensure that the
  // languages are in alphabetical order.
  // List of supported site languages in which the platform is offered.
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

  // List of supported audio languages in which we have audio and translations
  // for explorations or other entities.
  // Related languages are used to prioritize an exploration's language when
  // setting the default audio language.
  "SUPPORTED_AUDIO_LANGUAGES": [{
    "id": "en",
    "description": "English",
    "relatedLanguages": ["en"]
  }, {
    "id": "ak",
    "description": "Akan",
    "relatedLanguages": ["ak"]
  }, {
    "id": "ar",
    "description": "Arabic",
    "relatedLanguages": ["ar"]
  }, {
    "id": "bg",
    "description": "Bulgarian",
    "relatedLanguages": ["bg"]
  }, {
    "id": "bn",
    "description": "Bangla",
    "relatedLanguages": ["bn"]
  }, {
    "id": "ms",
    "description": "Bahasa Melayu",
    "relatedLanguages": ["ms"]
  }, {
    "id": "ca",
    "description": "Catalan",
    "relatedLanguages": ["ca"]
  }, {
    "id": "zh",
    "description": "Chinese",
    "relatedLanguages": ["zh"]
  }, {
    "id": "hr",
    "description": "Croatian",
    "relatedLanguages": ["hr"]
  }, {
    "id": "cs",
    "description": "Czech",
    "relatedLanguages": ["cs"]
  }, {
    "id": "da",
    "description": "Danish",
    "relatedLanguages": ["da"]
  }, {
    "id": "nl",
    "description": "Dutch",
    "relatedLanguages": ["nl"]
  }, {
    "id": "ee",
    "description": "Ewe",
    "relatedLanguages": ["ee"]
  }, {
    "id": "tl",
    "description": "Filipino",
    "relatedLanguages": ["tl"]
  }, {
    "id": "fi",
    "description": "Finnish",
    "relatedLanguages": ["fi"]
  }, {
    "id": "fr",
    "description": "French",
    "relatedLanguages": ["fr"]
  }, {
    "id": "de",
    "description": "German",
    "relatedLanguages": ["de"]
  }, {
    "id": "el",
    "description": "Greek",
    "relatedLanguages": ["el"]
  }, {
    "id": "gaa",
    "description": "Ga",
    "relatedLanguages": ["gaa"]
  }, {
    "id": "he",
    "description": "Hebrew",
    "relatedLanguages": ["he"]
  }, {
    "id": "hi",
    "description": "Hindi",
    "relatedLanguages": ["hi"]
  }, {
    "id": "hi-en",
    "description": "Hinglish",
    "relatedLanguages": ["hi", "en"]
  }, {
    "id": "hu",
    "description": "Hungarian",
    "relatedLanguages": ["hu"]
  }, {
    "id": "id",
    "description": "Indonesian",
    "relatedLanguages": ["id"]
  }, {
    "id": "it",
    "description": "Italian",
    "relatedLanguages": ["it"]
  }, {
    "id": "ja",
    "description": "Japanese",
    "relatedLanguages": ["ja"]
  }, {
    "id": "kab",
    "description": "Kabyle",
    "relatedLanguages": ["kab"]
  }, {
    "id": "ko",
    "description": "Korean",
    "relatedLanguages": ["ko"]
  }, {
    "id": "lv",
    "description": "Latvian",
    "relatedLanguages": ["lv"]
  }, {
    "id": "lt",
    "description": "Lithuanian",
    "relatedLanguages": ["lt"]
  }, {
    "id": "no",
    "description": "Norwegian",
    "relatedLanguages": ["no"]
  }, {
    "id": "fa",
    "description": "Persian",
    "relatedLanguages": ["fa"]
  }, {
    "id": "pl",
    "description": "Polish",
    "relatedLanguages": ["pl"]
  }, {
    "id": "pt",
    "description": "Portuguese",
    "relatedLanguages": ["pt"]
  }, {
    "id": "ro",
    "description": "Romanian",
    "relatedLanguages": ["ro"]
  }, {
    "id": "ru",
    "description": "Russian",
    "relatedLanguages": ["ru"]
  }, {
    "id": "sr",
    "description": "Serbian",
    "relatedLanguages": ["sr"]
  }, {
    "id": "sk",
    "description": "Slovak",
    "relatedLanguages": ["sk"]
  }, {
    "id": "sl",
    "description": "Slovenian",
    "relatedLanguages": ["sl"]
  }, {
    "id": "es",
    "description": "Spanish",
    "relatedLanguages": ["es"]
  }, {
    "id": "sv",
    "description": "Swedish",
    "relatedLanguages": ["sw"]
  }, {
    "id": "th",
    "description": "Thai",
    "relatedLanguages": ["th"]
  }, {
    "id": "tr",
    "description": "Turkish",
    "relatedLanguages": ["tr"]
  }, {
    "id": "uk",
    "description": "Ukrainian",
    "relatedLanguages": ["uk"]
  }, {
    "id": "vi",
    "description": "Vietnamese",
    "relatedLanguages": ["vi"]
  }],

  "AUTOGENERATED_AUDIO_LANGUAGES": [{
    "id": "en-auto",
    "description": "English (auto)",
    "exploration_language": "en",
    "speech_synthesis_code": "en-GB",
    "speech_synthesis_code_mobile": "en_US"
  }],

  // Types of view in creator dashboard page.
  "ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS": {
    "CARD": "card",
    "LIST": "list"
  },

  "ALLOWED_QUESTION_INTERACTION_CATEGORIES": [{
    "name": "General",
    "interaction_ids": [
      "ImageClickInput",
      "ItemSelectionInput",
      "MultipleChoiceInput",
      "TextInput"
    ]
  }, {
    "name": "Math",
    "interaction_ids": [
      "FractionInput",
      "NumberWithUnits",
      "NumericInput"
    ]
  }],

  // These categories and interactions are displayed in the order in which they
  // appear in the interaction selector.
  "ALLOWED_INTERACTION_CATEGORIES": [{
    "name": "General",
    "interaction_ids": [
      "Continue",
      "EndExploration",
      "ImageClickInput",
      "ItemSelectionInput",
      "MultipleChoiceInput",
      "TextInput",
      "DragAndDropSortInput"
    ]
  }, {
    "name": "Math",
    "interaction_ids": [
      "FractionInput",
      "GraphInput",
      "LogicProof",
      "NumericInput",
      "SetInput",
      "MathExpressionInput",
      "NumberWithUnits"
    ]
  }, {
    "name": "Programming",
    "interaction_ids": [
      "CodeRepl",
      "PencilCodeEditor"
    ]
  }, {
    "name": "Music",
    "interaction_ids": [
      "MusicNotesInput"
    ]
  }, {
    "name": "Geography",
    "interaction_ids": [
      "InteractiveMap"
    ]
  }],

  // Interaction IDs for which answer details cannot be solicited.
  "INTERACTION_IDS_WITHOUT_ANSWER_DETAILS": ["EndExploration", "Continue"],

  "WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS": [],

  "FEEDBACK_SUBJECT_MAX_CHAR_LIMIT": 50,

  "ACTIVITY_STATUS_PRIVATE": "private",
  "ACTIVITY_STATUS_PUBLIC": "public",

  "SITE_FEEDBACK_FORM_URL": "",

  "SYSTEM_USER_IDS": ["admin", "OppiaMigrationBot"],

  // A string containing the disallowed characters in state or exploration
  // names. The underscore is needed because spaces in names must be converted
  // to underscores when displayed as part of a URL or key. The other
  // conventions here are derived from the Wikipedia guidelines for naming
  // articles.
  "INVALID_NAME_CHARS": [
    ":", "#", "/", "|", "_", "%", "<", ">", "[", "]", "{", "}", "\\ufffd",
    "\\\\", "\\u007f", "\\u0000", "\\u0001", "\\u0002", "\\u0003", "\\u0004",
    "\\u0005", "\\u0006", "\\u0007", "\\b", "\\t", "\\n", "\\u000b", "\\f",
    "\\r", "\\u000e", "\\u000f", "\\u0010", "\\u0011", "\\u0012", "\\u0013",
    "\\u0014", "\\u0015", "\\u0016", "\\u0017", "\\u0018", "\\u0019", "\\u001a",
    "\\u001b", "\\u001c", "\\u001d", "\\u001e", "\\u001f"
  ],

  "DEFAULT_SKILL_DIFFICULTY": 0.3,

  "INLINE_RTE_COMPONENTS": ["link", "math", "skillreview"],

  "SKILL_DIFFICULTIES": ["Easy", "Medium", "Hard"],

  "ENABLE_PREREQUISITE_SKILLS": false,

  // For the full new structures viewer features, both
  // ENABLE_NEW_STRUCTURE_PLAYERS and ENABLE_NEW_STRUCTURE_VIEWER_UPDATES has
  // to be true. Only ENABLE_NEW_STRUCTURE_PLAYERS can be true if just the
  // players need to be accessed, but without story progress updation.
  // This is split up so as to access the viewers in production without
  // exposing the POST and PUT endpoints just yet.
  "ENABLE_NEW_STRUCTURE_PLAYERS": true,
  "ENABLE_NEW_STRUCTURE_VIEWER_UPDATES": false,

  "ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE": true,

  "MAX_SKILLS_PER_QUESTION": 3,

  "MAX_QUESTIONS_PER_SKILL": 50,

  "NUM_EXPLORATIONS_PER_REVIEW_TEST": 3,

  "NUM_QUESTIONS_PER_PAGE": 10,

  "NEW_STATE_TEMPLATE": {
    "classifier_model_id": null,
    "content": {
      "html": "",
      "content_id": "content"
    },
    "interaction": {
      "id": null,
      "customization_args": {},
      "answer_groups": [],
      "default_outcome": {
        "dest": "Introduction",
        "feedback": {
          "content_id": "default_outcome",
          "html": ""
        },
        "labelled_as_correct": false,
        "param_changes": [],
        "refresher_exploration_id": null,
        "missing_prerequisite_skill_id": null
      },
      "confirmed_unclassified_answers": [],
      "hints": [],
      "solution": null
    },
    "param_changes": [],
    "recorded_voiceovers": {
      "voiceovers_mapping": {
        "content": {},
        "default_outcome": {}
      }
    },
    "solicit_answer_details": false,
    "written_translations": {
      "translations_mapping": {
        "content": {},
        "default_outcome": {}
      }
    }
  },

  // Data required for Google Analytics.
  "ANALYTICS_ID": "",
  "SITE_NAME_FOR_ANALYTICS": "",

  "ALLOW_YAML_FILE_UPLOAD": false,

  // A regular expression for tags.
  "TAG_REGEX": "^[a-z ]+$",

  // Invalid names for parameters used in expressions.
  "INVALID_PARAMETER_NAMES": [
    "answer", "choices", "abs", "all", "and", "any", "else",
    "floor", "if", "log", "or", "pow", "round", "then"
  ],

  // Unfinished features.
  "SHOW_TRAINABLE_UNRESOLVED_ANSWERS": false,

  // eslint-disable-next-line max-len
  "DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR": "Check out this interactive lesson I created on Oppia - a free platform for teaching and learning!",

  "OPPORTUNITY_TYPE_SKILL": "skill",
  "OPPORTUNITY_TYPE_TRANSLATION": "translation",
  "OPPORTUNITY_TYPE_VOICEOVER": "voiceover",

  // The bucket name is set to None-resources to enable it to be used
  // in prod mode when the resource bucket name is not allowed to be null.
  "GCS_RESOURCE_BUCKET_NAME": "None-resources",

  // Used to disable account removal until it is fully implemented.
  "ENABLE_ACCOUNT_DELETION": false,

  // Used to hide the callout to classroom until it is ready.
  "SHOW_CLASSROOM_CALLOUT": false,

  "DEV_MODE": true
};
