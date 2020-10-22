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

"""Wipeout one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.domain import wipeout_service
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class UserDeletionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for running the user deletion."""

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We limit the number of shards to only one so that each user is deleted
        # separately and there are no conflicts between the deletions.
        super(UserDeletionOneOffJob, cls).enqueue(
            job_id, shard_count=1)

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.PendingDeletionRequestModel]

    @staticmethod
    def map(pending_deletion_request_model):
        """Implements the map function for this job."""
        pending_deletion_request = wipeout_service.get_pending_deletion_request(
            pending_deletion_request_model.id)
        # The final status of the deletion. Either 'SUCCESS' or 'ALREADY DONE'.
        deletion_status = wipeout_service.run_user_deletion(
            pending_deletion_request)
        yield (deletion_status, pending_deletion_request.user_id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class FullyCompleteUserDeletionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for verifying the user deletion. It checks if all models do
    not contain the user ID of the deleted user in their fields. If any field
    contains the user ID of the deleted user, the deletion_complete is set
    to False, so that later the UserDeletionOneOffJob will be run on that
    user again. If all the fields do not contain the user ID of the deleted
    user, the final email announcing that the deletion was completed is sent,
    and the deletion request is deleted.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.PendingDeletionRequestModel]

    @staticmethod
    def map(pending_deletion_request_model):
        """Implements the map function for this job."""
        pending_deletion_request = wipeout_service.get_pending_deletion_request(
            pending_deletion_request_model.id)
        # The final status of the completion. Either 'NOT DELETED', 'SUCCESS',
        # or 'FAILURE'.
        completion_status = wipeout_service.run_user_deletion_completion(
            pending_deletion_request)
        yield (completion_status, pending_deletion_request.user_id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
