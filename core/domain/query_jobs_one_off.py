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
from core.domain import query_domain
from core.platform import models

(user_models, job_models, exp_models) = (
    models.Registry.import_models(
        [models.NAMES.user, models.NAMES.job, models.NAMES.exploration]))


class QueryOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for excuting query with given query parameters.
    For each user we check if he/she satisfies query criteria. If user satisfies
    query criteria then yeilds a tuple of (query_id, user_id). Reducer function
    stores all such satisfying user_ids in query result model."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        query_id = jobs.BaseMapReduceJobManager.get_mapper_param('query_id')
        query = job_models.QueryModel.get(query_id)
        query_parameters = query_domain.get_parameters_from_query(query)
        user_id = user_settings_model.id
        user_qualified = True

        if user_id == query.submitter_id:
            user_qualified = False

        if user_settings_model.username == 'tmpsuperadm1n':
            user_qualified = False

        if (query_parameters.created_or_edited_exploration_in_n_days is not None
                and user_qualified):
            days = query_parameters.created_or_edited_exploration_in_n_days
            created_exploration_in_n_days = False
            edited_exploration_in_n_days = False

            user_contributions = user_models.UserContributionsModel.get(user_id)
            created_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.created_exploration_ids)

            edited_explorations = (
                exp_models.ExplorationCommitLogEntryModel.query(
                    exp_models.ExplorationCommitLogEntryModel.user_id ==
                    user_id).fetch())

            for exp in created_explorations.values():
                days_since_created = (
                    datetime.datetime.utcnow() - exp.created_on).days
                days_since_updated = (
                    datetime.datetime.utcnow() - exp.last_updated).days
                if days_since_created <= days or days_since_updated <= days:
                    created_exploration_in_n_days = True
                    break

            for exp in edited_explorations:
                days_since_updated = (
                    datetime.datetime.utcnow() - exp.last_updated).days
                if days_since_updated <= days:
                    edited_exploration_in_n_days = True
                    break

            user_qualified = (
                (created_exploration_in_n_days or edited_exploration_in_n_days)
                and user_qualified)

        if (query_parameters.created_more_than_n_exploration is not None and
                user_qualified):
            exploration_count = query_parameters.created_more_than_n_exploration
            user_contributions = user_models.UserContributionsModel.get(user_id)
            created_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.created_exploration_ids)

            user_qualified = (
                (len(created_explorations) >= exploration_count) and
                user_qualified)

        if (query_parameters.created_less_than_n_exploration is not None and
                user_qualified):
            exploration_count = query_parameters.created_less_than_n_exploration
            user_contributions = user_models.UserContributionsModel.get(user_id)
            created_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.created_exploration_ids)

            user_qualified = (
                (len(created_explorations) <= exploration_count) and
                user_qualified)

        if (query_parameters.edited_more_than_n_exploration is not None and
                user_qualified):
            exploration_count = query_parameters.edited_more_than_n_exploration
            user_contributions = user_models.UserContributionsModel.get(user_id)
            edited_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.edited_exploration_ids)

            user_qualified = (
                (len(edited_explorations) >= exploration_count) and
                user_qualified)

        if (query_parameters.edited_less_than_n_exploration is not None and
                user_qualified):
            exploration_count = query_parameters.edited_less_than_n_exploration
            user_contributions = user_models.UserContributionsModel.get(user_id)
            edited_explorations = exp_services.get_multiple_explorations_by_id(
                user_contributions.edited_exploration_ids)

            user_qualified = (
                (len(edited_explorations) <= exploration_count) and
                user_qualified)

        if user_qualified:
            yield (query_id, user_id)

    @staticmethod
    def reduce(query_model_id, stringified_user_ids):
        query = job_models.QueryModel.get(query_model_id)
        user_ids = [ast.literal_eval(v) for v in stringified_user_ids]
        new_user_ids = set(query.user_ids + user_ids)
        query.user_ids = [str(user) for user in new_user_ids]
        query.put()
