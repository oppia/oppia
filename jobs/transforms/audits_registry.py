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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs.decorators import audit_decorators
from jobs.transforms import auth_audits  # pylint: disable=unused-import
from jobs.transforms import base_model_audits  # pylint: disable=unused-import
from jobs.transforms import user_audits  # pylint: disable=unused-import


def get_audit_do_fn_types_by_kind():
    """Returns the set of DoFns targeting each kind of model.

    Returns:
        dict(str: set(DoFn)). DoFn classes, keyed by the kind of model they have
        targeted.
    """
    return audit_decorators.AuditsExisting.get_audit_do_fn_types_by_kind()


def get_property_relationships_by_kind():
    """Returns the property relationships between models.

    Returns:
        dict(str: dict(str: tuple(str))). Property relationships keyed by the
        kind of model the properties belong to. For each property, the
        corresponding set refers to the kinds of models which should exist in
        storage with the same ID.
    """
    return (
        audit_decorators.RelationshipsOf.get_property_relationships_by_kind())
