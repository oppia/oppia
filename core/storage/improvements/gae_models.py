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

"""Models related to Oppia improvement tasks."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import uuid

from core.platform import models
import feconf
import python_utils

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

TEST_ONLY_ENTITY_TYPE = 'TEST_ONLY_ENTITY_TYPE' # Used by unit tests.
ENTITY_TYPE_EXPLORATION = feconf.ENTITY_TYPE_EXPLORATION
ENTITY_TYPES = (
    TEST_ONLY_ENTITY_TYPE,
    ENTITY_TYPE_EXPLORATION,
)

STATUS_OPEN = 'open'
STATUS_DEPRECATED = 'deprecated'
STATUS_RESOLVED = 'resolved'
STATUS_CHOICES = (
    STATUS_OPEN,
    STATUS_DEPRECATED,
    STATUS_RESOLVED,
)

TEST_ONLY_TARGET_TYPE = 'TEST_ONLY_TARGET_TYPE' # Used by unit tests.
TARGET_TYPE_STATE = 'state'
TARGET_TYPES = (
    TEST_ONLY_TARGET_TYPE,
    TARGET_TYPE_STATE,
)

TASK_TYPES = (
    feconf.TASK_TYPE_HIGH_BOUNCE_RATE,
    feconf.TASK_TYPE_SUCCESSIVE_INCORRECT_ANSWERS,
    feconf.TASK_TYPE_NEEDS_GUIDING_RESPONSES,
)

ENTITY_TYPE_TARGETS = {
    ENTITY_TYPE_EXPLORATION: {
        TARGET_TYPE_STATE,
    }
}

# Constant used to generate new IDs.
_GENERATE_NEW_TASK_ID_MAX_ATTEMPTS = 10


class TaskEntryModel(base_models.BaseModel):
    """Task entry corresponding to an actionable task in the improvements tab.

    Instances of a class have an ID with the form:
        [ENTITY_TYPE].[ENTITY_ID].[TASK_TYPE].[UUID]
    """
    # The type of entity a task entry refers to.
    entity_type = ndb.StringProperty(
        required=True, indexed=True, choices=ENTITY_TYPES)
    # The ID of the entity a task entry refers to.
    entity_id = ndb.StringProperty(required=True, indexed=True)
    # The type of task a task entry tracks.
    task_type = ndb.StringProperty(
        required=True, indexed=True, choices=TASK_TYPES)

    # The type of sub-entity a task entry focuses on.
    target_type = ndb.StringProperty(
        default=None, required=False, indexed=True, choices=TARGET_TYPES)
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
    # ID of the user who closed the task, if any.
    closed_by = ndb.StringProperty(default=None, required=False, indexed=True)
    # The date and time at which a task was closed or deprecated.
    closed_on = ndb.DateTimeProperty(default=None, required=False, indexed=True)
    # Auto-generated string which provides a one-line summary of the task.
    task_summary = ndb.StringProperty(
        default=None, required=False, indexed=False)

    @staticmethod
    def get_deletion_policy():
        """OK to delete task entries since they're just a historical record."""
        return base_models.DELETION_POLICY.DELETE

    @classmethod
    def apply_deletion_policy(cls, user_id):
        """Delete instances of TaskEntryModel for the user.

        Args:
            user_id: str. The ID of the user whose data should be deleted.
        """
        cls.delete_multi(cls.query(cls.closed_by == user_id))

    @staticmethod
    def get_export_policy():
        """TaskEntryModel contains the user ID that acted on a task."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @staticmethod
    def export_data(user_id):
        """Returns the user-relevant properties of TaskEntryModels.

        Args:
            user_id: str. The ID of the user whose data should be exported.

        Returns:
            dict. The user-relevant properties of TaskEntryModel in a dict
            format. In this case, we are returning all the ids of the tasks
            which were closed by this user.
        """
        tasks_closed_by_user = (
            TaskEntryModel.query(TaskEntryModel.closed_by == user_id))
        return {'task_ids_closed_by_user': [t.id for t in tasks_closed_by_user]}

    @staticmethod
    def get_user_id_migration_policy():
        """TaskEntryModel has the closed_by field which refers to a user ID."""
        return base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD

    @classmethod
    def get_user_id_migration_field(cls):
        """Return field that contains user ID."""
        return cls.closed_by

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether any TaskEntryModel references the given user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(
            cls.get_user_id_migration_field() == user_id).iter().has_next()

    @classmethod
    def generate_new_task_id(cls, entity_type, entity_id, task_type):
        """Generates a new task entry ID.

        Args:
            entity_type: str. The type of entity a task entry refers to.
            entity_id: str. The ID of the entity a task entry refers to.
            task_type: str. The type of task a task entry tracks.

        Returns:
            str. An ID available for use for a new task entry.
        """
        for _ in python_utils.RANGE(_GENERATE_NEW_TASK_ID_MAX_ATTEMPTS):
            task_id = '%s.%s.%s.%s' % (
                entity_type, entity_id, task_type, uuid.uuid4())
            if not cls.get_by_id(task_id):
                return task_id
        raise Exception('Task ID strategy is creating too many collisions')
