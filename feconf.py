# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Stores various configuration options and constants for Oppia."""

import copy
import os

# Whether to unconditionally log info messages.
DEBUG = False

# The platform for the storage backend. This is used in the model-switching
# code in core/platform.
PLATFORM = 'gae'

# Whether we should serve the development or production experience.
if PLATFORM == 'gae':
    DEV_MODE = (
        not os.environ.get('SERVER_SOFTWARE')
        or os.environ['SERVER_SOFTWARE'].startswith('Development'))
else:
    raise Exception('Invalid platform: expected one of [\'gae\']')

TESTS_DATA_DIR = os.path.join('core', 'tests', 'data')
SAMPLE_EXPLORATIONS_DIR = os.path.join('data', 'explorations')
SAMPLE_COLLECTIONS_DIR = os.path.join('data', 'collections')
INTERACTIONS_DIR = os.path.join('extensions', 'interactions')
GADGETS_DIR = os.path.join('extensions', 'gadgets')
RTE_EXTENSIONS_DIR = os.path.join('extensions', 'rich_text_components')
RULES_DIR = os.path.join('extensions', 'rules')

OBJECT_TEMPLATES_DIR = os.path.join('extensions', 'objects', 'templates')
SKINS_TEMPLATES_DIR = os.path.join('extensions', 'skins')
TEMPLATES_DIR_PREFIX = 'dev' if DEV_MODE else 'prod'
FRONTEND_TEMPLATES_DIR = os.path.join(
    'core', 'templates', TEMPLATES_DIR_PREFIX, 'head')
DEPENDENCIES_TEMPLATES_DIR = os.path.join('extensions', 'dependencies')
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')

# The maximum number of results to retrieve in a datastore query.
DEFAULT_QUERY_LIMIT = 1000

# The current version of the exploration states blob schema. If any backward-
# incompatible changes are made to the states blob schema in the data store,
# this version number must be changed and the exploration migration job
# executed.
CURRENT_EXPLORATION_STATES_SCHEMA_VERSION = 6

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 1

# The default number of exploration tiles to load at a time in the gallery
# page.
GALLERY_PAGE_SIZE = 10

# The default number of commits to show on a page in the exploration history
# tab.
COMMIT_LIST_PAGE_SIZE = 50

# The default number of items to show on a page in the exploration feedback
# tab.
FEEDBACK_TAB_PAGE_SIZE = 20

# Default name for the initial state of an exploration.
DEFAULT_INIT_STATE_NAME = 'First Card'
# The default content text for the initial state of an exploration.
DEFAULT_INIT_STATE_CONTENT_STR = ''

# The threshold the truth value of an evaluated answer group must equal or
# exceed in order to be considered a better classification than the default
# group.
DEFAULT_ANSWER_GROUP_CLASSIFICATION_THRESHOLD = 0.3

# A dict containing the accepted image formats (as determined by the imghdr
# module) and the corresponding allowed extensions in the filenames of uploaded
# files.
ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS = {
    'jpeg': ['jpg', 'jpeg'],
    'png': ['png'],
    'gif': ['gif']
}

# Static file url to path mapping
PATH_MAP = {
    '/css': os.path.join('core', 'templates', 'dev', 'head', 'css'),
    '/extensions/gadgets': GADGETS_DIR,
    '/extensions/interactions': INTERACTIONS_DIR,
    '/extensions/rich_text_components': RTE_EXTENSIONS_DIR,
    '/favicon.ico': os.path.join('static', 'images', 'favicon.ico'),
    '/images': os.path.join('static', 'images'),
    '/lib/static': os.path.join('lib', 'static'),
    '/third_party/static': os.path.join('third_party', 'static'),
}

# A string containing the disallowed characters in state or exploration names.
# The underscore is needed because spaces in names must be converted to
# underscores when displayed as part of a URL or key. The other conventions
# here are derived from the Wikipedia guidelines for naming articles.
INVALID_NAME_CHARS = u':#/|_%<>[]{}\ufffd\\' + chr(127)
for ind in range(32):
    INVALID_NAME_CHARS += chr(ind)
# Prefix for data sent from the server to the client via JSON.
XSSI_PREFIX = ')]}\'\n'
# A regular expression for alphanumeric characters.
ALPHANUMERIC_REGEX = r'^[A-Za-z0-9]+$'
# A regular expression for alphanumeric words separated by single spaces.
# Ex.: 'valid name', 'another valid name', 'invalid   name'.
ALPHANUMERIC_SPACE_REGEX = r'^[0-9A-Za-z]+(?:[ ]?[0-9A-Za-z]+)*$'
# A regular expression for tags.
TAG_REGEX = r'^[a-z ]+$'

# Invalid names for parameters used in expressions.
AUTOMATICALLY_SET_PARAMETER_NAMES = ['answer', 'choices']
INVALID_PARAMETER_NAMES = AUTOMATICALLY_SET_PARAMETER_NAMES + [
    'abs', 'all', 'and', 'any', 'else', 'floor', 'if', 'log', 'or',
    'pow', 'round', 'then']

# These are here rather than in rating_services.py to avoid import
# circularities with exp_services.
# TODO (Jacob) Refactor exp_services to remove this problem.
_EMPTY_RATINGS = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
def get_empty_ratings():
    return copy.deepcopy(_EMPTY_RATINGS)

# Committer id for system actions.
SYSTEM_COMMITTER_ID = 'admin'
SYSTEM_EMAIL_ADDRESS = 'system@example.com'
ADMIN_EMAIL_ADDRESS = 'testadmin@example.com'
# Ensure that SYSTEM_EMAIL_ADDRESS and ADMIN_EMAIL_ADDRESS are both valid and
# correspond to owners of the app before setting this to True. If
# SYSTEM_EMAIL_ADDRESS is not that of an app owner, email messages from this
# address cannot be sent.
CAN_SEND_EMAILS_TO_ADMIN = False
# Ensure that SYSTEM_EMAIL_ADDRESS is valid and corresponds to an owner of the
# app before setting this to True. Emails will be sent from
# SYSTEM_EMAIL_ADDRESS. If SYSTEM_EMAIL_ADDRESS is not that of an app owner,
# email messages from this user cannot be sent.
CAN_SEND_EMAILS_TO_USERS = False
# Whether to send email updates to a user who has not specified a preference.
DEFAULT_EMAIL_UPDATES_PREFERENCE = False

# The maximum size of an uploaded file, in bytes.
MAX_FILE_SIZE_BYTES = 1048576

# The default language code for an exploration.
DEFAULT_LANGUAGE_CODE = 'en'

# Whether to include the forum, terms and privacy pages.
SHOW_CUSTOM_PAGES = True

# User id and username for exploration migration bot.
MIGRATION_BOT_USER_ID = 'OppiaMigrationBot'
MIGRATION_BOT_USERNAME = 'OppiaMigrationBot'

# Ids and locations of the permitted extensions.
ALLOWED_RTE_EXTENSIONS = {
    'Collapsible': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Collapsible')
    },
    'Image': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Image')
    },
    'Link': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Link')
    },
    'Math': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Math')
    },
    'Tabs': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Tabs')
    },
    'Video': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Video')
    },
}

# These categories and interactions are displayed in the order in which they
# appear in the interaction selector.
ALLOWED_INTERACTION_CATEGORIES = [{
    'name': 'General',
    'interaction_ids': [
        'Continue',
        'EndExploration',
        'ImageClickInput',
        'ItemSelectionInput',
        'MultipleChoiceInput',
        'TextInput'
    ],
}, {
    'name': 'Math',
    'interaction_ids': [
        'GraphInput',
        'LogicProof',
        'NumericInput',
        'SetInput',
    ]
}, {
    'name': 'Programming',
    'interaction_ids': ['CodeRepl'],
}, {
    'name': 'Music',
    'interaction_ids': [
        'MusicNotesInput'
    ],
}, {
    'name': 'Geography',
    'interaction_ids': [
        'InteractiveMap'
    ],
}]

ALLOWED_GADGETS = {
    'ScoreBar': {
        'dir': os.path.join(GADGETS_DIR, 'ScoreBar')
    },
}

# Gadgets subclasses must specify a valid panel option from this list.
ALLOWED_GADGET_PANELS = ['bottom']

# Demo explorations to load on startup. The id assigned to each exploration
# is based on the index of the exploration in this list, so if you want to
# add a new exploration and preserve the existing ids, add that exploration
# to the end of the list.
# Each item is represented as a tuple: (filepath, title, category). If the
# filepath is a yaml file it should end with '.yaml', otherwise it should
# be the path to the directory WITHOUT a trailing '/'.
DEMO_EXPLORATIONS = [
    ('welcome.yaml', 'Welcome to Oppia!', 'Welcome'),
    ('multiples.yaml', 'Project Euler Problem 1', 'Coding'),
    ('binary_search', 'The Lazy Magician', 'Mathematics'),
    ('root_linear_coefficient_theorem.yaml', 'Root Linear Coefficient Theorem',
     'Mathematics'),
    ('three_balls', 'Three Balls', 'Mathematics'),
    ('cities.yaml', 'World Cities', 'Geography'),
    ('boot_verbs.yaml', 'Boot Verbs', 'Languages'),
    ('hola.yaml', u'¡Hola!', 'Languages'),
    # This exploration is included to show other applications of Oppia, but
    # please note that Oppia lacks many of the features of a full interactive
    # fiction engine!
    ('adventure.yaml', 'Parameterized Adventure', 'Interactive Fiction'),
    ('pitch_perfect.yaml', 'Pitch Perfect', 'Music'),
    ('test_interactions', 'Test of expressions and interactions', 'Test'),
    ('modeling_graphs', 'Graph Modeling', 'Mathematics'),
    ('protractor_test_1.yaml', 'Protractor Test', 'Mathematics'),
    ('solar_system', 'The Solar System', 'Physics'),
    ('about_oppia.yaml', 'About Oppia', 'Welcome'),
    ('fuzzy_exploration.yaml', 'Demonstrating fuzzy rules', 'Test'),
]

DEMO_COLLECTIONS = [
    'welcome_to_collections.yaml'
]

# TODO(sll): Add all other URLs here.
CONTRIBUTE_GALLERY_URL = '/contribute'
EDITOR_URL_PREFIX = '/create'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_DATA_PREFIX = '/createhandler/data'
EXPLORATION_URL_PREFIX = '/explore'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
FEEDBACK_LAST_UPDATED_URL_PREFIX = '/feedback_last_updated'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
GALLERY_URL = '/gallery'
GALLERY_CREATE_MODE_URL = '%s?mode=create' % GALLERY_URL
GALLERY_DATA_URL = '/galleryhandler/data'
LEARN_GALLERY_URL = '/learn'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
PLAYTEST_QUEUE_URL = '/playtest'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
SIGNUP_URL = '/signup'
SIGNUP_DATA_URL = '/signuphandler/data'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'

NAV_MODE_ABOUT = 'about'
NAV_MODE_CREATE = 'create'
NAV_MODE_EXPLORE = 'explore'
NAV_MODE_GALLERY = 'gallery'
NAV_MODE_HOME = 'home'
NAV_MODE_PARTICIPATE = 'participate'
NAV_MODE_PROFILE = 'profile'
NAV_MODE_SIGNUP = 'signup'

# Event types.
EVENT_TYPE_STATE_HIT = 'state_hit'
EVENT_TYPE_ANSWER_SUBMITTED = 'answer_submitted'
EVENT_TYPE_DEFAULT_ANSWER_RESOLVED = 'default_answer_resolved'
EVENT_TYPE_EXPLORATION_CHANGE = 'exploration_change'
EVENT_TYPE_EXPLORATION_STATUS_CHANGE = 'exploration_status_change'
EVENT_TYPE_COLLECTION_CHANGE = 'collection_change'
EVENT_TYPE_COLLECTION_STATUS_CHANGE = 'collection_status_change'
EVENT_TYPE_NEW_THREAD_CREATED = 'feedback_thread_created'
EVENT_TYPE_THREAD_STATUS_CHANGED = 'feedback_thread_status_changed'
# The values for these event types should be left as-is for backwards
# compatibility.
EVENT_TYPE_START_EXPLORATION = 'start'
EVENT_TYPE_MAYBE_LEAVE_EXPLORATION = 'leave'
EVENT_TYPE_COMPLETE_EXPLORATION = 'complete'

ACTIVITY_STATUS_PRIVATE = 'private'
ACTIVITY_STATUS_PUBLIC = 'public'
ACTIVITY_STATUS_PUBLICIZED = 'publicized'

# Play type constants
PLAY_TYPE_PLAYTEST = 'playtest'
PLAY_TYPE_NORMAL = 'normal'

# Predefined commit messages.
COMMIT_MESSAGE_EXPLORATION_DELETED = 'Exploration deleted.'
COMMIT_MESSAGE_COLLECTION_DELETED = 'Collection deleted.'

# Advanced feature.
SHOW_GADGETS_EDITOR = False

# Unlaunched feature.
SHOW_SKIN_CHOOSER = False

# Unfinished feature.
SHOW_TRAINABLE_UNRESOLVED_ANSWERS = False

# Output formats of downloaded explorations.
OUTPUT_FORMAT_JSON = 'json'
OUTPUT_FORMAT_ZIP = 'zip'

# Types of updates shown in the 'recent updates' table in the dashboard page.
UPDATE_TYPE_EXPLORATION_COMMIT = 'exploration_commit'
UPDATE_TYPE_COLLECTION_COMMIT = 'collection_commit'
UPDATE_TYPE_FEEDBACK_MESSAGE = 'feedback_thread'

# Default color
COLOR_TEAL = 'teal'
# Social sciences
COLOR_SALMON = 'salmon'
# Art
COLOR_SUNNYSIDE = 'sunnyside'
# Mathematics and computing
COLOR_SHARKFIN = 'sharkfin'
# Science
COLOR_GUNMETAL = 'gunmetal'
DEFAULT_COLOR = COLOR_TEAL

# List of supported default categories. For now, each category has
# a specific color associated with it.
CATEGORIES_TO_COLORS = {
    'Architecture': COLOR_SUNNYSIDE,
    'Art': COLOR_SUNNYSIDE,
    'Biology': COLOR_GUNMETAL,
    'Business': COLOR_SALMON,
    'Chemistry': COLOR_GUNMETAL,
    'Computing': COLOR_SHARKFIN,
    'Economics': COLOR_SALMON,
    'Education': COLOR_TEAL,
    'Engineering': COLOR_GUNMETAL,
    'Environment': COLOR_GUNMETAL,
    'Geography': COLOR_SALMON,
    'Government': COLOR_SALMON,
    'Hobbies': COLOR_TEAL,
    'Languages': COLOR_SUNNYSIDE,
    'Law': COLOR_SALMON,
    'Life Skills': COLOR_TEAL,
    'Mathematics': COLOR_SHARKFIN,
    'Medicine': COLOR_GUNMETAL,
    'Music': COLOR_SUNNYSIDE,
    'Philosophy': COLOR_SALMON,
    'Physics': COLOR_GUNMETAL,
    'Programming': COLOR_SHARKFIN,
    'Psychology': COLOR_SALMON,
    'Puzzles': COLOR_TEAL,
    'Reading': COLOR_TEAL,
    'Religion': COLOR_SALMON,
    'Sport': COLOR_SUNNYSIDE,
    'Statistics': COLOR_SHARKFIN,
    'Welcome': COLOR_TEAL,
}

# A sorted list of default categories.
DEFAULT_CATEGORIES = sorted(CATEGORIES_TO_COLORS.keys())

# List of supported language codes. Each description has a
# parenthetical part that may be stripped out to give a shorter
# description.
ALL_LANGUAGE_CODES = [{
    'code': 'en', 'description': u'English',
}, {
    'code': 'ar', 'description': u'العربية (Arabic)',
}, {
    'code': 'bg', 'description': u'български (Bulgarian)',
}, {
    'code': 'ca', 'description': u'català (Catalan)',
}, {
    'code': 'zh', 'description': u'中文 (Chinese)',
}, {
    'code': 'hr', 'description': u'hrvatski (Croatian)',
}, {
    'code': 'cs', 'description': u'čeština (Czech)',
}, {
    'code': 'da', 'description': u'dansk (Danish)',
}, {
    'code': 'nl', 'description': u'Nederlands (Dutch)',
}, {
    'code': 'tl', 'description': u'Filipino (Filipino)',
}, {
    'code': 'fi', 'description': u'suomi (Finnish)',
}, {
    'code': 'fr', 'description': u'français (French)',
}, {
    'code': 'de', 'description': u'Deutsch (German)',
}, {
    'code': 'el', 'description': u'ελληνικά (Greek)',
}, {
    'code': 'he', 'description': u'עברית (Hebrew)',
}, {
    'code': 'hi', 'description': u'हिन्दी (Hindi)',
}, {
    'code': 'hu', 'description': u'magyar (Hungarian)',
}, {
    'code': 'id', 'description': u'Bahasa Indonesia (Indonesian)',
}, {
    'code': 'it', 'description': u'italiano (Italian)',
}, {
    'code': 'ja', 'description': u'日本語 (Japanese)',
}, {
    'code': 'ko', 'description': u'한국어 (Korean)',
}, {
    'code': 'lv', 'description': u'latviešu (Latvian)',
}, {
    'code': 'lt', 'description': u'lietuvių (Lithuanian)',
}, {
    'code': 'no', 'description': u'Norsk (Norwegian)',
}, {
    'code': 'fa', 'description': u'فارسی (Persian)',
}, {
    'code': 'pl', 'description': u'polski (Polish)',
}, {
    'code': 'pt', 'description': u'português (Portuguese)',
}, {
    'code': 'ro', 'description': u'română (Romanian)',
}, {
    'code': 'ru', 'description': u'русский (Russian)',
}, {
    'code': 'sr', 'description': u'српски (Serbian)',
}, {
    'code': 'sk', 'description': u'slovenčina (Slovak)',
}, {
    'code': 'sl', 'description': u'slovenščina (Slovenian)',
}, {
    'code': 'es', 'description': u'español (Spanish)',
}, {
    'code': 'sv', 'description': u'svenska (Swedish)',
}, {
    'code': 'th', 'description': u'ภาษาไทย (Thai)',
}, {
    'code': 'tr', 'description': u'Türkçe (Turkish)',
}, {
    'code': 'uk', 'description': u'українська (Ukrainian)',
}, {
    'code': 'vi', 'description': u'Tiếng Việt (Vietnamese)',
}]

# Defaults for topic similarities
DEFAULT_TOPIC_SIMILARITY = 0.5
SAME_TOPIC_SIMILARITY = 1.0
