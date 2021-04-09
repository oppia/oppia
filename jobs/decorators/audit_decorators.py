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
import itertools
import re

from core.platform import models
from jobs import job_utils
from jobs.types import audit_errors
from jobs.types import model_property
import python_utils

import apache_beam as beam
from apache_beam import typehints

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()

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


class RelationshipsOf(python_utils.OBJECT):
    """Decorator for describing {DependentModel.property: Model} relationships.

    This decorator adds a domain-specific language (DSL) for defining the
    relationships between model properties and the IDs of related models.

    The name of the function is enforced so that code reads intuitively:
        "Relationships Of [MODEL_CLASS]
        "define model_relationships(model):
            yield model.property, [RELATED_MODELS...]

    This naming convention is enforced by the decorator.

    A concrete example:
        @RelationshipsOf(UserAuthDetailsModel)
        def user_auth_details_model_relationships(model):
            yield model.id, [UserSettingsModel]
            yield model.firebase_auth_id, [UserIdByFirebaseAuthId]
            yield model.gae_id, [UserIdentifiersModel]
    """

    _ID_PROPERTY_TARGETS = collections.defaultdict(set)

    def __init__(self, model_class):
        """Initializes a new RelationshipsOf decorator.

        Args:
            model_class: class. A subclass of BaseModel.
        """
        self._model_kind = self._get_model_kind(model_class)
        self._model_class = model_class

    def __call__(self, model_relationships):
        """Registers the property relationships of self._model_kind yielded by
        the generator.

        See RelationshipsOf's docstring for a usage example.

        Args:
            model_relationships: callable. Expected to yield tuples with types
                (Property, list(class)), where the properties are from the
                self._model_class passed in to the function as an argument.

        Returns:
            generator. The same object.
        """
        self._validate_name_of_model_relationships(model_relationships)
        for property_obj, corresponding_models in (
                model_relationships(self._model_class)):
            id_property = (
                model_property.ModelProperty(self._model_class, property_obj))
            self._ID_PROPERTY_TARGETS[id_property].update(
                self._get_model_kind(m)
                for m in corresponding_models if m is not self._model_class)
        return model_relationships

    @classmethod
    def get_property_relationships_by_kind(cls):
        """Returns dict encoding how a model's properties correspond to
        the IDs of other models.

        Returns:
            dict(str: dict(str: tuple(str))). Property relationships keyed by
            the kind of model the properties belong to. For each property, the
            corresponding set refers to the kinds of models which should exist
            in storage with the same ID.
        """
        id_properties_by_model_kind = itertools.groupby(
            sorted(cls._ID_PROPERTY_TARGETS, key=lambda p: p.model_kind),
            key=lambda p: p.model_kind)
        return {
            model_kind: {
                id_property.property_name: (
                    tuple(cls._ID_PROPERTY_TARGETS[id_property]))
                for id_property in id_properties
            }
            for model_kind, id_properties in id_properties_by_model_kind
        }

    def _get_model_kind(self, model_class):
        """Returns the kind of the model class.

        Args:
            model_class: BaseModel. A subclass of BaseModel.

        Returns:
            str. The model's kind.

        Raises:
            TypeError. The model class is not a subclass of BaseModel.
        """
        if not isinstance(model_class, type):
            raise TypeError('%r is an instance, not a type' % model_class)
        if not issubclass(model_class, base_models.BaseModel):
            raise TypeError(
                '%s is not a subclass of BaseModel' % model_class.__name__)
        return job_utils.get_model_kind(model_class)

    def _validate_name_of_model_relationships(self, model_relationships):
        """Checks that the model_relationships function has the expected name.

        Args:
            model_relationships: callable. The function to validate.

        Raises:
            ValueError. The function is named incorrectly.
        """
        lower_snake_case_model_kind = (
            # Source: https://stackoverflow.com/a/1176023/4859885.
            re.sub(r'(?<!^)(?=[A-Z])', '_', self._model_kind).lower())
        expected_name = '%s_relationships' % lower_snake_case_model_kind
        actual_name = model_relationships.__name__
        if actual_name != expected_name:
            raise ValueError('Please rename the function from "%s" to "%s"' % (
                actual_name, expected_name))
