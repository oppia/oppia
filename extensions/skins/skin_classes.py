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
    skin_name = None
    description = ''
    # This path is relative to /extensions/skins/{{SKIN_ID}}. It defaults to
    # player.html.
    entry_point_path = DEFAULT_ENTRY_POINT_PATH
    js_path = None
    # This tag name should match the name of the directive pointed to by
    # js_path.
    tag_name = None
    options = {}

    @classmethod
    def get_html(cls):
        if cls.entry_point_path is None:
            raise Exception(
                'No entry-point specified for skin %s.' % cls.skin_id)
        return jinja2.Markup(jinja_utils.get_jinja_env(
            feconf.SKINS_TEMPLATES_DIR).get_template('%s/%s' % (
                cls.skin_id, cls.entry_point_path)).render())

    @classmethod
    def get_js_url(cls):
        """Returns the relative path of the skin JS template from
        feconf.SKINS_TEMPLATES_DIR.
        """
        if cls.js_path is None:
            raise Exception(
                'No JS path specified for skin %s.' % cls.skin_id)
        return '%s/%s' % (cls.skin_id, cls.js_path)

    @classmethod
    def get_tag(cls):
        """Returns a tag used to load the skin template."""
        if cls.tag_name is None:
            raise Exception(
                'No tag name specified for skin %s.' % cls.skin_id)
        return '<%s></%s>' % (cls.tag_name, cls.tag_name)


class ConversationV1(BaseSkin):
    skin_id = 'conversation_v1'
    skin_name = 'Conversation'
    description = 'A vertically-scrolling conversation.'
    js_path = 'Conversation.js'
    tag_name = 'conversation-skin'

    options = [{
        'name': 'show_feedback_button',
        'description': 'Whether to show the feedback button.',
        'default_value': True,
        'obj_type': 'Boolean'
    }]


class SnapshotsV1(BaseSkin):
    skin_id = 'snapshots_v1'
    skin_name = 'Snapshots'
    description = 'A sequence of snapshots.'
    js_path = 'Snapshots.js'
    tag_name = 'snapshots-skin'

    options = [{
        'name': 'show_back_button',
        'description': 'Whether to show the back button.',
        'default_value': True,
        'obj_type': 'Boolean'
    }]
