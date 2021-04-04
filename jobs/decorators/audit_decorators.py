# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Decorators for assigning DoFn classes to specific storage models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import inspect

from core.platform import models
from jobs import jobs_utils
from jobs.types import audit_errors
import python_utils

import apache_beam as beam
from apache_beam import typehints

_ALL_MODEL_CLASSES = frozenset(models.Registry.get_all_storage_model_classes())
_ALL_BASE_MODEL_CLASSES = frozenset(
    models.Registry.get_storage_model_classes([models.NAMES.base_model]))

_MODEL_CLASSES_BY_BASE_CLASS = {
    base_class: frozenset({base_class}).union(
        cls for cls in _ALL_MODEL_CLASSES if issubclass(cls, base_class))
    for base_class in _ALL_BASE_MODEL_CLASSES
}


class AuditsExisting(python_utils.OBJECT):
    """Decorator for registering DoFns that audit storage models.

    DoFns registered by this decorator should assume that the models they
    receive as input do not have `deleted=True`.

    When decorating a DoFn that inherits from another, it overwrites the base
    class. For example, ValidateExplorationModelId overwrites ValidateModelId if
    and only if ValidateExplorationModelId inherits from ValidateModelId.
    """

    _AUDITS_BY_KIND = collections.defaultdict(set)

    def __init__(self, *model_classes):
        """Initializes the decorator to target the given models.

        Args:
            *model_classes: tuple(class). The models the decorator will target.
                If an argument is a base class, all of its subclasses will be
                targeted as well.

        Raises:
            TypeError. When a non-model type is provided.
        """
        if not model_classes:
            raise ValueError('Must target at least one model')
        self._model_classes = set()
        for cls in model_classes:
            if cls in _MODEL_CLASSES_BY_BASE_CLASS:
                self._model_classes.update(_MODEL_CLASSES_BY_BASE_CLASS[cls])
            elif cls in _ALL_MODEL_CLASSES:
                self._model_classes.add(cls)
            else:
                raise TypeError(
                    '%r is not a model registered in core.platform' % cls)

    def __call__(self, new_audit):
        """Decorator which registers the given DoFn to the targeted models.

        This decorator also installs type constraints on the DoFn to guard it
        from invalid argument types.

        Args:
            new_audit: DoFn. The DoFn to decorate.

        Returns:
            DoFn. The decorated DoFn.

        Raises:
            TypeError. When the input argument is not a DoFn.
        """
        if not issubclass(new_audit, beam.DoFn):
            raise TypeError('%r is not a subclass of DoFn' % new_audit)

        # The "mro" (method resolution order) of a class is the list of types
        # the class is derived from, including itself, in the order they are
        # searched for methods and attributes.
        # To learn more, see: https://stackoverflow.com/a/2010732/4859885.
        base_classes_of_new_audit = set(inspect.getmro(new_audit))

        for cls in self._model_classes:
            kind = jobs_utils.get_model_kind(cls)
            registered_audits = self._AUDITS_BY_KIND[kind]
            if any(issubclass(a, new_audit) for a in registered_audits):
                # Always keep the most-derived audit type.
                continue
            registered_audits -= base_classes_of_new_audit
            registered_audits.add(new_audit)

        # Decorate the DoFn with type constraints that raise an error when args
        # or return values have the wrong type.
        with_input_types, with_output_types = (
            typehints.with_input_types(typehints.Union[self._model_classes]),
            typehints.with_output_types(audit_errors.BaseAuditError))
        return with_input_types(with_output_types(new_audit))

    @classmethod
    def get_audits_by_kind(cls):
        """Returns the sets of DoFns registered to each kind of model.

        Returns:
            dict(str: DoFn). The registered DoFns by their targeted model kind.
        """
        return dict(cls._AUDITS_BY_KIND)
