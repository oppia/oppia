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
import re

from core.platform import models
from jobs import job_utils
from jobs.types import audit_errors
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
        "Relationships Of [MODEL_TYPE]
        "define model_type_relationships(model):
            yield model.property, [RELATED_MODELS...]

    This naming convention is enforced by the decorator.

    A concrete example:
        @RelationshipsOf(UserAuthDetailsModel)
        def user_auth_details_model_relationships(model):
            yield model.id, [UserSettingsModel]
            yield model.firebase_auth_id, [UserIdByFirebaseAuthId]
            yield model.gae_id, [UserIdentifiersModel]
    """

    _PROPERTY_RELATIONSHIPS_BY_MODEL_KIND = (
        collections.defaultdict(lambda: collections.defaultdict(set)))

    def __init__(self, dependent_model_type):
        """Initializes a new RelationshipsOf decorator.

        Args:
            dependent_model_type: class. A subclass of BaseModel.
        """
        self._model_kind = self._validate_model_type(dependent_model_type)
        self._dependent_model_type = dependent_model_type
        self._related_model_kinds_by_prop_name = (
            self._PROPERTY_RELATIONSHIPS_BY_MODEL_KIND[self._model_kind])

    def __call__(self, relationship_generator):
        """Registers the property relationships of self._model_kind yielded by
        the generator.

        See RelationshipsOf's docstring for a usage example.

        Args:
            relationship_generator:
                generator(class -> tuple(Property, list(class))). Should yield
                (Property, list(class)) tuples, where the properties are from
                the model class given to the generator as an argument.

        Returns:
            generator. The same object.
        """
        camel_case_kind = ( # https://stackoverflow.com/a/1176023/4859885.
            re.sub(r'(?<!^)(?=[A-Z])', '_', self._model_kind).lower())
        expected_name = '%s_relationships' % camel_case_kind
        if relationship_generator.__name__ != expected_name:
            raise ValueError('Please rename the function to %s' % expected_name)
        for prop, related_models in (
                relationship_generator(self._dependent_model_type)):
            prop_name = self._validate_property(prop)
            self._related_model_kinds_by_prop_name[prop_name].update(
                self._validate_model_type(m)
                for m in related_models if m is not self._dependent_model_type)
        return relationship_generator

    @classmethod
    def get_property_relationships_by_kind(cls):
        """Returns dict encoding how a model's properties correspond to
        the IDs of other models.

        Returns:
            dict(str: dict(str: set(str))). Property relationships keyed by the
            kind of model the properties belong to. For each property, the
            corresponding set refers to the kinds of models which should exist
            in storage with the same ID.
        """
        return {
            dependent_model_kind: {
                prop_name: tuple(related_model_kinds)
                for prop_name, related_model_kinds in
                related_model_kinds_by_prop_name.items()
            }
            for dependent_model_kind, related_model_kinds_by_prop_name in (
                cls._PROPERTY_RELATIONSHIPS_BY_MODEL_KIND.items())
        }

    def _validate_model_type(self, model_type):
        """Returns the same model class if it is valid.

        Args:
            model_type: BaseModel. A subclass of BaseModel.

        Returns:
            str. The model's kind.

        Raises:
            TypeError. The model class is not a subclass of BaseModel.
        """
        if not isinstance(model_type, type):
            raise TypeError('%r is an instance, not a type' % model_type)
        if not issubclass(model_type, base_models.BaseModel):
            raise TypeError(
                '%s is not a subclass of BaseModel' % model_type.__name__)
        return job_utils.get_model_kind(model_type)

    def _validate_property(self, prop):
        """Returns the name of the property if it is valid.

        Args:
            prop: datastore_services.Property. A property.

        Returns:
            str. The name of the property.

        Raises:
            TypeError. The property has the wrong type.
            ValueError. The property is not installed on
                self._dependent_model_type.
        """
        if prop is base_models.BaseModel.id:
            # BaseModel.id is a Python @property, not an Property, but we still
            # want to support it.
            return 'id'

        if not isinstance(prop, datastore_services.Property):
            raise TypeError('%s is not a Property' % type(prop).__name__)

        prop_name = prop._name # pylint: disable=protected-access
        if not hasattr(self._dependent_model_type, prop_name):
            raise TypeError('%s.%s not found' % (
                self._dependent_model_type.__name__, prop_name))

        expected_prop = getattr(self._dependent_model_type, prop_name)
        if prop is not expected_prop:
            raise ValueError('%s=%r is not %s.%s=%r' % (
                prop_name, prop, self._dependent_model_type.__name__,
                prop_name, expected_prop))

        return prop_name
