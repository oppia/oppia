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

"""Configuration for JavaScript library dependencies."""


# A dict mapping dependency ids to the Angular module names they
# should insert when the Angular app is first initialized.
DEPENDENCIES_TO_ANGULAR_MODULES_DICT = {
    'codemirror': ['ui.codemirror'],
    'ui_leaflet': ['ui-leaflet'],
    'guppy': [],
    'logic_proof': [],
    'math_expressions': [],
    'midijs': [],
    'pencilcode': [],
    'skulpt': [],
}
