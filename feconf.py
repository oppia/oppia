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
import datetime
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
TEMPLATES_DIR_PREFIX = 'dev' if DEV_MODE else 'prod'
FRONTEND_TEMPLATES_DIR = os.path.join(
    'core', 'templates', TEMPLATES_DIR_PREFIX, 'head')
DEPENDENCIES_TEMPLATES_DIR = os.path.join('extensions', 'dependencies')
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')

# The maximum number of results to retrieve in a datastore query.
DEFAULT_QUERY_LIMIT = 1000

# The maximum number of results to retrieve in a datastore query
# for top rated published explorations.
NUMBER_OF_TOP_RATED_EXPLORATIONS = 8

# The maximum number of results to retrieve in a datastore query
# for recently published explorations.
RECENTLY_PUBLISHED_QUERY_LIMIT = 8

# The current version of the exploration states blob schema. If any backward-
# incompatible changes are made to the states blob schema in the data store,
# this version number must be changed and the exploration migration job
# executed.
CURRENT_EXPLORATION_STATES_SCHEMA_VERSION = 7

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 2

# The default number of exploration tiles to load at a time in the search
# results page.
SEARCH_RESULTS_PAGE_SIZE = 20

# The default number of commits to show on a page in the exploration history
# tab.
COMMIT_LIST_PAGE_SIZE = 50

# The default number of items to show on a page in the exploration feedback
# tab.
FEEDBACK_TAB_PAGE_SIZE = 20

# Default title for a newly-minted exploration.
DEFAULT_EXPLORATION_TITLE = ''
# Default category for a newly-minted exploration.
DEFAULT_EXPLORATION_CATEGORY = ''
# Default objective for a newly-minted exploration.
DEFAULT_EXPLORATION_OBJECTIVE = ''

# Default name for the initial state of an exploration.
DEFAULT_INIT_STATE_NAME = 'First Card'
# The default content text for the initial state of an exploration.
DEFAULT_INIT_STATE_CONTENT_STR = ''

# Default title for a newly-minted collection.
DEFAULT_COLLECTION_TITLE = ''
# Default category for a newly-minted collection.
DEFAULT_COLLECTION_CATEGORY = ''
# Default objective for a newly-minted collection.
DEFAULT_COLLECTION_OBJECTIVE = ''

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

# Empty scaled average rating as a float.
EMPTY_SCALED_AVERAGE_RATING = 0.0

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
# If you want to turn on this facility please check the email templates in the
# send_role_notification_email() function in email_manager.py and modify them
# accordingly.
CAN_SEND_EDITOR_ROLE_EMAILS = False
# If enabled then emails will be sent to creators for feedback messages.
CAN_SEND_FEEDBACK_MESSAGE_EMAILS = False
# Time to wait before sending feedback message emails (currently set to 1 hour).
DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS = 3600
# Whether to send email updates to a user who has not specified a preference.
DEFAULT_EMAIL_UPDATES_PREFERENCE = False
# Whether to send an invitation email when the user is granted
# new role permissions in an exploration.
DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE = True
# Whether to require an email to be sent, following a moderator action.
REQUIRE_EMAIL_ON_MODERATOR_ACTION = False
# Whether to allow custom event reporting to Google Analytics.
CAN_SEND_ANALYTICS_EVENTS = False
# Timespan in minutes before allowing duplicate emails
DUPLICATE_EMAIL_INTERVAL_MINS = 2

EMAIL_INTENT_SIGNUP = 'signup'
EMAIL_INTENT_DAILY_BATCH = 'daily_batch'
EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION = 'editor_role_notification'
EMAIL_INTENT_MARKETING = 'marketing'
EMAIL_INTENT_PUBLICIZE_EXPLORATION = 'publicize_exploration'
EMAIL_INTENT_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
EMAIL_INTENT_DELETE_EXPLORATION = 'delete_exploration'

MODERATOR_ACTION_PUBLICIZE_EXPLORATION = 'publicize_exploration'
MODERATOR_ACTION_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
DEFAULT_SALUTATION_HTML_FN = (
    lambda recipient_username: 'Hi %s,' % recipient_username)
DEFAULT_SIGNOFF_HTML_FN = (
    lambda sender_username: 'Thanks!<br>%s (Oppia moderator)' % sender_username)

VALID_MODERATOR_ACTIONS = {
    MODERATOR_ACTION_PUBLICIZE_EXPLORATION: {
        'email_config': 'publicize_exploration_email_html_body',
        'email_subject_fn': (
            lambda exp_title: (
                'Your Oppia exploration "%s" has been featured!' % exp_title)),
        'email_intent': EMAIL_INTENT_PUBLICIZE_EXPLORATION,
        'email_salutation_html_fn': DEFAULT_SALUTATION_HTML_FN,
        'email_signoff_html_fn': DEFAULT_SIGNOFF_HTML_FN,
    },
    MODERATOR_ACTION_UNPUBLISH_EXPLORATION: {
        'email_config': 'unpublish_exploration_email_html_body',
        'email_subject_fn': (
            lambda exp_title: (
                'Your Oppia exploration "%s" has been unpublished' % exp_title)
        ),
        'email_intent': 'unpublish_exploration',
        'email_salutation_html_fn': DEFAULT_SALUTATION_HTML_FN,
        'email_signoff_html_fn': DEFAULT_SIGNOFF_HTML_FN,
    },
}

# Panel properties and other constants for the default skin.
GADGET_PANEL_AXIS_HORIZONTAL = 'horizontal'
PANELS_PROPERTIES = {
    'bottom': {
        'width': 350,
        'height': 100,
        'stackable_axis': GADGET_PANEL_AXIS_HORIZONTAL,
        'pixels_between_gadgets': 80,
        'max_gadgets': 1
    }
}

# When the site terms were last updated, in UTC.
REGISTRATION_PAGE_LAST_UPDATED_UTC = datetime.datetime(2015, 10, 14, 2, 40, 0)

# The maximum size of an uploaded file, in bytes.
MAX_FILE_SIZE_BYTES = 1048576

# The default language code for an exploration.
DEFAULT_LANGUAGE_CODE = 'en'

# Whether to include the forum, terms and privacy pages.
SHOW_CUSTOM_PAGES = True

# The id of the default skin.
# TODO(sll): Deprecate this; it is no longer used.
DEFAULT_SKIN_ID = 'conversation_v1'

# The prefix for an 'accepted suggestion' commit message.
COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX = 'Accepted suggestion by'

# User id and username for exploration migration bot. Commits made by this bot
# are not reflected in the exploration summary models, but are recorded in the
# exploration commit log.
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
        'MathExpressionInput',
    ]
}, {
    'name': 'Programming',
    'interaction_ids': [
        'CodeRepl',
        'PencilCodeEditor',
    ],
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

# Demo explorations to load through the admin panel. The id assigned to each
# exploration is based on the key of the exploration in this dict, so ensure it
# doesn't change once it's in the list. Only integer-based indices should be
# used in this list, as it maintains backward compatibility with how demo
# explorations used to be assigned IDs. The value of each entry in this dict is
# either a YAML file or a directory (depending on whether it ends in .yaml).
# These explorations can be found under data/explorations.
DEMO_EXPLORATIONS = {
    u'0': 'welcome.yaml',
    u'1': 'multiples.yaml',
    u'2': 'binary_search',
    u'3': 'root_linear_coefficient_theorem.yaml',
    u'4': 'three_balls',
    # TODO(bhenning): Replace demo exploration '5' with a new exploration
    # described in #1376.
    u'6': 'boot_verbs.yaml',
    u'7': 'hola.yaml',
    u'8': 'adventure.yaml',
    u'9': 'pitch_perfect.yaml',
    u'10': 'test_interactions',
    u'11': 'modeling_graphs',
    u'12': 'protractor_test_1.yaml',
    u'13': 'solar_system',
    u'14': 'about_oppia.yaml',
    u'15': 'fuzzy_exploration.yaml',
    u'16': 'all_interactions',
}

DEMO_COLLECTIONS = {
    u'0': 'welcome_to_collections.yaml'
}

# IDs of explorations which should not be displayable in either the learner or
# editor views.
DISABLED_EXPLORATION_IDS = ['5']

# Google Group embed URL for the Forum page.
EMBEDDED_GOOGLE_GROUP_URL = (
    'https://groups.google.com/forum/embed/?place=forum/oppia')

# Whether to allow YAML file uploads.
ALLOW_YAML_FILE_UPLOAD = False

# TODO(sll): Add all other URLs here.
COLLECTION_DATA_URL_PREFIX = '/collection_handler/data'
COLLECTION_WRITABLE_DATA_URL_PREFIX = '/collection_editor_handler/data'
COLLECTION_RIGHTS_PREFIX = '/collection_editor_handler/rights'
COLLECTION_EDITOR_URL_PREFIX = '/collection_editor/create'
COLLECTION_URL_PREFIX = '/collection'
DASHBOARD_URL = '/dashboard'
DASHBOARD_CREATE_MODE_URL = '%s?mode=create' % DASHBOARD_URL
DASHBOARD_DATA_URL = '/dashboardhandler/data'
EDITOR_URL_PREFIX = '/create'
EXPLORATION_DATA_PREFIX = '/createhandler/data'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_SUMMARIES_DATA_URL = '/explorationsummarieshandler/data'
EXPLORATION_URL_PREFIX = '/explore'
FEEDBACK_STATS_URL_PREFIX = '/feedbackstatshandler'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
LIBRARY_INDEX_URL = '/library'
LIBRARY_INDEX_DATA_URL = '/libraryindexhandler'
LIBRARY_SEARCH_URL = '/search/find'
LIBRARY_SEARCH_DATA_URL = '/searchhandler/data'
NEW_COLLECTION_URL = '/collection_editor_handler/create_new'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
SITE_LANGUAGE_DATA_URL = '/save_site_language'
SIGNUP_DATA_URL = '/signuphandler/data'
SIGNUP_URL = '/signup'
SPLASH_URL = '/splash'
SUGGESTION_ACTION_URL_PREFIX = '/suggestionactionhandler'
SUGGESTION_LIST_URL_PREFIX = '/suggestionlisthandler'
SUGGESTION_URL_PREFIX = '/suggestionhandler'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'

NAV_MODE_ABOUT = 'about'
NAV_MODE_CREATE = 'create'
NAV_MODE_DASHBOARD = 'dashboard'
NAV_MODE_EXPLORE = 'explore'
NAV_MODE_LIBRARY = 'library'
NAV_MODE_PARTICIPATE = 'participate'
NAV_MODE_PROFILE = 'profile'
NAV_MODE_SIGNUP = 'signup'
NAV_MODE_SPLASH = 'splash'
NAV_MODE_TEACH = 'teach'
NAV_MODE_CONTACT = 'contact'

# Event types.
EVENT_TYPE_STATE_HIT = 'state_hit'
EVENT_TYPE_ANSWER_SUBMITTED = 'answer_submitted'
EVENT_TYPE_DEFAULT_ANSWER_RESOLVED = 'default_answer_resolved'
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

# Unfinished features.
SHOW_TRAINABLE_UNRESOLVED_ANSWERS = False
ENABLE_STRING_CLASSIFIER = False
SHOW_COLLECTION_NAVIGATION_TAB_HISTORY = False
SHOW_COLLECTION_NAVIGATION_TAB_FEEDBACK = False
SHOW_COLLECTION_NAVIGATION_TAB_STATS = False

# Output formats of downloaded explorations.
OUTPUT_FORMAT_JSON = 'json'
OUTPUT_FORMAT_ZIP = 'zip'

# Types of updates shown in the 'recent updates' table in the dashboard page.
UPDATE_TYPE_EXPLORATION_COMMIT = 'exploration_commit'
UPDATE_TYPE_COLLECTION_COMMIT = 'collection_commit'
UPDATE_TYPE_FEEDBACK_MESSAGE = 'feedback_thread'

DEFAULT_COLOR = '#a33f40'
DEFAULT_THUMBNAIL_ICON = 'Lightbulb'

# List of supported default categories. For now, each category has
# a specific color associated with it. Each category also has a thumbnail icon
# whose filename is "{{CategoryName}}.svg".
CATEGORIES_TO_COLORS = {
    'Mathematics': '#cd672b',
    'Algebra': '#cd672b',
    'Arithmetic': '#d68453',
    'Calculus': '#b86330',
    'Logic': '#d68453',
    'Combinatorics': '#cf5935',
    'Graph Theory': '#cf5935',
    'Probability': '#cf5935',
    'Statistics': '#cd672b',
    'Geometry': '#d46949',
    'Trigonometry': '#d46949',

    'Algorithms': '#d0982a',
    'Computing': '#bb8b2f',
    'Programming': '#d9aa53',

    'Astronomy': '#879d6c',
    'Biology': '#97a766',
    'Chemistry': '#aab883',
    'Engineering': '#8b9862',
    'Environment': '#aba86d',
    'Medicine': '#97a766',
    'Physics': '#879d6c',

    'Architecture': '#6e3466',
    'Art': '#895a83',
    'Music': '#6a3862',
    'Philosophy': '#613968',
    'Poetry': '#7f507f',

    'English': '#193a69',
    'Languages': '#1b4174',
    'Latin': '#3d5a89',
    'Reading': '#193a69',
    'Spanish': '#405185',
    'Gaulish': '#1b4174',

    'Business': '#387163',
    'Economics': '#5d8b7f',
    'Geography': '#3c6d62',
    'Government': '#538270',
    'History': '#3d6b52',
    'Law': '#538270',

    'Education': '#942e20',
    'Puzzles': '#a8554a',
    'Sport': '#893327',
    'Welcome': '#992a2b',
}

# A sorted list of default categories for which icons and background colours
# exist.
ALL_CATEGORIES = sorted(CATEGORIES_TO_COLORS.keys())

# These categories are shown in the library navbar.
SEARCH_DROPDOWN_CATEGORIES = sorted([
    'Mathematics',
    'Statistics',
    'Algorithms',
    'Programming',
    'Biology',
    'Chemistry',
    'Physics',
    'Medicine',
    'English',
    'Architecture',
    'Art',
    'Music',
    'Reading',
    'Business',
    'Economics',
    'Geography',
    'History',
])

# The header for the "Featured Explorations" category in the library index
# page.
LIBRARY_CATEGORY_FEATURED_EXPLORATIONS = 'Featured Explorations'
# The header for the "Top Rated Explorations" category in the library index
# page.
LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS = 'Top Rated Explorations'
# The header for the "Recently Published" category in the library index
# page.
LIBRARY_CATEGORY_RECENTLY_PUBLISHED = 'Recently Published'

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

SUPPORTED_SITE_LANGUAGES = {
    'en': 'English',
    'es': 'Español'
}
SYSTEM_USERNAMES = [SYSTEM_COMMITTER_ID, MIGRATION_BOT_USERNAME]
SYSTEM_USER_IDS = [SYSTEM_COMMITTER_ID, MIGRATION_BOT_USERNAME]

CSRF_PAGE_NAME_CREATE_EXPLORATION = 'create_exploration'
CSRF_PAGE_NAME_I18N = 'i18n'

# The following are all page descriptions for the meta tag.
ABOUT_PAGE_DESCRIPTION = (
    'Oppia is an open source learning platform that connects a community of '
    'teachers and learners. You can use this site to create 1-1 learning '
    'scenarios for others.')
CREATE_PAGE_DESCRIPTION = (
    'Help others learn new things. Create lessons through explorations and '
    'share your knowledge with the community.')
DASHBOARD_PAGE_DESCRIPTION = (
    'Keep track of the lessons you have created, as well as feedback from '
    'learners.')
FORUM_PAGE_DESCRIPTION = (
    'Engage with the Oppia community by discussing questions, bugs and '
    'explorations in the forum.')
LIBRARY_PAGE_DESCRIPTION = (
    'Looking to learn something new? Find explorations created by professors, '
    'teachers and Oppia users in a subject you\'re interested in, and start '
    'exploring!')
PARTICIPATE_PAGE_DESCRIPTION = (
    'The Oppia library is full of user-created lessons called \'explorations\'.'
    ' Read about how to participate in the community and begin creating '
    'explorations.')
PREFERENCES_PAGE_DESCRIPTION = (
    'Change your Oppia profile settings and preferences')
SEARCH_PAGE_DESCRIPTION = (
    'Discover a new exploration to learn from, or help improve an existing '
    'one for the community.')
SIGNUP_PAGE_DESCRIPTION = 'Sign up for Oppia and begin exploring a new subject.'
SPLASH_PAGE_DESCRIPTION = (
    'Oppia is a free site for sharing knowledge via interactive lessons '
    'called \'explorations\'. Learn from user-created explorations, or teach '
    'and create your own.')
TERMS_PAGE_DESCRIPTION = (
    'Oppia is a 501(c)(3) registered non-profit open-source e-learning '
    'platform. Learn about our terms and conditions for creating and '
    'distributing learning material.')
