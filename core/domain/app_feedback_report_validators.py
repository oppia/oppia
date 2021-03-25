# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Validators for app feedback report models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import base_model_validators
from core.platform import models

(
    base_models, app_feedback_report_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.app_feedback_report
])


class AppFeedbackReportModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating AppFeedbackReportModel."""

    # Timestamp in sec since epoch for Apr 1 2021 12:00:00 UTC.
    EARLIEST_DATETIME = datetime.datetime.fromtimestamp(1617235200)

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [platform].[timestamp_in_sec].[random_hash]
        regex_string = '^%s\\.\\d+\\.%s\\.[A-Za-z0-9]{1,%s}$' % (
            item.platform, item.submitted_on.second, base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        # TODO(jcqli): Create domain object when implementing domain layer
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'ticket_id',
                app_feedback_report_models.AppFeedbackReportTicketModel,
                [item.ticket_id]
            )
        ]


class AppFeedbackReportTicketModelValidator(
    base_model_validators.BaseModelValidator):
    """Class for validating AppFeedbackReportTicketModel."""

    # The length of a AppFeedbackReportTicketModel id is 
    REPORT_ID_LENGTH = 12+12+2+

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [creation_datetime]:[hash(ticket_name)]:[random hash]
        regex_string = (
            '\\d+\\:[A-Za-z0-9]{1,%s}$\\:[A-Za-z0-9]{1,%s}$' % (
            base_models.ID_LENGTH, base_models.ID_LENGTH))
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        # TODO(jcqli): Create domain object when implementing domain layer
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        stats_model_class = (
            app_feedback_report_models.AppFeedbackReportStatsModel)
        stats_models = stats_model_class.get_stats_for_ticket(item.id)
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'ticketed_report_ids',
                app_feedback_report_models.AppFeedbackReportModel,
                [item.report_ids]
            ),
            base_model_validators.ExternalModelFetcherDetails(
                'ticket_stats_ids',
                app_feedback_report_models.AppFeedbackReportStatsModel,
                stats_models
            )
        ]


class AppFeedbackReportStatsModelValidator(
    base_model_validators.BaseModelValidator):
"""Class for validating AppFeedbackReportStatsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [platform]:[ticket_id]:[date.seconds]
        regex_string = '^%s\\:[A-Za-z0-9]{1,%s}$\\:%s\\.\\d+' % (
            item.platform, base_models.ID_LENGTH, 
            item.stats_tracking_date.second)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        # TODO(jcqli): Create domain object when implementing domain layer
        return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'report_id',
                app_feedback_report_models.AppFeedbackReportModel,
                [item.report_ids]
            )
        ]
