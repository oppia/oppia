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

"""Decorators for assigning DoFn types to specific storage models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import inspect

from core.platform import models
from jobs import job_utils
from jobs.types import audit_errors
import python_utils

import apache_beam as beam
from apache_beam import typehints

_ALL_MODEL_TYPES = frozenset(models.Registry.get_all_storage_model_classes())
_ALL_BASE_MODEL_TYPES = frozenset(
    models.Registry.get_storage_model_classes([models.NAMES.base_model]))

_MODEL_TYPES_BY_BASE_CLASS = {
    base_class: frozenset({base_class}).union(
        t for t in _ALL_MODEL_TYPES if issubclass(t, base_class))
    for base_class in _ALL_BASE_MODEL_TYPES
}


class AuditsExisting(python_utils.OBJECT):
    """Decorator for registering DoFns that audit storage models.

    DoFns registered by this decorator should assume that the models they
    receive as input do not have `deleted=True`.

    When decorating a DoFn that inherits from another, it overwrites the base
    class. For example, ValidateExplorationModelId overwrites ValidateModelId if
    and only if ValidateExplorationModelId inherits from ValidateModelId.
    """

    _DO_FN_TYPES_BY_KIND = collections.defaultdict(set)

    def __init__(self, *model_types):
        """Initializes the decorator to target the given types of models.

        Args:
            *model_types: tuple(class). The models the decorator will target. If
                an argument is a base class, all of its subclasses will be
                targeted as well.

        Raises:
            TypeError. When a non-model type is provided.
        """
        if not model_types:
            raise ValueError('Must target at least one model')
        self._targeted_model_types = set()
        for t in model_types:
            if t in _MODEL_TYPES_BY_BASE_CLASS:
                self._targeted_model_types.update(_MODEL_TYPES_BY_BASE_CLASS[t])
            elif t in _ALL_MODEL_TYPES:
                self._targeted_model_types.add(t)
            else:
                raise TypeError(
                    '%r is not a model registered in core.platform' % t)
        self._targeted_kinds = {
            job_utils.get_model_kind(t) for t in self._targeted_model_types
        }

    def __call__(self, do_fn_type):
        """Decorator which registers the given DoFn to the targeted models.

        This decorator also installs type constraints on the DoFn to guard it
        from invalid argument types.

        Args:
            do_fn_type: type(DoFn). The new audting DoFn class to decorate.

        Returns:
            type(DoFn). The decorated DoFn.

        Raises:
            TypeError. When the new type is not a DoFn.
        """
        if not issubclass(do_fn_type, beam.DoFn):
            raise TypeError('%r is not a subclass of DoFn' % do_fn_type)

        # The "mro" (method resolution order) of a class is the list of types
        # the class is derived from, including itself, in the order they are
        # searched for methods and attributes.
        # To learn more, see: https://stackoverflow.com/a/2010732/4859885.
        base_types_of_do_fn_type = set(inspect.getmro(do_fn_type))

        for kind in self._targeted_kinds:
            registered_do_fn_types = self._DO_FN_TYPES_BY_KIND[kind]
            if any(issubclass(r, do_fn_type) for r in registered_do_fn_types):
                continue # Always keep the most-derived DoFn type.
            registered_do_fn_types -= base_types_of_do_fn_type
            registered_do_fn_types.add(do_fn_type)

        # Decorate the DoFn with type constraints that raise an error when args
        # or return values have the wrong type.
        with_input_types, with_output_types = (
            typehints.with_input_types(
                typehints.Union[self._targeted_model_types]),
            typehints.with_output_types(audit_errors.BaseAuditError))
        return with_input_types(with_output_types(do_fn_type))

    @classmethod
    def get_audit_do_fn_types_by_kind(cls):
        """Returns the sets of audit DoFns targeting a kind of model.

        Returns:
            dict(str: frozenset(type(DoFn))). DoFn types, keyed by the kind of
            model they have targeted.
        """
        return {
            kind: frozenset(do_fn_types)
            for kind, do_fn_types in cls._DO_FN_TYPES_BY_KIND.items()
        }
