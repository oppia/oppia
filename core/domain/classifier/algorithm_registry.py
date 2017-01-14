# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Registry for classification algorithms/classifiers."""

import itertools
import feconf


class Registry(object):
    """Registry of all classification algorithms/classifiers."""

    # Dict mapping algorithm ids to instances of the classification algorithms.
    _classification_algorithms = {}

    @classmethod
    def custom_import(cls, path):
        """Utility function for importing a classifier class.

        Args:
            path: str. Full path of the class to be imported.

        Returns:
            A reference to the class.
        """
        components = path.split('.')
        mod = __import__(components[0])
        for comp in components[1:]:
            mod = getattr(mod, comp)
        return mod

    @classmethod
    def get_all_classifier_ids(cls):
        """Get a list of all algorithm ids.

        Returns:
            A list containing all the classifier IDs.
        """
        return list(itertools.chain(*[
            classifier_class['algorithm_ids']
            for classifier_class in feconf.ALLOWED_CLASSIFIER_CLASSES
        ]))

    @classmethod
    def _refresh(cls):
        """Refresh the dict mapping algorithm ids to instances."""

        cls._classification_algorithms.clear()

        all_classifier_ids = cls.get_all_classifier_ids()

        # Crawl the directories and add new classifier instances to the
        # registry.
        for classifier_id in all_classifier_ids:
            my_class = cls.custom_import(''.join([feconf.CLASSIFIERS_PKG, '.',
                                                  classifier_id, '.',
                                                  classifier_id]))
            cls._classification_algorithms[my_class.__name__] = my_class()

    @classmethod
    def get_all_classifiers(cls):
        """Get a list of instances of all classifiers."""
        if len(cls._classification_algorithms) == 0:
            cls._refresh()
        return cls._classification_algorithms.values()

    @classmethod
    def get_classifier_by_id(cls, classifier_id):
        """Gets a classifier instance by its id.

        Refreshes once if the classifier is not found; subsequently, throws a
        KeyError.

        Args:
            classifier_id: str. The ID of the classifier.

        Returns:
            An instance of the classifier.
        """

        if classifier_id not in cls._classification_algorithms:
            cls._refresh()
        return cls._classification_algorithms[classifier_id]
