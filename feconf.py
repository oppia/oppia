# coding: utf-8
#
# Copyright 2012 Google Inc. All Rights Reserved.
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

from core import settings

# Code contributors, in alphabetical order.
CODE_CONTRIBUTORS = [
    'Jeremy Emerson',
    'Koji Ashida',
    'Manas Tungare',
    'Reinaldo Aguiar',
    'Sean Lip',
    'Stephanie Federwisch',
    'Tarashish Mishra',
    'Wilson Hong',
    'Yana Malysheva',
]

# Idea contributors, in alphabetical order.
IDEA_CONTRIBUTORS = [
    'Albert Gural',
    'Alex Kauffmann',
    'Catherine Colman',
    'John Cox',
    'John Orr',
    'Neil Fraser',
    'Pavel Simakov',
    'Peter Norvig',
    'Phil Wagner',
    'Philip Guo',
]

# Demo explorations to load on startup. The id assigned to each exploration
# is based on the index of the exploration in this list, so if you want to
# add a new exploration and preserve the existing ids, add that exploration
# to the end of the list.
# Each item is represented as a tuple: (filepath, title, category). If the
# filepath is a yaml file it should end with '.yaml', otherwise it should
# be the path to the directory WITHOUT a trailing '/'.
DEMO_EXPLORATIONS = [
    ('welcome.yaml', 'Welcome to Oppia!', 'Welcome'),
    ('pitch.yaml', 'Pitch Perfect', 'Music'),
    ('counting.yaml', 'Three Balls', 'Mathematics'),
    ('boot_verbs.yaml', 'Boot Verbs', 'Languages'),
    ('hola.yaml', '¡Hola!', 'Languages'),
    ('landmarks.yaml', 'Landmarks', 'Geography'),
    ('adventure.yaml', 'Parametrized Adventure', 'Interactive Fiction'),
    ('root_linear_coefficient_theorem.yaml', 'Root Linear Coefficient Theorem',
     'Mathematics'),
    ('binary_search', 'The Lazy Magician', 'Mathematics'),
    ('tar', 'Missions - Tar', 'Open Source Tools'),
    ('cities.yaml', 'World Cities', 'Geography'),
]

# Whether to unconditionally log info messages.
DEBUG = False

# The platform for the storage backend. This is used in the model-switching
# code in core/platform.
PLATFORM = 'gae' if (
    os.environ.get('SERVER_SOFTWARE')
    and (os.environ['SERVER_SOFTWARE'].startswith('Development')
    or os.environ['SERVER_SOFTWARE'].startswith('Google'))) else 'django'


# Whether we should serve the development or production experience.
if PLATFORM == 'gae':
    DEV_MODE = (os.environ.get('SERVER_SOFTWARE')
                and os.environ['SERVER_SOFTWARE'].startswith('Development'))
elif PLATFORM == 'django':
    DEV_MODE = settings.DEV

# The directory containing data files for tests.
TESTS_DATA_DIR = 'core/tests/data'

# The directories containing sample explorations and widgets.
SAMPLE_EXPLORATIONS_DIR = 'data/explorations'
WIDGETS_DIR = 'extensions/widgets'
RULES_DIR = 'extensions/rules'
INTERACTIVE_WIDGETS_DIR = 'extensions/widgets/interactive'
NONINTERACTIVE_WIDGETS_DIR = 'extensions/widgets/noninteractive'

OBJECT_TEMPLATES_DIR = 'extensions/objects/templates'
SKINS_TEMPLATES_DIR = 'extensions/skins'
FRONTEND_TEMPLATES_DIR = ('core/templates/dev/head' if DEV_MODE
                          else 'core/templates/prod/head')
VALUE_GENERATORS_DIR = 'extensions/value_generators'

# The id and name for the final state of an exploration.
END_DEST = 'END'

# Default name for a state.
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
HUMAN_READABLE_DATETIME_FORMAT = '%b %d %Y, %H:%M'

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
# A sentinel value to indicate that no exploration snapshot should be saved.
NULL_SNAPSHOT = {}

# Whether to allow file uploads via YAML in the gallery and editor pages.
ALLOW_YAML_FILE_UPLOAD = False
# Whether or not to require users to have usernames in order to edit
REQUIRE_USERS_TO_SET_USERNAMES = False

# Ids and locations of the permitted noninteractive widgets.
ALLOWED_WIDGETS = {
    NONINTERACTIVE_PREFIX: {
        'Image': {
            'dir': 'extensions/widgets/noninteractive/Image'
        },
        'Hints': {
            'dir': 'extensions/widgets/noninteractive/Hints'
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
        'FileReadInput': {
            'dir': 'extensions/widgets/interactive/FileReadInput'
        },
        'MusicStaff': {
            'dir': 'extensions/widgets/interactive/MusicStaff'
        },
        'SetInput': {
            'dir': 'extensions/widgets/interactive/SetInput'
        },
        'FileReadInputWithHints': {
            'dir': 'extensions/widgets/interactive/FileReadInputWithHints'
        },
        'TarFileReadInputWithHints': {
            'dir': 'extensions/widgets/interactive/TarFileReadInputWithHints'
        },
        'CodeRepl': {
            'dir': 'extensions/widgets/interactive/CodeRepl'
        },
    }
}
