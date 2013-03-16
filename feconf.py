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
import jinja2

# Code contributors, in alphabetical order.
CODE_CONTRIBUTORS = [
    'Jeremy Emerson',
    'Manas Tungare',
    'Sean Lip',
    'Stephanie Federwisch',
    'Wilson Hong',
    'Yana Malysheva',
]

# Idea contributors, in alphabetical order.
IDEA_CONTRIBUTORS = [
    'Alex Kauffmann',
    'Catherine Colman',
    'Neil Fraser',
    'Pavel Simakov',
    'Peter Norvig',
    'Phil Wagner',
    'Philip Guo',
    'Reinaldo Aguiar',
]

# Demo explorations to load on startup. The id assigned to each exploration
# is based on the index of the exploration in this list, so if you want to
# add a new exploration and preserve the existing ids, add that exploration
# to the end of the list.
# Each item is represented as a tuple: (filename, title, category). Note
# that the filename omits the .yaml suffix.
DEMO_EXPLORATIONS = [
    ('hola', '¡Hola!', 'Languages'),
    ('pitch', 'Pitch Perfect', 'Music'),
    ('counting', 'Three Balls', 'Mathematics'),
    ('boot_verbs', 'Boot Verbs', 'Languages'),
]

# Ensure that there is at least one demo exploration.
assert DEMO_EXPLORATIONS

# Whether to unconditionally log info messages.
DEBUG = False

# Whether we are running in production mode.
PRODUCTION_MODE = False

# Whether we should serve the development or production experience.
DEV = (os.environ.get('SERVER_SOFTWARE')
       and os.environ['SERVER_SOFTWARE'].startswith('Development')
       and not PRODUCTION_MODE)

# The directory containing the HTML/JS/CSS templates.
TEMPLATE_DIR = os.path.join(
    os.path.dirname(__file__),
    'templates/dev/head' if DEV else 'templates/prod/head'
)

# The directory containing third-party files.
THIRD_PARTY_DIR = 'third_party'

# The directories containing sample classifiers, explorations and widgets.
SAMPLE_CLASSIFIERS_DIR = 'data/classifiers'
SAMPLE_EXPLORATIONS_DIR = 'data/explorations'
SAMPLE_WIDGETS_DIR = 'data/widgets'

# The jinja environment used for loading frontend templates.
JINJA_ENV = jinja2.Environment(loader=jinja2.FileSystemLoader(TEMPLATE_DIR))
JINJA_ENV.filters.update({
    'is_list': lambda x: isinstance(x, list),
    'is_dict': lambda x: isinstance(x, dict),
})

# The jinja environment used for loading widget previews.
WIDGET_JINJA_ENV = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), SAMPLE_WIDGETS_DIR)))

# List of filepaths to JS libraries to include in the HTML <header>.
HEADER_JS_FILES = [
    'third_party/jquery/jquery.min.js',
    'third_party/jqueryui/jquery-ui.min.js',
    'third_party/bootstrap/js/bootstrap.js',
    'third_party/angularjs/angular.min.js',
]

# List of filepaths to JS libraries to include at the bottom of the HTML
# response, in order.
FOOTER_JS_FILES = [
    'third_party/angularjs/angular-resource.min.js',
    'third_party/angularjs/angular-sanitize.min.js',
    'third_party/angular-ui/build/angular-ui.js',
    'third_party/select2/select2.js',
    'third_party/d3js/d3.min.js',
    'third_party/yui/yui-min.js',
    TEMPLATE_DIR + '/js/app.js',
    TEMPLATE_DIR + '/js/directives/directives.js',
    TEMPLATE_DIR + '/js/filters/filters.js',
    TEMPLATE_DIR + '/js/services/activeInputData.js',
    TEMPLATE_DIR + '/js/services/warningsData.js',
    TEMPLATE_DIR + '/js/controllers/base.js',
]

# List of filepaths to CSS libraries to include in responses.
ALL_CSS_LIBS = [
    os.path.join(THIRD_PARTY_DIR, 'angular-ui/build/angular-ui.css'),
    os.path.join(THIRD_PARTY_DIR, 'bootstrap/css/bootstrap.css'),
    os.path.join(THIRD_PARTY_DIR, 'select2/select2.css'),
    os.path.join(TEMPLATE_DIR, 'css/oppia.css'),
    os.path.join(THIRD_PARTY_DIR, 'bootstrap/css/bootstrap-responsive.css'),
]

END_DEST = 'END'

# Default file name for newly-created files for download.
DEFAULT_FILE_NAME = 'New file'
