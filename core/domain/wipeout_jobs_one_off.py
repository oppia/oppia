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
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.PendingDeletionRequestModel]

    @staticmethod
    def map(model_instance):
        """Implements the map function for this job."""
        if model_instance.deletion_complete:
            yield ('ALREADY DONE', model_instance.id)
        else:
            wipeout_service.delete_user(model_instance)
            yield ('SUCCESS', model_instance.id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class VerifyUserDeletionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for verifying the user deletion."""
    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.PendingDeletionRequestModel]

    @staticmethod
    def map(model_instance):
        """Implements the map function for this job."""
        # If deletion_complete is False the UserDeletionOneOffJob wasn't yet run
        # for the user. The verification will be done in the next run of
        # VerifyUserDeletionOneOffJob.
        if not model_instance.deletion_complete:
            yield ('NOT DELETED', model_instance.id)
        elif wipeout_service.verify_user_deleted(model_instance):
            yield ('SUCCESS', model_instance.id)
        else:
            yield ('FAILURE', model_instance.id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)
