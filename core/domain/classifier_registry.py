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

import os
import pkgutil

import feconf


class ClassifierRegistry(object):
    """Registry of all classification classes."""

    # Dict mapping algorithm IDs to instances of the classification classes.
    _classifier_instances = {}

    @classmethod
    def get_all_classifier_ids(cls):
        """Retrieves a list of all classifier IDs.

        Returns:
            A list containing all the classifier IDs.
        """
        return [classifier_id
                for classifier_id in feconf.ANSWER_CLASSIFIER_CLASS_IDS]

    @classmethod
    def _refresh(cls):
        """Refreshes the dict mapping algorithm IDs to instances of
        classifiers.
        """
        cls._classifier_instances.clear()

        all_classifier_ids = cls.get_all_classifier_ids()

        # Assemble all paths to the classifiers.
        extension_paths = [
            os.path.join(feconf.CLASSIFIERS_DIR, classifier_id)
            for classifier_id in all_classifier_ids]

        # Crawl the directories and add new classifier instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=extension_paths):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseClassifier' in ancestor_names:
                cls._classifier_instances[clazz.__name__] = clazz()

    @classmethod
    def get_all_classifiers(cls):
        """Retrieves a list of instances of all classifiers.

        Returns:
            A list of instances of all the classification algorithms.
        """
        if not cls._classifier_instances:
            cls._refresh()
        return cls._classifier_instances.values()

    @classmethod
    def get_classifier_by_id(cls, classifier_id):
        """Retrieves a classifier instance by its id.

        Refreshes once if the classifier is not found; subsequently, throws a
        KeyError.

        Args:
            classifier_id: str. The ID of the classifier.

        Raises:
            KeyError: If the classifier is not found the first time.

        Returns:
            An instance of the classifier.
        """
        if classifier_id not in cls._classifier_instances:
            cls._refresh()
        return cls._classifier_instances[classifier_id]
