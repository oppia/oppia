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

"""Widget registry class."""

__author__ = 'Sean Lip'

import pkgutil

import feconf
import utils


class Registry(object):
    """Registry of all widgets."""

    # The keys of these dicts are the widget ids and the values are instances
    # of the corresponding widgets.
    interactive_widgets = {}
    noninteractive_widgets = {}

    # Maps a widget_type to a (registry_dict, source_dir) pair.
    WIDGET_TYPE_MAPPING = {
        feconf.INTERACTIVE_PREFIX: (
            interactive_widgets, feconf.INTERACTIVE_WIDGETS_DIR
        ),
        feconf.NONINTERACTIVE_PREFIX: (
            noninteractive_widgets, feconf.NONINTERACTIVE_WIDGETS_DIR
        ),
    }

    @classmethod
    def _refresh_widgets_of_type(cls, widget_type):
        registry_dict = cls.WIDGET_TYPE_MAPPING[widget_type][0]
        registry_dict.clear()

        # Assemble all extensions/widgets/[WIDGET_TYPE]/[WIDGET_ID] paths.
        ALL_WIDGET_PATHS = [
            defn['dir'] for (widget, defn) in
            feconf.ALLOWED_WIDGETS[widget_type].iteritems()
        ]

        # Crawl the directories and add new widget instances to the registries.
        for loader, name, _ in pkgutil.iter_modules(path=ALL_WIDGET_PATHS):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)
            if clazz.__name__ in registry_dict:
                raise Exception(
                    'Duplicate widget name %s' % clazz.__name__)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseWidget' in ancestor_names:
                registry_dict[clazz.__name__] = clazz()

    @classmethod
    def refresh(cls):
        """Repopulate the dict of widget bindings."""
        cls._refresh_widgets_of_type(feconf.INTERACTIVE_PREFIX)
        cls._refresh_widgets_of_type(feconf.NONINTERACTIVE_PREFIX)

    @classmethod
    def get_widget_ids_of_type(cls, widget_type):
        """Get a list of all widget ids for the given widget type."""
        if widget_type not in cls.WIDGET_TYPE_MAPPING:
            raise Exception('Invalid widget type: %s' % widget_type)

        if len(cls.WIDGET_TYPE_MAPPING[widget_type][0]) == 0:
            Registry.refresh()
        return cls.WIDGET_TYPE_MAPPING[widget_type][0].keys()

    @classmethod
    def get_widgets_of_type(cls, widget_type):
        """Get a list of all widget classes for the given widget type."""
        if widget_type not in cls.WIDGET_TYPE_MAPPING:
            raise Exception('Invalid widget type: %s' % widget_type)

        if len(cls.WIDGET_TYPE_MAPPING[widget_type][0]) == 0:
            Registry.refresh()
        return cls.WIDGET_TYPE_MAPPING[widget_type][0].values()

    @classmethod
    def get_widget_by_id(cls, widget_type, widget_id):
        """Gets a widget instance by its type and id.

        Refreshes once if the widget is not found; subsequently, throws a
        KeyError."""
        if widget_id not in cls.WIDGET_TYPE_MAPPING[widget_type][0]:
            cls.refresh()
        return cls.WIDGET_TYPE_MAPPING[widget_type][0][widget_id]

    @classmethod
    def get_tag_list_with_attrs(cls, widget_type):
        """Returns a dict of HTML tag names and attributes for widgets.

        The keys are tag names starting with 'oppia-noninteractive-'
        or 'oppia-interactive-', followed by the hyphenated version of the
        widget name. The values are lists of allowed attributes of the
        form [PARAM_NAME]-with-[CUSTOMIZATION_ARG_NAME].
        """
        # TODO(sll): Cache this computation and update it on each refresh.
        widget_list = cls.get_widgets_of_type(widget_type)

        widget_tags = {}
        for widget in widget_list:
            tag_name = 'oppia-%s-%s' % (
                widget_type, utils.camelcase_to_hyphenated(widget.name))

            attr_list = []
            for param in widget.params:
                prefix = '%s-with-' % param.name
                for arg in param.customization_args:
                    attr_list.append('%s%s' % (prefix, arg))

            widget_tags[tag_name] = attr_list

        return widget_tags

    @classmethod
    def get_interactive_widget_js(cls, widget_ids):
        """Returns the JS for the given list of widget ids."""
        widget_js_codes = []
        for widget_id in widget_ids:
            widget = cls.get_widget_by_id(feconf.INTERACTIVE_PREFIX, widget_id)
            widget_js_codes.append(widget.js_code)

        return ' \n'.join(widget_js_codes)

    @classmethod
    def get_noninteractive_widget_js(cls):
        """Returns the JS for all noninteractive widgets."""
        return ' \n'.join([
            widget.js_code for widget in cls.get_widgets_of_type(
                feconf.NONINTERACTIVE_PREFIX)
        ])
