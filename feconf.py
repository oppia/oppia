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

"""Stores various configuration options for Oppia."""

import os
import jinja2

# Whether to unconditionally log info messages.
DEBUG = False

# Whether we are running in production mode.
PRODUCTION_MODE = False

# Whether we should serve the development or production experience.
DEV = (os.environ.get('SERVER_SOFTWARE')
       and os.environ['SERVER_SOFTWARE'].startswith('Development')
       and not PRODUCTION_MODE)

# The directory containing the HTML/JS/CSS templates.
TEMPLATE_DIR = 'templates/dev/head' if DEV else 'templates/prod/head'

# The directory containing third-party files.
THIRD_PARTY_DIR = 'third_party'

# The directories containing sample classifiers, explorations and widgets.
SAMPLE_CLASSIFIERS_DIR = 'data/classifiers'
SAMPLE_EXPLORATIONS_DIR = 'data/explorations'
SAMPLE_WIDGETS_DIR = 'data/widgets'

# The jinja environment used for loading frontend templates.
JINJA_ENV = jinja2.Environment(loader=jinja2.FileSystemLoader(
    os.path.join(os.path.dirname(__file__), TEMPLATE_DIR)))

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
    os.path.join(TEMPLATE_DIR, 'css/oppia.css'),
    os.path.join(THIRD_PARTY_DIR, 'bootstrap/css/bootstrap-responsive.css'),
]
