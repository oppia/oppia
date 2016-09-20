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

"""Domain object for a parameters of a query."""

from core.platform import models

(job_models,) = models.Registry.import_models([models.NAMES.job])

# pylint: disable=C0103
class QueryParameters(object):
    """Domain object for parameters of a query.

    Each query has a combination of these parameters. This parameters are used
    for checking whether given user qualifies a query or not.

    Attributes:
        has_user_logged_in_since_n_days: query parameter that specifies whether
            given user has logged in since last n days.
        created_more_than_n_exploration: query parameter to specify whether
            user has created more than N explorations.
        created_less_than_n_exploration: query parameter to specify whether
            user has created less than N explorations.
        edited_less_than_n_exploration: query parameter to check if user has
            edited less than N explorations.
        edited_more_than_n_exploration: query parameter to check if user has
            edited more than N explorations.
        created_or_edited_exploration_in:_n_days: query parameter to
            specify whether user has created or edited one or more explorations
            in last N days."""

    def __init__(
            self, has_user_logged_in_since_n_days=None,
            created_less_than_n_exploration=None,
            created_more_than_n_exploration=None,
            edited_less_than_n_exploration=None,
            edited_more_than_n_exploration=None,
            created_or_edited_exploration_in_n_days=None):
        """Constructor for query parameter domain object."""
        self.has_user_logged_in_since_n_days = has_user_logged_in_since_n_days
        self.created_or_edited_exploration_in_n_days = (
            created_or_edited_exploration_in_n_days)
        self.created_more_than_n_exploration = created_more_than_n_exploration
        self.created_less_than_n_exploration = created_less_than_n_exploration
        self.edited_less_than_n_exploration = edited_less_than_n_exploration
        self.edited_more_than_n_exploration = edited_more_than_n_exploration

    def to_dict(self):
        """Returns a dict representing this QueryParameters domain object."""
        return {
            job_models.QUERY_PARAMETERS.has_user_logged_in_since_n_days: (
                self.has_user_logged_in_since_n_days),
            (job_models.QUERY_PARAMETERS.
             created_or_edited_exploration_in_n_days): (
                 self.created_or_edited_exploration_in_n_days),
            job_models.QUERY_PARAMETERS.created_less_than_n_exploration: (
                self.created_less_than_n_exploration),
            job_models.QUERY_PARAMETERS.created_more_than_n_exploration: (
                self.created_more_than_n_exploration),
            job_models.QUERY_PARAMETERS.edited_more_than_n_exploration: (
                self.edited_more_than_n_exploration),
            job_models.QUERY_PARAMETERS.edited_less_than_n_exploration: (
                self.edited_less_than_n_exploration)
        }


def get_parameters_from_query(query):
    has_user_logged_in_since_n_days = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.has_user_logged_in_since_n_days)])
    created_or_edited_exploration_in_n_days = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.
            created_or_edited_exploration_in_n_days)])
    created_more_than_n_exploration = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.created_more_than_n_exploration)])
    created_less_than_n_exploration = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.created_less_than_n_exploration)])
    edited_more_than_n_exploration = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.edited_more_than_n_exploration)])
    edited_less_than_n_exploration = (
        query.query_parameters[(
            job_models.QUERY_PARAMETERS.edited_less_than_n_exploration)])
    return QueryParameters(
        has_user_logged_in_since_n_days, created_less_than_n_exploration,
        created_more_than_n_exploration, edited_less_than_n_exploration,
        edited_more_than_n_exploration,
        created_or_edited_exploration_in_n_days)
