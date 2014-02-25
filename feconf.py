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

TESTS_DATA_DIR = 'core/tests/data'
SAMPLE_EXPLORATIONS_DIR = 'data/explorations'
WIDGETS_DIR = 'extensions/widgets'
RULES_DIR = 'extensions/rules'
INTERACTIVE_WIDGETS_DIR = 'extensions/widgets/interactive'
NONINTERACTIVE_WIDGETS_DIR = 'extensions/widgets/noninteractive'

OBJECT_TEMPLATES_DIR = 'extensions/objects/templates'
OBJECTS_DIR = 'extensions/objects'
SKINS_TEMPLATES_DIR = 'extensions/skins'
FRONTEND_TEMPLATES_DIR = ('core/templates/dev/head' if DEV_MODE
                          else 'core/templates/prod/head')
VALUE_GENERATORS_DIR = 'extensions/value_generators'

# The id and name for the final state of an exploration.
END_DEST = 'END'

# The default widget used for a new state.
DEFAULT_WIDGET_ID = 'TextInput'

# Default name for the initial state of an exploration.
DEFAULT_STATE_NAME = '(untitled state)'

# Name (and description) of the default rule.
DEFAULT_RULE_NAME = 'Default'

ACCEPTED_IMAGE_FORMATS = ['gif', 'jpeg', 'png']

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
    '/css': 'core/templates/dev/head/css',
    '/extensions/widgets': 'extensions/widgets',
    '/favicon.ico': 'static/images/favicon.ico',
    '/images': 'static/images',
    '/img': 'third_party/bootstrap/img',
    '/lib/static': 'lib/static',
    '/third_party/static': 'third_party/static',
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


# Ids and locations of the permitted widgets.
ALLOWED_WIDGETS = {
    NONINTERACTIVE_PREFIX: {
        'Collapsible': {
            'dir': 'extensions/widgets/noninteractive/Collapsible'
        },
        'Image': {
            'dir': 'extensions/widgets/noninteractive/Image'
        },
        'Link': {
            'dir': 'extensions/widgets/noninteractive/Link'
        },
        'Math': {
            'dir': 'extensions/widgets/noninteractive/Math'
        },
        'Tabs': {
            'dir': 'extensions/widgets/noninteractive/Tabs'
        },
        'Video': {
            'dir': 'extensions/widgets/noninteractive/Video'
        },
    },
    INTERACTIVE_PREFIX: {
        'Continue': {
            'dir': 'extensions/widgets/interactive/Continue'
        },
        'MultipleChoiceInput': {
            'dir': 'extensions/widgets/interactive/MultipleChoiceInput'
        },
        'NumericInput': {
            'dir': 'extensions/widgets/interactive/NumericInput'
        },
        'TextInput': {
            'dir': 'extensions/widgets/interactive/TextInput'
        },
        'InteractiveMap': {
            'dir': 'extensions/widgets/interactive/InteractiveMap'
        },
        'MusicNotesInput': {
            'dir': 'extensions/widgets/interactive/MusicNotesInput'
        },
        'SetInput': {
            'dir': 'extensions/widgets/interactive/SetInput'
        },
        'FileReadInput': {
            'dir': 'extensions/widgets/interactive/FileReadInput'
        },
        'TarFileReadInput': {
            'dir': 'extensions/widgets/interactive/TarFileReadInput'
        },
        'CodeRepl': {
            'dir': 'extensions/widgets/interactive/CodeRepl'
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
    ('pitch_perfect.yaml', 'Pitch Perfect', 'Music')
]

# TODO(sll): Add all other URLs here.
CLONE_EXPLORATION_URL = '/contributehandler/clone'
CONTRIBUTE_GALLERY_URL = '/contribute'
CONTRIBUTE_GALLERY_DATA_URL = '/contributehandler/data'
EDITOR_PREREQUISITES_URL = '/editor_prerequisites'
EDITOR_PREREQUISITES_DATA_URL = '/editor_prerequisites_handler/data'
EDITOR_URL_PREFIX = '/create'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_URL_PREFIX = '/explore'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
EXPLORATION_TRANSITION_URL_PREFIX = '/explorehandler/transition'
LEARN_GALLERY_URL = '/learn'
LEARN_GALLERY_DATA_URL = '/learnhandler/data'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
SPLASH_PAGE_URL = '/'

NAV_MODE_ABOUT = 'about'
NAV_MODE_CONTACT = 'contact'
NAV_MODE_CONTRIBUTE = 'contribute'
NAV_MODE_CREATE = 'create'
NAV_MODE_EXPLORE = 'explore'
NAV_MODE_LEARN = 'learn'
NAV_MODE_PROFILE = 'profile'
