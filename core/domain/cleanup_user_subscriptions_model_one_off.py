# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""One-off job for cleaning up UserSubscriptionsModel models in prod."""

from core import jobs
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class CleanupActivityIdsFromUserSubscriptionsModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One off job that removes nonexisting activity ids from
    UserSubscriptionsModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Remove invalid ids in a UserSubscriptionsModel entity."""

        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
            fetched_exploration_model_instances = (
                datastore_services.fetch_multiple_entities_by_ids_and_models(
                    [('ExplorationModel', model_instance.activity_ids)]))[0]

            should_mutate = False
            for exp_id, exp_instance in zip(
                    model_instance.activity_ids,
                    fetched_exploration_model_instances):
                if exp_instance is None or exp_instance.deleted:
                    should_mutate = True
                    model_instance.activity_ids.remove(exp_id)
            if should_mutate:
                model_instance.put()
                yield ('Successfully cleaned up UserSubscriptionsModel', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))
