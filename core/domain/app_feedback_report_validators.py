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

import datetime

from core.domain import base_model_validators
from core.platform import models
import feconf
import utils

(
    base_models, app_feedback_report_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.app_feedback_report
])

# Timestamp in sec since epoch for Mar 1 2021 12:00:00 UTC.
EARLIEST_VALID_DATETIME = datetime.datetime.fromtimestamp(1614556800)

# A buffer for the scrubbing validation to account for any cron delays.
VALID_SCRUBBING_DATETIME_BUFFER = datetime.timedelta(days=2)


class AppFeedbackReportModelValidator(base_model_validators.BaseModelValidator):
    """Class for validating AppFeedbackReportModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [platform].[submission_timestamp_msec].[random_hash]
        submitted_on_msec = utils.get_time_in_millisecs(item.submitted_on)
        regex_string = '^%s\\.%s\\.[A-Za-z0-9]{1,%s}$' % (
            item.platform, int(submitted_on_msec),
            base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_references = []
        if item.ticket_id:
            external_references = [
                base_model_validators.ExternalModelFetcherDetails(
                    'ticket_id',
                    app_feedback_report_models.AppFeedbackReportTicketModel,
                    [item.ticket_id])]
        return external_references

    @classmethod
    def _validate_schema_versions(cls, item):
        """Validates that the schema version of the report is not greater
        than the current report schema or less than the minimum supported
        version.

        Args:
            item: datastore_services.Model. AppFeedbackReportModel to validate.
        """
        if item.platform == app_feedback_report_models.PLATFORM_CHOICE_ANDROID:
            if not (
                    feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION <=
                    item.android_report_info_schema_version <=
                    feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION):
                cls._add_error(
                    'report schema %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: android report schema version %s is outside '
                    'the range of supported versions [%s, %s]' % (
                        item.id, item.android_report_info_schema_version,
                        feconf.MINIMUM_ANDROID_REPORT_SCHEMA_VERSION,
                        feconf.CURRENT_ANDROID_REPORT_SCHEMA_VERSION))
        else:
            if not (
                    feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION <=
                    item.web_report_info_schema_version <=
                    feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION):
                cls._add_error(
                    'report schema %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: web report schema version %s is outside the '
                    'range of supported versions [%s, %s]' % (
                        item.id, item.web_report_info_schema_version,
                        feconf.MINIMUM_WEB_REPORT_SCHEMA_VERSION,
                        feconf.CURRENT_WEB_REPORT_SCHEMA_VERSION))

    @classmethod
    def _validate_created_on_datetime(cls, item):
        """Validates that the created_on date of the model is less than the
        current time and greater than the earliest possible date of submissions
        (no earlier than March 2021).

        Args:
            item: datastore_services.Model. AppFeedbackReportModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.created_on > current_datetime:
            cls._add_error(
                'created_on %s' % (
                    base_model_validators.ERROR_CATEGORY_DATETIME_CHECK),
                'Entity id %s: The created_on field has a value %s which is '
                'greater than the time when the job was run' % (
                    item.id, item.created_on))
        if item.created_on < EARLIEST_VALID_DATETIME:
            cls._add_error(
                'created_on %s' % (
                    base_model_validators.ERROR_CATEGORY_DATETIME_CHECK),
                'Entity id %s: The created_on field has a value %s which is '
                'less than the earliest possible submission date' % (
                    item.id, item.created_on))

    @classmethod
    def _validate_expired_reports_are_scrubbed(cls, item):
        """Validates that if the submitted_on of model is less than expiring (at
        or past its storage age of feconf.APP_FEEDBACK_REPORT_MAXIMUM_DAYS),
        then the scrubbed_by field is non-None. This validation adds a buffer
        time of VALID_SCRUBBING_DATETIME_BUFFER to the maximum number of days a
        report can be stored, in case there is a delay in the cron runtime that
        extends the number of days the report is stored for.

        Args:
            item: datastore_services.Model. AppFeedbackReportModel to validate.
        """
        # The earliest creation date of reports that can be kept in storage with
        # with a 2-day buffer time for the cron to run, in case the scrubbing is
        # delayed.
        latest_datetime = datetime.datetime.utcnow() - (
            feconf.APP_FEEDBACK_REPORT_MAXIMUM_DAYS +
            VALID_SCRUBBING_DATETIME_BUFFER)
        if item.created_on < latest_datetime and not item.scrubbed_by:
            model_class = app_feedback_report_models.AppFeedbackReportModel
            cls._add_error(
                'scrubbed_by %s' % (
                    base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                'Entity id %s: based on entity created_on date %s, expected '
                'model %s to have field scrubbed_by but it doesn\'t'
                ' exist' % (
                    item.id, utils.get_time_in_millisecs(item.created_on),
                    model_class.__name__))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_schema_versions,
            cls._validate_created_on_datetime,
            cls._validate_expired_reports_are_scrubbed]

    @classmethod
    def _validate_external_ticket_id(
            cls, item, field_name_to_external_model_references):
        """Validates that the ticket_id is a valid AppFeedbackReportTicketModel.

        Args:
            item: datastore_services.Model. AppFeedbackReportModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage model to which the
                external model is associated. Each value contains a list of
                ExternalModelReference objects corresponding to the field_name.
                For examples, all the external ExplorationModels corresponding
                to a storage model can be associated with the field name
                'exp_ids'. This dict is used for validation of External Model
                properties linked to the storage model.
        """
        ticket_model_references = (
            field_name_to_external_model_references['ticket_id'])

        for ticket_model_reference in ticket_model_references:
            ticket_model = ticket_model_reference.model_instance
            if ticket_model is None or ticket_model.deleted:
                model_class = ticket_model_reference.model_class
                model_id = ticket_model_reference.model_id
                cls._add_error(
                    'ticket_id %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field ticket_id having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_external_ticket_id]


class AppFeedbackReportTicketModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating AppFeedbackReportTicketModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id:
        # [ticket_creation_datetime_msec]:[hash(ticket_name)]:[random hash]
        # We can only validate the timestamp is an int since the id generation
        # timestamp and the entity creation timestamp differ slightly.
        regex_string = (
            '^\\d+\\.[A-Za-z0-9]{1,%s}\\.[A-Za-z0-9]{1,%s}$' % (
                base_models.ID_LENGTH, base_models.ID_LENGTH))
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'report_ids',
                app_feedback_report_models.AppFeedbackReportModel,
                item.report_ids)]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_newest_report_timestamp]

    @classmethod
    def _validate_newest_report_timestamp(cls, item):
        """Validates that the newest_report_timestamp is less than current time
        and greater than the earliest possible date of submissions (no earlier
        than March 2021).

        Args:
            item: datastore_services.Model. AppFeedbackReportTicketModel to
                validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.newest_report_timestamp > current_datetime:
            cls._add_error(
                'newest_report_timestamp %s' % (
                    base_model_validators.ERROR_CATEGORY_DATETIME_CHECK),
                'Entity id %s: The newest_report_timestamp field has a value %s'
                ' which is greater than the time when the job was run' % (
                    item.id, item.newest_report_timestamp))
        if item.newest_report_timestamp < EARLIEST_VALID_DATETIME:
            cls._add_error(
                'newest_report_timestamp %s' % (
                    base_model_validators.ERROR_CATEGORY_DATETIME_CHECK),
                'Entity id %s: The newest_report_timestamp field has a value %s'
                ' which is less than the earliest possible submission date' % (
                    item.id, item.newest_report_timestamp))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_external_report_ids]

    @classmethod
    def _validate_external_report_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that the report_ids are valid AppFeedbackReportModels.

        Args:
            item: datastore_services.Model. AppFeedbackReportTicketModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage model to which the
                external model is associated. Each value contains a list of
                ExternalModelReference objects corresponding to the field_name.
                For examples, all the external ExplorationModels corresponding
                to a storage model can be associated with the field name
                'exp_ids'. This dict is used for validation of External Model
                properties linked to the storage model.
        """
        report_model_references = (
            field_name_to_external_model_references['report_ids'])

        for report_model_reference in report_model_references:
            report_model = report_model_reference.model_instance
            if report_model is None or report_model.deleted:
                model_class = report_model_reference.model_class
                model_id = report_model_reference.model_id
                cls._add_error(
                    'report_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field report_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))


class AppFeedbackReportStatsModelValidator(
        base_model_validators.BaseModelValidator):
    """Class for validating AppFeedbackReportStatsModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [platform]:[ticket_id]:[stats_date in YYYY-MM-DD]
        regex_string = '^%s\\:%s\\:%s' % (
            item.platform, item.ticket_id, item.stats_tracking_date.isoformat())
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'ticket_id',
                app_feedback_report_models.AppFeedbackReportTicketModel,
                [item.ticket_id])]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_schema_version,
            cls._validate_stats_tracking_date]

    @classmethod
    def _validate_schema_version(cls, item):
        """Validates that the schema version of the stats is not greater than
        the current stats schema or lower than the minimum supported version.

        Args:
            item: datastore_services.Model. AppFeedbackReportStatsModel to
                validate.
        """
        if not (
                feconf.MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION <=
                item.daily_param_stats_schema_version <=
                feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION):
            cls._add_error(
                'report stats schema %s' % (
                    base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                'Entity id %s: daily stats schema version %s is outside the '
                'range of supported versions [%s, %s]' % (
                    item.id, item.daily_param_stats_schema_version,
                    feconf.MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION,
                    feconf.CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION))

    @classmethod
    def _validate_stats_tracking_date(cls, item):
        """Validates that the stats_tracking_date of the model is greater than
        the earliest possible date of submissions (no earlier than March 2021).

        Args:
            item: datastore_services.Model. AppFeedbackReportStatsModel to
                validate.
        """
        if item.stats_tracking_date < EARLIEST_VALID_DATETIME.date():
            cls._add_error(
                'stats_tracking_date %s' % (
                    base_model_validators.ERROR_CATEGORY_DATETIME_CHECK),
                'Entity id %s: The stats_tracking_date field has a value %s '
                'which is less than the earliest possible submission date' % (
                    item.id, item.stats_tracking_date))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_external_ticket_id]

    @classmethod
    def _validate_external_ticket_id(
            cls, item, field_name_to_external_model_references):
        """Validates that the ticket_id is a valid AppFeedbackReportTicketModel.

        Args:
            item: datastore_services.Model. AppFeedbackReportStatsModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage model to which the
                external model is associated. Each value contains a list of
                ExternalModelReference objects corresponding to the field_name.
                For examples, all the external ExplorationModels corresponding
                to a storage model can be associated with the field name
                'exp_ids'. This dict is used for validation of External Model
                properties linked to the storage model.
        """
        ticket_id_references = (
            field_name_to_external_model_references['ticket_id'])

        for ticket_id_reference in ticket_id_references:
            ticket_model = ticket_id_reference.model_instance
            if ticket_model is None or ticket_model.deleted:
                model_class = ticket_id_reference.model_class
                model_id = ticket_id_reference.model_id
                cls._add_error(
                    'ticket_id %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field ticket_id having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
