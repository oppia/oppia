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

"""Provides services for HTML skins for the reader view."""

__author__ = 'Sean Lip'

import feconf
import jinja_utils
import utils

import jinja2


def get_skin_html(skin_name):
    """Returns the HTML for a given skin."""
    return jinja2.Markup(
        jinja_utils.get_jinja_env(feconf.SKINS_TEMPLATES_DIR).get_template(
            '%s.html' % skin_name).render())


def get_skin_js(skin_name):
    """Returns the JS content for a given skin."""
    return jinja2.Markup(utils.get_file_contents(
        '%s/%s' % (feconf.SKINS_TEMPLATES_DIR, '%s.js' % skin_name)))
