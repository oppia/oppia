# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Module for implementing question tags."""

__author__ = 'sll@google.com (Sean Lip)'

import os

import jinja2

from common import jinja_utils
from common import schema_fields
from common import tags
from controllers import lessons
from models import custom_modules
from models import progress

RESOURCES_PATH = '/modules/oppia_tag/resources'
OPPIA_TAG_BINDING_NAME = 'oppia-tag'
EXPLORATION_COMPLETED_EVENT_NAME = 'tag-oppia-exploration-completed'


class OppiaTag(tags.BaseTag):
    """Custom tag for an Oppia embedder."""

    binding_name = OPPIA_TAG_BINDING_NAME

    def get_icon_url(self):
        return os.path.join(RESOURCES_PATH, 'oppia.png')

    @classmethod
    def name(cls):
        return 'Oppia exploration'

    @classmethod
    def vendor(cls):
        return 'oppia'

    def render(self, node, handler):
        instanceid = node.attrib.get('instanceid')
        template_values = {
            'RESOURCES_PATH': RESOURCES_PATH,
            'exploration_id': node.attrib.get('exploration_id'),
            'instanceid': instanceid,
            'src': node.attrib.get('src'),
        }

        cpt_progress = None
        if (hasattr(handler, 'student') and not handler.student.is_transient
            and not handler.lesson_is_scored):
            cpt_progress = handler.get_course().get_progress_tracker(
                ).get_component_progress(
                    handler.student, handler.unit_id, handler.lesson_id,
                    instanceid)

        template_values['progress'] = cpt_progress

        locale = handler.app_context.get_environ()['course']['locale']
        template = jinja_utils.get_template(
            'templates/oppia_template.html',
            [os.path.dirname(__file__)],
            locale=locale)

        html_string = jinja2.utils.Markup(template.render(template_values))
        return tags.html_string_to_element_tree(html_string)

    def get_schema(self, unused_handler):
        reg = schema_fields.FieldRegistry(OppiaTag.name())
        reg.add_property(
            schema_fields.SchemaField(
                'src', 'URL of the Oppia server', 'string', optional=False,
                description=(
                    'Provide the full URL of the Oppia server\'s domain, '
                    'e.g. \'https://www.oppia.org\'')))
        reg.add_property(
            schema_fields.SchemaField(
                'exploration_id', 'Exploration ID', 'string', optional=False,
                description=('The Oppia exploration id.')))
        return reg


custom_module = None


def register_module():
    """Registers this module in the registry."""

    def when_module_enabled():
        # Register custom tags.
        tags.Registry.add_tag_binding(
            OppiaTag.binding_name, OppiaTag)
        tags.EditorBlacklists.register(
            OppiaTag.binding_name, tags.EditorBlacklists.COURSE_SCOPE)

        # Allow Oppia tag events to be recorded and to count towards progress.
        if (EXPLORATION_COMPLETED_EVENT_NAME not in
            lessons.TAGS_THAT_TRIGGER_COMPONENT_COMPLETION):
            lessons.TAGS_THAT_TRIGGER_COMPONENT_COMPLETION.append(
                EXPLORATION_COMPLETED_EVENT_NAME)

        if OPPIA_TAG_BINDING_NAME not in progress.TRACKABLE_COMPONENTS:
            progress.TRACKABLE_COMPONENTS.append(OPPIA_TAG_BINDING_NAME)

    def when_module_disabled():
        # Unregister custom tags.
        tags.Registry.remove_tag_binding(OppiaTag.binding_name)
        tags.EditorBlacklists.unregister(
            OppiaTag.binding_name, tags.EditorBlacklists.COURSE_SCOPE)

        # Stop recording any Oppia tag events.
        if (EXPLORATION_COMPLETED_EVENT_NAME in
            lessons.TAGS_THAT_TRIGGER_COMPONENT_COMPLETION):
            lessons.TAGS_THAT_TRIGGER_COMPONENT_COMPLETION.remove(
                EXPLORATION_COMPLETED_EVENT_NAME)

        if OPPIA_TAG_BINDING_NAME in progress.TRACKABLE_COMPONENTS:
            progress.TRACKABLE_COMPONENTS.remove(OPPIA_TAG_BINDING_NAME)

    # Add a static handler for icons shown in the rich text editor.
    global_routes = [(
        os.path.join(RESOURCES_PATH, '.*'), tags.ResourcesHandler)]

    global custom_module
    custom_module = custom_modules.Module(
        'Oppia tag',
        'A tag for rendering Oppia explorations within a lesson body.',
        global_routes,
        [],
        notify_module_enabled=when_module_enabled,
        notify_module_disabled=when_module_disabled)
    return custom_module
