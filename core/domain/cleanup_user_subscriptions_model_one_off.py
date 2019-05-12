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
from core.domain import prod_validation_jobs_one_off
from core.platform import models

(user_models,) = models.Registry.import_models([models.NAMES.user])


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
            user_subs_model = (
                prod_validation_jobs_one_off.UserSubscriptionsModelValidator())
            user_subs_model.fetch_external_models(model_instance)

            should_mutate = False
            _, model_id_model_tuples = (
                user_subs_model.external_models['activity_ids'])
            for model_id, model in model_id_model_tuples:
                if model is None or model.deleted:
                    should_mutate = True
                    model_instance.activity_ids.remove(model_id)
            if should_mutate:
                model_instance.put()
                yield ('Successfully cleaned up UserSubscriptionModel', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))
