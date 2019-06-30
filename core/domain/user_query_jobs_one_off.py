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
from core.domain import email_manager
from core.domain import user_services
from core.platform import models
import feconf

(user_models, exp_models, job_models) = (
    models.Registry.import_models(
        [models.NAMES.user, models.NAMES.exploration, models.NAMES.job]))

# pylint: disable=too-many-return-statements


class UserQueryOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for excuting query with given query parameters.
    For each user we check if he/she satisfies query criteria. If the user
    satisfies the query criteria, then yield a tuple (query_id, user_id).
    The reducer function stores all user_ids that satisfy the query in the
    corresponding UserQueryModel.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        query_id = (
            jobs.BaseMapReduceOneOffJobManager.get_mapper_param('query_id'))
        query_model = user_models.UserQueryModel.get(query_id)
        user_id = user_settings_model.id
        user_contributions = user_models.UserContributionsModel.get(user_id)

        if (user_id == query_model.submitter_id or
                user_services.is_at_least_moderator(user_id)):
            return

        if query_model.has_not_logged_in_for_n_days is not None:
            if user_settings_model.last_logged_in:
                difference = (
                    datetime.datetime.utcnow() -
                    user_settings_model.last_logged_in).days
                if difference < query_model.has_not_logged_in_for_n_days:
                    return

        if query_model.inactive_in_last_n_days is not None:
            if user_settings_model.last_created_an_exploration:
                difference = (
                    datetime.datetime.utcnow() -
                    user_settings_model.last_created_an_exploration).days
                if difference < query_model.inactive_in_last_n_days:
                    return
            elif user_settings_model.last_edited_an_exploration:
                difference = (
                    datetime.datetime.utcnow() -
                    user_settings_model.last_edited_an_exploration).days
                if difference < query_model.inactive_in_last_n_days:
                    return
            else:
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
        query_model.user_ids = [str(user_id) for user_id in user_ids]
        query_model.put()

    @classmethod
    def _post_completed_hook(cls, job_id):
        job_model = job_models.JobModel.get(job_id)
        query_id = job_model.additional_job_params['query_id']
        query_model = user_models.UserQueryModel.get(query_id)
        query_model.query_status = feconf.USER_QUERY_STATUS_COMPLETED
        query_model.put()
        email_manager.send_query_completion_email(
            query_model.submitter_id, query_id)

    @classmethod
    def _post_failure_hook(cls, job_id):
        job_model = job_models.JobModel.get(job_id)
        query_id = job_model.additional_job_params['query_id']
        query_model = user_models.UserQueryModel.get(query_id)
        query_model.query_status = feconf.USER_QUERY_STATUS_FAILED
        query_model.put()

        query_params = {
            'inactive_in_last_n_days': query_model.inactive_in_last_n_days,
            'has_not_logged_in_for_n_days': (
                query_model.has_not_logged_in_for_n_days),
            'created_at_least_n_exps': query_model.created_at_least_n_exps,
            'created_fewer_than_n_exps': query_model.created_fewer_than_n_exps,
            'edited_at_least_n_exps': query_model.edited_at_least_n_exps,
            'edited_fewer_than_n_exps': query_model.edited_fewer_than_n_exps
        }
        email_manager.send_query_failure_email(
            query_model.submitter_id, query_id, query_params)
