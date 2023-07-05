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

from typing import (
    Callable, Dict, FrozenSet, Iterator, Sequence, Set, Tuple, Type, cast)

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

_ALL_MODEL_TYPES: FrozenSet[Type[base_models.BaseModel]] = frozenset(
    models.Registry.get_all_storage_model_classes())

_ALL_BASE_MODEL_TYPES: FrozenSet[Type[base_models.BaseModel]] = frozenset(
    models.Registry.get_storage_model_classes([models.Names.BASE_MODEL]))

_MODEL_TYPES_BY_BASE_CLASS: Dict[
    Type[base_models.BaseModel],
    FrozenSet[Type[base_models.BaseModel]]
] = {
    base_class: frozenset({base_class}).union(
        t for t in _ALL_MODEL_TYPES if issubclass(t, base_class))
    for base_class in _ALL_BASE_MODEL_TYPES
}

# This type is defined for the arguments which can accept functions
# that yields the values of type Tuple(property, List[BaseModel]).
ModelRelationshipsType = Callable[
    ...,
    Iterator[
        Tuple[
            model_property.PropertyType,
            Sequence[Type[base_models.BaseModel]]
        ]
    ]
]


class AuditsExisting:
    """Decorator for registering DoFns that audit storage models.

    DoFns registered by this decorator should assume that the models they
    receive as input do not have `deleted=True`.

    When decorating a DoFn that inherits from another, it overwrites the base
    class. For example, ValidateExplorationModelId overwrites ValidateModelId if
    and only if ValidateExplorationModelId inherits from ValidateModelId.
    """

    _DO_FN_TYPES_BY_KIND: Dict[
        str, Set[Type[beam.DoFn]]
    ] = collections.defaultdict(set)

    def __init__(self, *model_types: Type[base_models.BaseModel]) -> None:
        """Initializes the decorator to target the given types of models.

        Args:
            *model_types: tuple(class). The models the decorator will target. If
                an argument is a base class, all of its subclasses will be
                targeted as well.

        Raises:
            ValueError. No model given.
            TypeError. When a non-model type is provided.
        """
        if not model_types:
            raise ValueError('Must target at least one model')
        self._targeted_model_types: Set[Type[base_models.BaseModel]] = set()
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

    def __call__(self, do_fn_type: Type[beam.DoFn]) -> Type[beam.DoFn]:
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
        # TODO(#15613): Here we use cast because the return type of functions
        # with_input_types and with_output_types is Any, because these functions
        # are not type annotated yet in Apache_beam library. Thus to return the
        # appropriate type from function instead of Any. We used cast here.
        return cast(
            Type[beam.DoFn],
            with_input_types(with_output_types(do_fn_type))
        )

    @classmethod
    def get_audit_do_fn_types_by_kind(
        cls
    ) -> Dict[str, FrozenSet[Type[beam.DoFn]]]:
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
    _ID_REFERENCING_PROPERTIES: Dict[
        model_property.ModelProperty, Set[str]
    ] = collections.defaultdict(set)

    def __init__(self, model_class: Type[base_models.BaseModel]) -> None:
        """Initializes a new RelationshipsOf decorator.

        Args:
            model_class: class. A subclass of BaseModel.
        """
        self._model_kind = self._get_model_kind(model_class)
        self._model_class = model_class

    def __call__(
        self, model_relationships: ModelRelationshipsType
    ) -> ModelRelationshipsType:
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
    def get_id_referencing_properties_by_kind_of_possessor(
        cls
    ) -> Dict[
        str, Tuple[Tuple[model_property.ModelProperty, Tuple[str, ...]], ...]
    ]:
        """Returns properties whose values refer to the IDs of the corresponding
        set of model kinds, grouped by the kind of model the properties belong
        to.

        Returns:
            dict(str, tuple(tuple(ModelProperty, tuple(str)))). Tuples of
            (ModelProperty, set(kind of models)), grouped by the kind of model
            the properties belong to.
        """
        by_kind: Callable[
            [model_property.ModelProperty], str
        ] = lambda model_property: model_property.model_kind
        id_referencing_properties_by_kind_of_possessor = itertools.groupby(
            sorted(cls._ID_REFERENCING_PROPERTIES.keys(), key=by_kind),
            key=by_kind)
        references_of: Callable[
            [model_property.ModelProperty], Set[str]
        ] = lambda p: cls._ID_REFERENCING_PROPERTIES[p]
        return {
            kind: tuple((p, tuple(references_of(p))) for p in properties)
            for kind, properties in (
                id_referencing_properties_by_kind_of_possessor)
        }

    @classmethod
    def get_all_model_kinds_referenced_by_properties(cls) -> Set[str]:
        """Returns all model kinds that are referenced by another's property.

        Returns:
            set(str). All model kinds referenced by one or more properties,
            excluding the models' own ID.
        """
        return set(itertools.chain.from_iterable(
            cls._ID_REFERENCING_PROPERTIES.values()))

    @classmethod
    def get_model_kind_references(
        cls, model_kind: str, property_name: str
    ) -> Set[str]:
        """Returns the kinds of models referenced by the given property.

        Args:
            model_kind: str. The kind of model the property belongs to.
            property_name: str. The property's name.

        Returns:
            set(str). The kinds of models referenced by the given property.
        """
        model_cls = job_utils.get_model_class(model_kind)
        # Here model_cls is of type Type[datastore_services.Model] but from the
        # implementation of ModelProperty it is clear that it can only accept
        # Type[base_models.BaseModel]. So to narrow down the type, we used
        # assert statement here.
        assert issubclass(model_cls, base_models.BaseModel)
        prop = model_property.ModelProperty(
            model_cls, getattr(model_cls, property_name))
        return cls._ID_REFERENCING_PROPERTIES.get(prop, set())

    def _get_model_kind(self, model_class: Type[base_models.BaseModel]) -> str:
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

    def _validate_name_of_model_relationships(
        self, model_relationships: ModelRelationshipsType
    ) -> None:
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
