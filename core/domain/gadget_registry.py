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

"""Registry for gadgets."""

__author__ = 'Michael Anuzis'

import pkgutil

import feconf


class Registry(object):
    """Registry of all gadgets."""

    # Dict mapping gadget ids to instances of the gadgets.
    _gadgets = {}

    @classmethod
    def _refresh(cls):
        cls._gadgets.clear()

        # Assemble all paths to the gadgets.
        EXTENSION_PATHS = [
            gadget['dir'] for gadget in
            feconf.ALLOWED_GADGETS.values()]

        # Crawl the directories and add new gadget instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=EXTENSION_PATHS):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseGadget' in ancestor_names:
                cls._gadgets[clazz.__name__] = clazz()

    @classmethod
    def get_all_gadget_ids(cls):
        """Get a list of all gadget ids."""
        if len(cls._gadgets) == 0:
            cls._refresh()
        return cls._gadgets.keys()

    @classmethod
    def get_all_gadgets(cls):
        """Get a list of instances of all gadgets."""
        if len(cls._gadgets) == 0:
            cls._refresh()
        return cls._gadgets.values()

    @classmethod
    def get_gadget_by_id(cls, gadget_id):
        """Gets a gadget by its id.

        Refreshes once if the gadget is not found; subsequently, throws a
        KeyError."""
        if gadget_id not in cls._gadgets:
            cls._refresh()
        return cls._gadgets[gadget_id]

    @classmethod
    def get_gadget_html(cls, gadget_ids):
        """Returns the HTML bodies for the given list of gadget ids."""
        return ' \n'.join([
            cls.get_gadget_by_id(gadget_id).html_body
            for gadget_id in gadget_ids])

    @classmethod
    def get_deduplicated_dependency_ids(cls, gadget_ids):
        """Return a list of dependency ids for the given gadgets.

        Each entry of the resulting list is unique. The list is sorted in no
        particular order.
        """
        result = set([])
        for gadget_id in gadget_ids:
            gadget = cls.get_gadget_by_id(gadget_id)
            result.update(gadget.dependency_ids)
        return list(result)

    @classmethod
    def get_all_specs(cls):
        """Returns a dict containing the full specs of each gadget."""
        return {
            gadget.id: gadget.to_dict()
            for gadget in cls.get_all_gadgets()
        }
