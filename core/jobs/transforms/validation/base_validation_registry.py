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

"""Entry point for accessing the full collection of model auditing DoFns.

This module imports all of the "jobs.transforms.*_audits" modules so that their
AuditsExisting decorators are executed. Doing so ensures that the decorated
DoFns are added to AuditsExisting's internal registry, which we delegate to in
the get_audit_do_fn_types_by_kind() function.

TODO(#11475): Add lint checks that ensure all "jobs.transforms.*_audits" modules
are imported into this file.
"""

from __future__ import annotations

from core.jobs.decorators import validation_decorators
from core.jobs.types import model_property

import apache_beam as beam
from typing import Dict, FrozenSet, Set, Tuple, Type

from core.jobs.transforms.validation import auth_validation         # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import base_validation         # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import blog_validation         # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import collection_validation   # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import config_validation       # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import exp_validation          # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import feedback_validation     # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import improvements_validation # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import question_validation     # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import skill_validation        # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import story_validation        # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import subtopic_validation     # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import topic_validation        # pylint: disable=unused-import  # isort: skip
from core.jobs.transforms.validation import user_validation         # pylint: disable=unused-import  # isort: skip


def get_audit_do_fn_types_by_kind() -> Dict[str, FrozenSet[Type[beam.DoFn]]]:
    """Returns the set of DoFns targeting each kind of model.

    Returns:
        dict(str: set(DoFn)). DoFn classes, keyed by the kind of model they have
        targeted.
    """
    return validation_decorators.AuditsExisting.get_audit_do_fn_types_by_kind()


def get_id_referencing_properties_by_kind_of_possessor() -> Dict[
    str, Tuple[Tuple[model_property.ModelProperty, Tuple[str, ...]], ...]
]:
    """Returns properties whose values refer to the IDs of the corresponding
    set of model kinds, grouped by the kind of model the properties belong to.

    Returns:
        dict(str, tuple(tuple(ModelProperty, tuple(str)))). Tuples of type
        (ModelProperty, tuple(kind of models)), grouped by the kind of model the
        properties belong to.
    """
    return (
        validation_decorators.RelationshipsOf
        .get_id_referencing_properties_by_kind_of_possessor())


def get_all_model_kinds_referenced_by_properties() -> Set[str]:
    """Returns all model kinds that are referenced by another model's property.

    Returns:
        set(str). All model kinds referenced by one or more properties,
        excluding the models' own ID.
    """
    return (
        validation_decorators.RelationshipsOf
        .get_all_model_kinds_referenced_by_properties())
