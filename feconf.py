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
# Each item is represented as a tuple: (filename, title, category, image_name).
# The fourth element is optional. Note that the filename omits the .yaml suffix.
# The images are in /data/images.
DEMO_EXPLORATIONS = [
    ('welcome', 'Welcome to Oppia!', 'Welcome'),
    ('pitch', 'Pitch Perfect', 'Music', 'pitch.png'),
    ('counting', 'Three Balls', 'Mathematics', 'counting.png'),
    ('boot_verbs', 'Boot Verbs', 'Languages', 'boot_verbs.png'),
    ('hola', '¡Hola!', 'Languages'),
    ('landmarks', 'Landmarks', 'Geography'),
    ('adventure', 'Parametrized Adventure', 'Interactive Fiction'),
    ('root_linear_coefficient_theorem', 'Root Linear Coefficient Theorem', 'Mathematics'),
    ('binary_search', 'The Lazy Magician', 'Mathematics'),
]

# Whether to unconditionally log info messages.
DEBUG = False

# The platform for the storage backend. This is used in the model-switching
# code in core/platform.
PLATFORM = 'gae' if (os.environ.get('SERVER_SOFTWARE')
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
SAMPLE_IMAGES_DIR = 'data/images'
WIDGETS_DIR = 'extensions/widgets'
RULES_DIR = 'extensions/rules'
INTERACTIVE_WIDGETS_DIR = 'extensions/widgets/interactive'
NONINTERACTIVE_WIDGETS_DIR = 'extensions/widgets/noninteractive'

OBJECT_TEMPLATES_DIR = 'extensions/objects/templates'
SKINS_TEMPLATES_DIR = 'extensions/skins'
FRONTEND_TEMPLATES_DIR = ('core/templates/dev/head' if DEV_MODE
                          else 'core/templates/prod/head')
VALUE_GENERATOR_TEMPLATES_DIR = 'extensions/value_generators/templates'

# The id and name for the final state of an exploration.
END_DEST = 'END'

# Default name for a state.
DEFAULT_STATE_NAME = '(untitled state)'

# Name (and description) of the default rule.
DEFAULT_RULE_NAME = 'Default'

ACCEPTED_IMAGE_FORMATS = ['gif', 'jpeg', 'png']

# Set this to True to allow file uploads via YAML in the gallery and editor pages.
ALLOW_YAML_FILE_UPLOAD = False

# Prefixes for widget ids in the datastore.
INTERACTIVE_PREFIX = 'interactive'
NONINTERACTIVE_PREFIX = 'noninteractive'

# The total number of non-interactive widgets. Used as a sanity check.
NONINTERACTIVE_WIDGET_COUNT = 1
# The total number of interactive widgets. Used as a sanity check.
INTERACTIVE_WIDGET_COUNT = 9

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
INVALID_NAME_CHARS = u':#/|_%<>[]{}\ufffd' + chr(127)
for ind in range(32):
    INVALID_NAME_CHARS += chr(ind)

# A sentinel value to indicate that no exploration snapshot should be saved.
NULL_SNAPSHOT = {}
