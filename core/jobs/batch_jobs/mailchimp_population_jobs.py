# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Job to populate the mailchimp db with existing users."""

from __future__ import annotations

import ast

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import mailchimp3
from mailchimp3 import mailchimpclient
import result

from typing import Iterable, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models
    from mypy_imports import user_models

(config_models, user_models) = models.Registry.import_models([
    models.NAMES.config, models.NAMES.user
])


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that CombineFn class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'CombineFn' (has type 'Any')), we added an
# ignore here.
class CombineItems(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining all user email, status tuples."""

    def create_accumulator(self) -> List[str]:
        """Base accumulator where the tuples are added."""
        return []

    def add_input(self, accumulator: List[str], email: str) -> List[str]:
        """Append each tuple to the accumulator list."""
        accumulator.append(email)
        return accumulator

    def merge_accumulators(
        self, accumulators: Iterable[List[str]]
    ) -> List[str]:
        """Merging accumulators is just combining both of them into a single
        list.
        """
        output_accumulator = []
        for accumulator in accumulators:
            output_accumulator.extend(accumulator)
        return output_accumulator

    def extract_output(self, accumulator: List[str]) -> List[str]:
        """Output is the accumulator itself."""
        return accumulator


def _get_mailchimp_class() -> mailchimp3.MailChimp:
    """Returns the mailchimp api class. This is separated into a separate
    function to facilitate testing.
    NOTE: No other functionalities should be added to this function.

    Returns:
        Mailchimp. A mailchimp class instance with the API key and username
        initialized.
    """

    # The following is a class initialized in the library with the API key and
    # username and hence cannot be tested directly. The mailchimp functions are
    # tested with a mock class.
    return mailchimp3.MailChimp(    # pragma: no cover
        mc_api=feconf.MAILCHIMP_API_KEY, mc_user=feconf.MAILCHIMP_USERNAME)


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class SendBatchMailchimpRequest(beam.DoFn):  # type: ignore[misc]
    """DoFn to send batch mailchimp request for 500 users at a time."""

    def process(
        self, emails: List[str], batch_index_dict: int, test_run: bool
    ) -> result.Result[str]:
        """Add 500 users at a time, who have subscribed for newsletters,
            to the MailChimp DB.

        Args:
            emails: list(str). List of emails of users subscribed to
                newsletters.
            batch_index_dict: int. Current batch index.
            test_run: bool. Whether to use mailchimp API or not. To be set to
                TRUE only when run from a non-production server for testing.

        Raises:
            Exception. Exception thrown by the api is raised.

        Yields:
            JobRunResult. Job run result which is either 'Ok' or an error with
            corresponding error message.
        """
        sorted_emails = sorted(emails)
        selected_emails = sorted_emails[
            batch_index_dict * 500: (batch_index_dict + 1) * 500]

        if test_run:
            # There is a max limit of 1500 bytes for job output. Hence, only
            # returning first and last 5 emails in batch for testing.
            yield result.Ok(
                ','.join(selected_emails[: 5] + selected_emails[-5:]))
            return
        mailchimp_data = []

        client = _get_mailchimp_class()
        for email in selected_emails:
            mailchimp_data.append({
                'email_address': email,
                'status': 'subscribed'
            })

        try:
            response = client.lists.update_members(
                feconf.MAILCHIMP_AUDIENCE_ID,
                {'members': mailchimp_data, 'update_existing': False})
        except mailchimpclient.MailChimpError as error:
            error_message = ast.literal_eval(str(error))
            yield result.Err(error_message['detail'])
            return

        response_emails_count = (
            len(response['new_members']) + len(response['updated_members']))
        source_emails_count = len(selected_emails)
        if response_emails_count == source_emails_count:
            yield result.Ok('Request successful')
        else:
            failed_emails = []
            for user in response['errors']:
                failed_emails.append(user['email_address'])
            yield result.Err('User update failed for: %s' % failed_emails)


class MailchimpPopulateJob(base_jobs.JobBase):
    """One-off job for populating the mailchimp db."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        # Pcollection that returns the relevant config property with batch
        # index.
        config_property = (
            self.pipeline
            | 'Get all config properties' >> ndb_io.GetModels(
                config_models.ConfigPropertyModel.get_all())
            | 'Get the batch_index_for_mailchimp property value' >> beam.Filter(
                lambda model: model.id == 'batch_index_for_mailchimp')
            | 'Get value' >> beam.Map(lambda model: model.value)
        )

        batch_index_dict = beam.pvalue.AsSingleton(config_property)

        # PCollection with all user ids that have opted in for email
        # newsletters.
        relevant_user_ids = (
            self.pipeline
            | 'Get all UserEmailPreferencesModel' >> ndb_io.GetModels(
                user_models.UserEmailPreferencesModel.get_all().filter(
                    user_models.UserEmailPreferencesModel.site_updates == True # pylint: disable=singleton-comparison
                ))
            | 'Extract user ID' >> beam.Map(
                lambda preferences_model: preferences_model.id)
        )

        valid_user_ids = beam.pvalue.AsIter(relevant_user_ids)

        # PCollection of all user emails opted in for newsletters.
        relevant_user_emails = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all())
            | 'Filter user models' >> (
                beam.Filter(
                    lambda model, ids: model.id in ids, ids=valid_user_ids))
            | 'Get email' >> (beam.Map(lambda model: model.email))
        )

        mailchimp_results = (
            relevant_user_emails
            # A large batch size is given so that all emails are included in a
            # single list.
            | 'Combine into a list' >> beam.CombineGlobally(CombineItems())
            | 'Send mailchimp request for current batch' >> beam.ParDo(
                SendBatchMailchimpRequest(), batch_index_dict=batch_index_dict,
                test_run=False)
            | 'Get final result' >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    result.value))
        )

        return mailchimp_results


class MockMailchimpPopulateJob(base_jobs.JobBase):
    """Test one-off job for populating the mailchimp db."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        # Pcollection that returns the relevant config property with batch
        # index.
        config_property = (
            self.pipeline
            | 'Get all config properties' >> ndb_io.GetModels(
                config_models.ConfigPropertyModel.get_all())
            | 'Get the batch_index_for_mailchimp property value' >> beam.Filter(
                lambda model: model.id == 'batch_index_for_mailchimp')
            | 'Get value' >> beam.Map(lambda model: model.value)
        )

        batch_index_dict = beam.pvalue.AsSingleton(config_property)

        # PCollection with all user ids that have opted in for email
        # newsletters.
        relevant_user_ids = (
            self.pipeline
            | 'Get all UserEmailPreferencesModel' >> ndb_io.GetModels(
                user_models.UserEmailPreferencesModel.get_all().filter(
                    user_models.UserEmailPreferencesModel.site_updates == True # pylint: disable=singleton-comparison
                ))
            | 'Extract user ID' >> beam.Map(
                lambda preferences_model: preferences_model.id)
        )

        valid_user_ids = beam.pvalue.AsIter(relevant_user_ids)

        # PCollection of all user emails opted in for newsletters.
        relevant_user_emails = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all())
            | 'Filter user models' >> (
                beam.Filter(
                    lambda model, ids: model.id in ids, ids=valid_user_ids))
            | 'Get email' >> (beam.Map(lambda model: model.email))
        )

        mailchimp_results = (
            relevant_user_emails
            # A large batch size is given so that all emails are included in a
            # single list.
            | 'Combine into a list' >> beam.CombineGlobally(CombineItems())
            | 'Send mailchimp request for current batch' >> beam.ParDo(
                SendBatchMailchimpRequest(), batch_index_dict=batch_index_dict,
                test_run=True)
            | 'Get final result' >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    result.value))
        )

        return mailchimp_results
