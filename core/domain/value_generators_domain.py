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

"""Classes relating to value generators."""

import copy
import inspect
import os
import pkgutil

import feconf
import utils


class BaseValueGenerator(object):
    """Base value generator class.

    A value generator is a class containing a function that takes in
    customization args and uses them to generate a value. The generated values
    are not typed, so if the caller wants strongly-typed values it would need
    to normalize the output of each generator.

    Each value generator should define a template file and an AngularJS
    directive. The names of these two files should be [ClassName].html and
    [ClassName].js respectively, where [ClassName] is the name of the value
    generator class.
    """

    @property
    def id(self):
        """Returns the Class name as a string, i.e "BaseValueGenerator".

        Returns:
            str. Class name i.e "BaseValueGenerator".
        """
        return self.__class__.__name__

    @classmethod
    def get_html_template(cls):
        """Returns the HTML template for the class.

        Returns:
            str. The HTML template corresponding to the class.
        """
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.VALUE_GENERATORS_DIR, 'templates',
            '%s.html' % cls.__name__))

    @classmethod
    def get_js_template(cls):
        """Returns the JavaScript template for the class.

        Returns:
            str. The JS template corresponding to the class.
        """

        # NB: These generators should use only Angular templating. The
        # variables they have access to are generatorId, initArgs,
        # customizationArgs and objType.
        return utils.get_file_contents(os.path.join(
            os.getcwd(), feconf.VALUE_GENERATORS_DIR, 'templates',
            '%s.js' % cls.__name__))

    def generate_value(self, *args, **kwargs):
        """Generates a new value, using the given customization args.

        The first arg should be context_params.
        """
        raise NotImplementedError


class Registry(object):
    """Maintains a registry of all the value generators.

    Attributes:
        value_generators_dict: dict(str : BaseValueGenerator). Dictionary
            mapping value generator class names to their classes.
    """
    value_generators_dict = {}

    @classmethod
    def _refresh_registry(cls):
        """Refreshes the dictionary mapping between generator_id and the
        corresponding generator classes.
        """
        cls.value_generators_dict.clear()

        # Assemble all generators in
        # extensions/value_generators/models/generators.py.
        value_generator_paths = [os.path.join(
            os.getcwd(), feconf.VALUE_GENERATORS_DIR, 'models')]

        # Crawl the directories and add new generator instances to the
        # registries.
        for loader, name, _ in pkgutil.iter_modules(
                path=value_generator_paths):
            if name.endswith('_test'):
                continue
            module = loader.find_module(name).load_module(name)
            for _, clazz in inspect.getmembers(
                    module, predicate=inspect.isclass):
                if issubclass(clazz, BaseValueGenerator):
                    if clazz.__name__ in cls.value_generators_dict:
                        raise Exception(
                            'Duplicate value generator name %s'
                            % clazz.__name__)

                    cls.value_generators_dict[clazz.__name__] = clazz

    @classmethod
    def get_all_generator_classes(cls):
        """Get the dict of all value generator classes."""
        cls._refresh_registry()
        return copy.deepcopy(cls.value_generators_dict)

    @classmethod
    def get_generator_class_by_id(cls, generator_id):
        """Gets a generator class by its id.

        Refreshes once if the generator is not found; subsequently, throws an
        error.

        Args:
            generator_id: str. An id corresponding to a generator class.

        Returns:
            class(BaseValueGenerator). A generator class mapping to the
                generator id given.

        Raises:
            KeyError: The given generator_id is invalid.
        """
        if generator_id not in cls.value_generators_dict:
            cls._refresh_registry()
        return cls.value_generators_dict[generator_id]
