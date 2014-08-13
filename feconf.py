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
WIDGETS_DIR = os.path.join('extensions', 'widgets')
RULES_DIR = os.path.join('extensions', 'rules')
INTERACTIVE_WIDGETS_DIR = os.path.join('extensions', 'widgets', 'interactive')
NONINTERACTIVE_WIDGETS_DIR = os.path.join(
    'extensions', 'widgets', 'noninteractive')

OBJECT_TEMPLATES_DIR = os.path.join('extensions', 'objects', 'templates')
OBJECTS_DIR = os.path.join('extensions', 'objects')
SKINS_TEMPLATES_DIR = os.path.join('extensions', 'skins')
TEMPLATES_DIR_PREFIX = 'dev' if DEV_MODE else 'prod'
FRONTEND_TEMPLATES_DIR = os.path.join(
    'core', 'templates', TEMPLATES_DIR_PREFIX, 'head')
DEPENDENCIES_TEMPLATES_DIR = os.path.join('extensions', 'dependencies')
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')

# The id and name for the final state of an exploration.
END_DEST = 'END'

# The default number of items to show on a page in a paged view.
DEFAULT_PAGE_SIZE = 50

# The default widget used for a new state.
DEFAULT_WIDGET_ID = 'TextInput'

# Default name for the initial state of an exploration.
DEFAULT_STATE_NAME = '(untitled state)'

# Name (and description) of the default rule.
DEFAULT_RULE_NAME = 'Default'

# A dict containing the accepted image formats (as determined by the imghdr
# module) and the corresponding allowed extensions in the filenames of uploaded
# files.
ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS = {
    'jpeg': ['jpg', 'jpeg'],
    'png': ['png'],
    'gif': ['gif']
}

# Prefixes for widget ids in the datastore.
INTERACTIVE_PREFIX = 'interactive'
NONINTERACTIVE_PREFIX = 'noninteractive'

# The total number of non-interactive widgets. Used as a sanity check.
NONINTERACTIVE_WIDGET_COUNT = 4
# The total number of interactive widgets. Used as a sanity check.
INTERACTIVE_WIDGET_COUNT = 12


DEFAULT_EDITOR_PREREQUISITES_AGREEMENT = """
I understand and agree that any contributions I make to this site will be
licensed under CC-BY-SA v4.0, with a waiver of the attribution requirement. I
will not contribute material to the site (including images and files that are
part of an exploration) whose licensing is not compatible with CC-BY-SA v4.0.
"""

# Static file url to path mapping
PATH_MAP = {
    '/css': os.path.join('core', 'templates', 'dev', 'head', 'css'),
    '/extensions/widgets': os.path.join('extensions', 'widgets'),
    '/favicon.ico': os.path.join('static', 'images', 'favicon.ico'),
    '/images': os.path.join('static', 'images'),
    '/lib/static': os.path.join('lib', 'static'),
    '/third_party/static': os.path.join('third_party', 'static'),
}

# Format string for displaying datetimes in the UI.
HUMAN_READABLE_DATETIME_FORMAT = '%b %d %Y, %H:%M UTC'

# A string containing the disallowed characters in state or exploration names.
# The underscore is needed because spaces in names must be converted to
# underscores when displayed as part of a URL or key. The other conventions
# here are derived from the Wikipedia guidelines for naming articles.
INVALID_NAME_CHARS = u':#/|_%<>[]{}\ufffd\\' + chr(127)
for ind in range(32):
    INVALID_NAME_CHARS += chr(ind)
# Prefix for data sent from the server to the client via JSON.
XSSI_PREFIX = ')]}\'\n'
# A regular expression for alphanumeric characters
ALPHANUMERIC_REGEX = r'^[A-Za-z0-9]+$'

# Committer id for system actions.
ADMIN_COMMITTER_ID = 'admin'
ADMIN_EMAIL_ADDRESS = 'admin@oppia'

# The maximum size of an uploaded file, in bytes.
MAX_FILE_SIZE_BYTES = 1048576

# The default language code for an exploration.
DEFAULT_LANGUAGE_CODE = 'en'

# An ordered list of links to stand-alone pages to display in the 'About' tab.
# Each item is a dict with two keys: the human-readable name of the link and
# the URL of the page.
ABOUT_PAGES = [{
    'name': 'About this site',
    'url': '/about'
}, {
    'name': 'How to use Oppia',
    'url': '/site_guidelines',
}, {
    'name': 'Blog',
    'url': 'https://oppiablog.blogspot.com',
}, {
    'name': 'Contact',
    'url': '/contact',
}]

# Ids and locations of the permitted widgets.
ALLOWED_WIDGETS = {
    NONINTERACTIVE_PREFIX: {
        'Collapsible': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Collapsible')
        },
        'Image': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Image')
        },
        'Link': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Link')
        },
        'Math': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Math')
        },
        'Tabs': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Tabs')
        },
        'Video': {
            'dir': os.path.join(NONINTERACTIVE_WIDGETS_DIR, 'Video')
        },
    },
    INTERACTIVE_PREFIX: {
        'Continue': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'Continue')
        },
        'MultipleChoiceInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'MultipleChoiceInput')
        },
        'NumericInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'NumericInput')
        },
        'TextInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'TextInput')
        },
        'InteractiveMap': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'InteractiveMap')
        },
        'SetInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'SetInput')
        },
        'FileReadInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'FileReadInput')
        },
        'TarFileReadInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'TarFileReadInput')
        },
        'CodeRepl': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'CodeRepl')
        },
        'LogicProof': {
            'dir': 'extensions/widgets/interactive/LogicProof'
        },
        'MusicNotesInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'MusicNotesInput')
        },
        'GraphInput': {
            'dir': os.path.join(INTERACTIVE_WIDGETS_DIR, 'GraphInput')
        },
    }
}

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
    ('counting.yaml', 'Three Balls', 'Mathematics'),
    ('cities.yaml', 'World Cities', 'Geography'),
    ('boot_verbs.yaml', 'Boot Verbs', 'Languages'),
    ('hola.yaml', u'¡Hola!', 'Languages'),
    # This exploration is included to show other applications of Oppia, but
    # please note that Oppia lacks many of the features of a full interactive
    # fiction engine!
    ('adventure.yaml', 'Parameterized Adventure', 'Interactive Fiction'),
    ('pitch_perfect.yaml', 'Pitch Perfect', 'Music'),
    ('test_of_widgets.yaml', 'Test of widgets', 'Test')
]

# TODO(sll): Add all other URLs here.
CLONE_EXPLORATION_URL = '/contributehandler/clone'
CONTRIBUTE_GALLERY_URL = '/contribute'
CONTRIBUTE_GALLERY_DATA_URL = '/contributehandler/data'
EDITOR_PREREQUISITES_URL = '/editor_prerequisites'
EDITOR_PREREQUISITES_DATA_URL = '/editor_prerequisites_handler/data'
EDITOR_URL_PREFIX = '/create'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_DATA_PREFIX = '/createhandler/data'
EXPLORATION_URL_PREFIX = '/explore'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
EXPLORATION_TRANSITION_URL_PREFIX = '/explorehandler/transition'
FEEDBACK_LAST_UPDATED_URL_PREFIX = '/feedback_last_updated'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
HOMEPAGE_URL = '/'
LEARN_GALLERY_URL = '/learn'
LEARN_GALLERY_DATA_URL = '/learnhandler/data'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
PLAYTEST_QUEUE_URL = '/playtest'
PLAYTEST_QUEUE_DATA_URL = '/playtesthandler/data'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'

NAV_MODE_ABOUT = 'about'
NAV_MODE_CONTACT = 'contact'
NAV_MODE_CONTRIBUTE = 'contribute'
NAV_MODE_CREATE = 'create'
NAV_MODE_EXPLORE = 'explore'
NAV_MODE_LEARN = 'learn'
NAV_MODE_PLAYTEST = 'playtest'
NAV_MODE_PROFILE = 'profile'

# Event types.
EVENT_TYPE_STATE_HIT = 'state_hit'
EVENT_TYPE_ANSWER_SUBMITTED = 'answer_submitted'
EVENT_TYPE_DEFAULT_ANSWER_RESOLVED = 'default_answer_resolved'
# The values for these two event types should be left as-is for backwards
# compatibility.
EVENT_TYPE_START_EXPLORATION = 'start'
EVENT_TYPE_MAYBE_LEAVE_EXPLORATION = 'leave'

# Play type constants
PLAY_TYPE_PLAYTEST = 'playtest'
PLAY_TYPE_NORMAL = 'normal'

# Unlaunched feature.
SHOW_SKIN_CHOOSER = False
