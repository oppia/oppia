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

from __future__ import annotations

import collections
import inspect
import itertools
import re

from core.jobs import job_utils
from core.jobs.types import base_validation_errors
from core.jobs.types import model_property
from core.platform import models

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


class AuditsExisting:
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
            ValueError. No model_types given.
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
                # Always keep the most-derived DoFn type.
                continue
            registered_do_fn_types -= base_types_of_do_fn_type
            registered_do_fn_types.add(do_fn_type)

        # Decorate the DoFn with type constraints that raise an error when args
        # or return values have the wrong type.
        with_input_types, with_output_types = (
            typehints.with_input_types(
                typehints.Union[self._targeted_model_types]),
            typehints.with_output_types(base_validation_errors.BaseAuditError))
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


class RelationshipsOf:
    """Decorator for describing {Model.property: Model.ID} relationships.

    This decorator adds a domain-specific language (DSL) for defining the
    relationship between model properties and the IDs of related models.

    The name of the function is enforced by the decorator so that code reads
    intuitively:
        "Relationships Of [MODEL_CLASS]
        "define model_relationships(model):
            yield model.property, [RELATED_MODELS...]

    Example:
        @RelationshipsOf(UserAuthDetailsModel)
        def user_auth_details_model_relationships(model):
            yield (model.id, [UserSettingsModel])
            yield (model.firebase_auth_id, [UserIdByFirebaseAuthId])
            yield (model.gae_id, [UserIdentifiersModel])
    """

    # A dict(ModelProperty: set(str)). The keys are properties of a model whose
    # values refer to the IDs of their corresponding set of model kinds.
    _ID_REFERENCING_PROPERTIES = collections.defaultdict(set)

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
            model_relationships: callable. Expected to yield tuples of type
                (Property, list(class)), where the properties are from the
                argument provided to the function.

        Returns:
            generator. The same object.
        """
        self._validate_name_of_model_relationships(model_relationships)

        yielded_items = model_relationships(self._model_class)
        for property_instance, referenced_models in yielded_items:
            property_of_model = model_property.ModelProperty(
                self._model_class, property_instance)
            self._ID_REFERENCING_PROPERTIES[property_of_model].update(
                self._get_model_kind(m)
                for m in referenced_models if m is not self._model_class)

        return model_relationships

    @classmethod
    def get_id_referencing_properties_by_kind_of_possessor(cls):
        """Returns properties whose values refer to the IDs of the corresponding
        set of model kinds, grouped by the kind of model the properties belong
        to.

        Returns:
            dict(str, tuple(tuple(ModelProperty, tuple(str)))). Tuples of
            (ModelProperty, set(kind of models)), grouped by the kind of model
            the properties belong to.
        """
        by_kind = lambda model_property: model_property.model_kind
        id_referencing_properties_by_kind_of_possessor = itertools.groupby(
            sorted(cls._ID_REFERENCING_PROPERTIES.keys(), key=by_kind),
            key=by_kind)
        references_of = lambda p: cls._ID_REFERENCING_PROPERTIES[p]
        return {
            kind: tuple((p, tuple(references_of(p))) for p in properties)
            for kind, properties in (
                id_referencing_properties_by_kind_of_possessor)
        }

    @classmethod
    def get_all_model_kinds_referenced_by_properties(cls):
        """Returns all model kinds that are referenced by another's property.

        Returns:
            set(str). All model kinds referenced by one or more properties,
            excluding the models' own ID.
        """
        return set(itertools.chain.from_iterable(
            cls._ID_REFERENCING_PROPERTIES.values()))

    @classmethod
    def get_model_kind_references(cls, model_kind, property_name):
        """Returns the kinds of models referenced by the given property.

        Args:
            model_kind: str. The kind of model the property belongs to.
            property_name: str. The property's name.

        Returns:
            list(str). The kinds of models referenced by the given property.
        """
        model_cls = job_utils.get_model_class(model_kind)
        prop = model_property.ModelProperty(
            model_cls, getattr(model_cls, property_name))
        return cls._ID_REFERENCING_PROPERTIES.get(prop, set())

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
