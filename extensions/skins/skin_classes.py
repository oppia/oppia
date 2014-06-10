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

"""Classes corresponding to skins for the learner view."""

__author__ = 'Sean Lip'

import os

import feconf
import jinja_utils

import jinja2


DEFAULT_ENTRY_POINT_PATH = 'player.html'


class BaseSkin(object):
    """Base skin class.

    This is the superclass for all skin classes.
    """
    # These values should be overridden in subclasses.
    skin_id = None
    description = ''
    # This path is relative to /extensions/skins/{{SKIN_ID}}. It defaults to
    # player.html.
    entry_point_path = DEFAULT_ENTRY_POINT_PATH
    options = {}

    @classmethod
    def get_html(cls):
        if cls.entry_point_path is None:
            raise Exception(
                'No entry-point specified for skin %s.' % cls().skin_id)
        return jinja2.Markup(jinja_utils.get_jinja_env(
            feconf.SKINS_TEMPLATES_DIR).get_template(os.path.join(
                cls().skin_id, cls.entry_point_path)).render())


class ConversationV1(BaseSkin):
    skin_id = 'conversation_v1'
    description = 'A vertically-scrolling conversation.'

    options = [{
        'name': 'show_feedback_button',
        'description': 'Whether to show the feedback button.',
        'default_value': True,
        'obj_type': 'Boolean'
    }]


class SnapshotsV1(BaseSkin):
    skin_id = 'snapshots_v1'
    description = 'A sequence of snapshots.'

    options = [{
        'name': 'show_back_button',
        'description': 'Whether to show the back button.',
        'default_value': True,
        'obj_type': 'Boolean'
    }]
