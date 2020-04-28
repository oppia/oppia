# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Models for Oppia improvement tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import uuid

from core.platform import models
import feconf
import python_utils

from google.appengine.ext import ndb

base_models, exp_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])

ENTITY_TYPE_CHOICES = (
    feconf.ENTITY_TYPE_EXPLORATION,
)

EXPLORATION_TASK_TYPE_CHOICES = (
    feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
    feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
    feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
)

EXPLORATION_TARGET_TYPE_CHOICE_STATE = 'state'
EXPLORATION_TARGET_TYPE_CHOICES = (EXPLORATION_TARGET_TYPE_CHOICE_STATE,)

STATUS_CHOICE_OPEN = 'open'
STATUS_CHOICE_DEPRECATED = 'deprecated'
STATUS_CHOICE_FIXED = 'fixed'

TASK_TYPE_CHOICES = EXPLORATION_TASK_TYPE_CHOICES
TARGET_TYPE_CHOICES = EXPLORATION_TARGET_TYPE_CHOICES
STATUS_CHOICES = (
    STATUS_CHOICE_OPEN,
    STATUS_CHOICE_DEPRECATED,
    STATUS_CHOICE_FIXED,
)

# Constants used to generate new IDs.
_GENERATE_NEW_ID_MAX_ATTEMPTS = 10


class TaskEntryModel(base_models.BaseModel):
    """Task entry corresponding to an actionable task in the improvements tab.

    Instances of a class have an ID with the form:
        [TASK_TYPE].[ENTITY_TYPE].[ENTITY_ID].[UUID]
    """
    # The type of task a task entry tracks.
    task_type = ndb.StringProperty(
        required=True, indexed=True, choices=TASK_TYPE_CHOICES)
    # The type of entity a task entry refers to.
    entity_type = ndb.StringProperty(
        required=True, indexed=True, choices=ENTITY_TYPE_CHOICES)
    # The ID of the entity a task entry refers to.
    entity_id = ndb.StringProperty(required=True, indexed=True)

    # The type of sub-entity a task entry focuses on.
    target_type = ndb.StringProperty(
        default=None, required=False, indexed=True, choices=TARGET_TYPE_CHOICES)
    # Uniquely identifies the sub-entity a task entry focuses on.
    target_id = ndb.StringProperty(default=None, required=False, indexed=True)

    # Tracks the state/progress of a task entry.
    status = ndb.StringProperty(
        required=True, indexed=True, choices=STATUS_CHOICES)
    # Refers to the first entity version (inclusive) a task entry is relevant
    # to.
    entity_version_start = ndb.IntegerProperty(required=True, indexed=True)
    # Refers to the last entity version (exclusive) a task entry is relevant to.
    entity_version_end = ndb.IntegerProperty(
        default=None, required=False, indexed=True)
    # The date and time at which a task was closed or deprecated.
    closed_on = ndb.DateTimeProperty(default=None, required=False, indexed=True)
    # ID of the user who closed the task, if any.
    closed_by = ndb.StringProperty(default=None, required=False, indexed=True)
    # Auto-generated string which provides a one-line summary of the task.
    closed_context = ndb.StringProperty(
        default=None, required=False, indexed=False)

    @classmethod
    def generate_new_task_id(cls, task_type, entity_type, entity_id):
        """Generates a new task entry ID.

        Args:
            task_type: str. The type of task a task entry tracks.
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.

        Returns:
            str. An ID available for use for a new task entry.
        """
        for _ in python_utils.RANGE(_GENERATE_NEW_ID_MAX_ATTEMPTS):
            task_id = u'%s.%s.%s.%s' % (
                task_type, entity_type, entity_id, uuid.uuid4())
            if not cls.get_by_id(task_id):
                return python_utils.UNICODE(task_id)
        raise Exception('Task ID strategy is creating too many collisions')

    @classmethod
    def create(
            cls, task_id, task_type, entity_type, entity_id,
            entity_version_start, entity_version_end=None, target_type=None,
            target_id=None, status=STATUS_CHOICE_OPEN):
        """Creates a new TaskEntryModel.

        Args:
            task_id: str. String to uniquely identify the new task.
            task_type: str. The type of task a task entry tracks.
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.
            entity_version_start: int. Refers to the first (inclusive) entity
                version a task entry is relevant to.
            entity_version_end: int or None. Refers to the last (exclusive)
                entity version a task entry is relevant to.
            target_type: str or None. The type of sub-entity a task entry
                focuses on.
            target_id: str or None. Uniquely identifies the sub-entity a task
                entry focuses on.
            status: str. Tracks the state/progress of a task entry.

        Returns:
            TaskEntryModel. The newly created valid TaskEntryModel instance.
        """
        return cls(
            id=task_id,
            task_type=task_type,
            entity_type=entity_type,
            entity_id=entity_id,
            target_type=target_type,
            target_id=target_id,
            status=status,
            entity_version_start=entity_version_start,
            entity_version_end=entity_version_end)
