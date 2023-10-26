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
  "DASHBOARD_TYPE_CONTRIBUTOR": "contributor",
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
    "Mathematics": "#cc4b00",
    "Algebra": "#cc4b00",
    "Arithmetic": "#ae511b",
    "Calculus": "#ae5f2d",
    "Logic": "#ae511b",
    "Combinatorics": "#c54f2b",
    "Graph Theory": "#c54f2b",
    "Probability": "#c54f2b",
    "Statistics": "#cc4b00",
    "Geometry": "#be5637",
    "Trigonometry": "#be5637",

    "Algorithms": "#9d6901",
    "Computing": "#927117",
    "Programming": "#886628",

    "Astronomy": "#58613a",
    "Biology": "#657030",
    "Chemistry": "#6c7c36",
    "Engineering": "#6f7a48",
    "Environment": "#747142",
    "Medicine": "#657030",
    "Physics": "#58613a",

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
    "Economics": "#2f836d",
    "Geography": "#3c6d62",
    "Government": "#507c6b",
    "History": "#3d6b52",
    "Law": "#507c6b",

    "Education": "#942e20",
    "Puzzles": "#a8554a",
    "Sport": "#893327",
    "Welcome": "#992a2b"
  },

  // List of supported language codes. Each description has a
  // parenthetical part that may be stripped out to give a shorter
  // description.
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

  // Related languages are used to prioritize an exploration's language when
  // setting the default audio language.
  "SUPPORTED_AUDIO_LANGUAGES": [{
    "id": "en",
    "description": "English",
    "relatedLanguages": ["en"]
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
    "explorationLanguage": "en",
    "speechSynthesisCode": "en-GB",
    "speechSynthesisCodeMobile": "en_US"
  }],

  // Types of view in creator dashboard page.
  "ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS": {
    "CARD": "card",
    "LIST": "list"
  },

  "ALLOWED_QUESTION_INTERACTION_CATEGORIES": [{
    "name": "General",
    "interaction_ids": [
        "MultipleChoiceInput",
        "TextInput"
    ]
  }, {
    "name": "Math",
    "interaction_ids": [
        "NumericInput"
    ]
  }],

  // These categories and interactions are displayed in the order in which they
  // appear in the interaction selector.
  "ALLOWED_INTERACTION_CATEGORIES": [{
    "name": "Commonly Used",
    "interaction_ids": [
        "Continue",
        "EndExploration",
        "ImageClickInput",
        "ItemSelectionInput",
        "MultipleChoiceInput",
        "NumericInput",
        "TextInput",
        "DragAndDropSortInput"
    ]
  }, {
    "name": "Math",
    "interaction_ids": [
        "FractionInput",
        "GraphInput",
        "NumericInput",
        "SetInput",
        "NumericExpressionInput",
        "AlgebraicExpressionInput",
        "MathEquationInput",
        "NumberWithUnits",
        "RatioExpressionInput"
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

  "ALLOWED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS": [],

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

  "ENABLE_PREREQUISITE_SKILLS": false,

  "MAX_SKILLS_PER_QUESTION": 3,

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
      "content_ids_to_audio_translations": {
          "content": {},
          "default_outcome": {}
      },
      "written_translations": {
          "translations_mapping": {
            "content": {},
            "default_outcome": {}
          }
      },
      "linked_skill_id": null,
      "next_content_id_index": 0
  }
};
