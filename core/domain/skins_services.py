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

import copy
import inspect

from extensions.skins import skin_classes


class Registry(object):
    """Registry of all skins."""

    # Dict mapping skin ids to their classes.
    _skins_dict = {}

    @classmethod
    def _refresh_registry(cls):
        cls._skins_dict.clear()

        # Add new skin classes to the registry.
        for name, clazz in inspect.getmembers(skin_classes, inspect.isclass):
            if name.endswith('_test') or name == 'BaseSkin':
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'BaseSkin' not in ancestor_names:
                continue

            cls._skins_dict[clazz.skin_id] = clazz

    @classmethod
    def get_all_skin_ids(cls):
        """Get a list of all skin classes."""
        if not cls._skins_dict:
            cls._refresh_registry()
        return cls._skins_dict.keys()

    @classmethod
    def get_all_skin_classes(cls):
        """Get a list of all skin classes."""
        if not cls._skins_dict:
            cls._refresh_registry()
        return copy.deepcopy(cls._skins_dict)

    @classmethod
    def get_skin_html(cls, skin_id):
        """Returns the HTML for a given skin.

        Refreshes once if the skin id is not found; subsequently, throws an
        error.
        """
        if skin_id not in cls._skins_dict:
            cls._refresh_registry()
        return cls._skins_dict[skin_id].get_html()
