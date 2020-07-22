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
from core.domain import email_manager
from core.domain import wipeout_service
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class UserDeletionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for running the user deletion."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.PendingDeletionRequestModel]

    @staticmethod
    def map(pending_deletion_request_model):
        """Implements the map function for this job."""
        pending_deletion_request = wipeout_service.get_pending_deletion_request(
            pending_deletion_request_model.id)
        if pending_deletion_request.deletion_complete:
            yield ('ALREADY DONE', pending_deletion_request.user_id)
        else:
            wipeout_service.delete_user(pending_deletion_request)
            pending_deletion_request.deletion_complete = True
            wipeout_service.save_pending_deletion_request(
                pending_deletion_request)
            yield ('SUCCESS', pending_deletion_request.user_id)

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
        # If deletion_complete is False the UserDeletionOneOffJob wasn't yet run
        # for the user. The verification will be done in the next run of
        # FullyCompleteUserDeletionOneOffJob.
        pending_deletion_request = wipeout_service.get_pending_deletion_request(
            pending_deletion_request_model.id)
        if not pending_deletion_request.deletion_complete:
            yield ('NOT DELETED', pending_deletion_request.user_id)
        elif wipeout_service.verify_user_deleted(pending_deletion_request):
            wipeout_service.delete_pending_deletion_request(
                pending_deletion_request.user_id)
            email_manager.send_account_deleted_email(
                pending_deletion_request.user_id,
                pending_deletion_request.email)
            yield ('SUCCESS', pending_deletion_request.user_id)
        else:
            pending_deletion_request.deletion_complete = False
            wipeout_service.save_pending_deletion_request(
                pending_deletion_request)
            yield ('FAILURE', pending_deletion_request.user_id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
