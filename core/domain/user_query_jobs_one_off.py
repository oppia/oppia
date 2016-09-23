# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Jobs to execute and get result of a query."""
import ast
import datetime

from core import jobs
from core.domain import exp_services
from core.domain import rights_manager
from core.platform import models

(user_models, exp_models) = (
    models.Registry.import_models(
        [models.NAMES.user, models.NAMES.exploration]))


class UserQueryOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for excuting query with given query parameters.
    For each user we check if he/she satisfies query criteria. If the user
    satisfies the query criteria, then yield a tuple (query_id, user_id).
    The reducer function stores all user_ids that satisfy the query in the
    corresponding UserQueryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        query_id = jobs.BaseMapReduceJobManager.get_mapper_param('query_id')
        query_model = user_models.UserQueryModel.get(query_id)
        user_id = user_settings_model.id
        user_contributions = user_models.UserContributionsModel.get(user_id)

        if (user_id == query_model.submitter_id or
                rights_manager.Actor(user_id).is_moderator()):
            return

        if query_model.active_in_last_n_days is not None:
            days = query_model.active_in_last_n_days
            created_n_explorations = False
            edited_n_explorations = False

            created_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.created_exploration_ids)

            edited_explorations = (
                exp_models.ExplorationCommitLogEntryModel.query(
                    exp_models.ExplorationCommitLogEntryModel.user_id ==
                    user_id).fetch())

            for exp in created_explorations.values():
                days_since_created = (
                    datetime.datetime.utcnow() - exp.created_on).days
                if days_since_created <= days:
                    created_n_explorations = True
                    break

            for exp in edited_explorations:
                days_since_updated = (
                    datetime.datetime.utcnow() - exp.last_updated).days
                if days_since_updated <= days:
                    edited_n_explorations = True
                    break

            if not (created_n_explorations or edited_n_explorations):
                return

        if query_model.created_at_least_n_exps is not None:
            if (len(user_contributions.created_exploration_ids) <
                    query_model.created_at_least_n_exps):
                return

        if query_model.created_fewer_than_n_exps is not None:
            if (len(user_contributions.created_exploration_ids) >=
                    query_model.created_fewer_than_n_exps):
                return

        if query_model.edited_at_least_n_exps is not None:
            if (len(user_contributions.edited_exploration_ids) <
                    query_model.edited_at_least_n_exps):
                return

        if query_model.edited_fewer_than_n_exps is not None:
            if (len(user_contributions.edited_exploration_ids) >=
                    query_model.edited_fewer_than_n_exps):
                return

        yield(query_id, user_id)

    @staticmethod
    def reduce(query_model_id, stringified_user_ids):
        query_model = user_models.UserQueryModel.get(query_model_id)
        user_ids = [ast.literal_eval(v) for v in stringified_user_ids]
        query_model.user_ids = [str(user) for user in user_ids]
        query_model.put()
