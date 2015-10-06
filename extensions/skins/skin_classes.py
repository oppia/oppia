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
import utils
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
    # Properties of the gadget panels present in the skin.
    panels_properties = {}
    # Configurable options in the UI.
    options = {}

    # Skins can support gadget panels that extend along horizontal or vertical
    # axis.
    _GADGET_PANEL_AXIS_HORIZONTAL = 'horizontal'
    _GADGET_PANEL_AXIS_VERTICAL = 'vertical'

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

    @classmethod
    def validate_panel(cls, panel, gadget_list):
        """Validates that a panel is able to contain a given set of gadgets.

        Args:
        - panel: string. Unique identifier for the gadget panel.
        - gadget_list: list of GadgetInstance instances."""

        panel_properties_dict = cls.panels_properties[panel]
        panel_instance = GadgetPanelSpec(
            panel, panel_properties_dict['width'],
            panel_properties_dict['height'],
            panel_properties_dict['stackable_axis'],
            panel_properties_dict['pixels_between_gadgets'],
            panel_properties_dict['max_gadgets'])

        panel_instance.validate(gadget_list)


class GadgetPanelSpec(object):
    """Specification for the structure of a gadget panel."""

    # Possible values for a panel's stackable_axis.
    AXIS_HORIZONTAL = 'horizontal'
    AXIS_VERTICAL = 'vertical'

    def __init__(
            self, name, width, height, stackable_axis,
            pixels_between_gadgets, max_gadgets):
        """
        Args:
        - name: str. Unique name that identifies this panel in the skin.
        - width: int. Width of panel, in pixels.
        - height: int. Height of panel, in pixels.
        - stackable_axis: str. Specifies axis multiple gadgets extend along.
            Valid options: [AXIS_HORIZONTAL, AXIS_VERTICAL]
        - pixels_between_gadgets: int. Number of pixels spacing between gadgets
        - max_gadgets: int. Maximum number of gadgets this panel supports.
        """
        self._name = name
        self._width = width
        self._height = height
        self._stackable_axis = stackable_axis
        self._pixels_between_gadgets = pixels_between_gadgets
        self._max_gadgets = max_gadgets

    @staticmethod
    def _get_names_of_states_with_visible_gadgets(gadget_list):
        """Returns a list of state names where gadgets are visible.

        Args:
        - gadget_list: list of GadgetInstance instances.
        """
        state_names = set()
        for gadget_instance in gadget_list:
            for state_name in gadget_instance.visible_in_states:
                state_names.add(state_name)
        return sorted(state_names)

    def _get_gadgets_visibility_map(self, gadget_list):
        """Returns a dict whose keys are state names, and whose corresponding
        values are lists of GadgetInstance instances representing the gadgets
        visible in that state.

        Note that the keys of this dict only include states for which at least
        one gadget is visible.

        Args:
        - gadget_list: list of GadgetInstance instances.
        """
        visibility_map = {
            state_name: []
            for state_name in self._get_names_of_states_with_visible_gadgets(
                gadget_list)
        }

        for gadget_instance in gadget_list:
            for state_name in set(gadget_instance.visible_in_states):
                visibility_map[state_name].append(gadget_instance)

        return visibility_map

    def validate(self, gadget_list):
        """Validate proper fit given space requirements specified by skin.

        Args:
        - gadget_list: list of GadgetInstance instances.
        """

        # If the panel contains no gadgets, max() will raise an error,
        # so we return early.
        if not gadget_list:
            return

        # Validate limitations and fit considering visibility for each state.
        gadget_visibility_map = self._get_gadgets_visibility_map(gadget_list)

        for state_name, gadget_instances in gadget_visibility_map.iteritems():
            if len(gadget_instances) > self._max_gadgets:
                raise utils.ValidationError(

                    "'%s' panel expected at most %d gadget%s, but %d gadgets"
                    " are visible in state '%s'." % (
                        self._name,
                        self._max_gadgets,
                        's' if self._max_gadgets != 1 else '',
                        len(gadget_instances),
                        state_name))

            # Calculate total width and height of gadgets given custom args and
            # panel stackable axis.
            total_width = 0
            total_height = 0

            if self._stackable_axis == self.AXIS_VERTICAL:
                # Factor in pixels between gadgets, if any.
                total_height += self._pixels_between_gadgets * (
                    len(gadget_instances) - 1)
                total_height += sum(
                    gadget.height for gadget in gadget_instances)
                total_width = max(
                    gadget.width for gadget in gadget_instances)
            elif self._stackable_axis == self.AXIS_HORIZONTAL:
                total_width += self._pixels_between_gadgets * (
                    len(gadget_instances) - 1)
                total_width += sum(
                    gadget.width for gadget in gadget_instances)
                total_height = max(
                    gadget.height for gadget in gadget_instances)
            else:
                raise utils.ValidationError(
                    "Unrecognized axis for '%s' panel. Valid options are: %s" % (
                        self._name,
                        str(self._valid_axes)))

            # Validate fit for each dimension.
            if self._height < total_height:
                raise utils.ValidationError(
                    "Size exceeded: %s panel height of %d exceeds limit of %d" % (
                        self._name,
                        total_height,
                        self._height))
            elif self._width < total_width:
                raise utils.ValidationError(
                    "Size exceeded: %s panel width of %d exceeds limit of %d" % (
                        self._name,
                        total_width,
                        self._width))

    @property
    def _valid_axes(self):
        """Valid values for stackable & fixed axis."""
        return [self.AXIS_HORIZONTAL, self.AXIS_VERTICAL]


class ConversationV1(BaseSkin):
    skin_id = 'conversation_v1'
    skin_name = 'Conversation'
    description = 'A vertically-scrolling conversation.'
    js_path = 'Conversation.js'
    tag_name = 'conversation-skin'

    panels_properties = {
        'bottom': {
            'width': 350,
            'height': 100,
            'stackable_axis': BaseSkin._GADGET_PANEL_AXIS_HORIZONTAL,
            'pixels_between_gadgets': 80,
            'max_gadgets': 1
        }
    }

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

    panels_properties = {
        'main': {
            'width': 800,
            'height': 1000,
            'stackable_axis': 'vertical',
            'pixels_between_gadgets': 80,
            'max_gadgets': 1
        },
    }

    options = [{
        'name': 'show_back_button',
        'description': 'Whether to show the back button.',
        'default_value': True,
        'obj_type': 'Boolean'
    }]
