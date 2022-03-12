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
from typing import Dict, Iterable, List, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(config_models, user_models,) = models.Registry.import_models(
    [models.NAMES.config, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class SendBatchMailchimpRequest(beam.DoFn): # type: ignore[misc]
    """DoFn to send batch mailchimp request for 500 users at a time."""

    # The tuples argument has a lot of nested list values due to the way the
    # PCollections were grouped and combined in the beam job.
    def process(
        self,
        email_tuples: List[List[Tuple[List[str], List[bool]]]],
        batch_index_dict: Dict[str, int]
    ) -> result.Result[str]:
        """Add 500 users at a time, who have subscribed for newsletters,
            to the mailchimp db.

        Args:
            email_tuples: list(Tuple). List of tuples consisting of user emails
                and 'true' status. The second value is always true as the step
                before this function in the beam job filtered for the same.
            batch_index_dict: Dict. Single element dictionary of current batch
                index.

        Raises:
            Exception. Exception thrown by the api is raised.

        Yields:
            JobRunResult. Job run result which is either 'Ok' or an error with
            corresponding error message.
        """
        client = mailchimp3.MailChimp(    # pragma: no cover
            mc_api=feconf.MAILCHIMP_API_KEY, mc_user=feconf.MAILCHIMP_USERNAME)

        email_tuples = email_tuples[0][
            batch_index_dict['batch_index_for_mailchimp'] * 500:
            (batch_index_dict['batch_index_for_mailchimp'] + 1) * 500]
        mailchimp_data = []

        for email, _ in email_tuples:
            mailchimp_data.append({
                'email_address': email[0],
                'status': 'subscribed'
            })

        try:
            response = client.lists.update_members(
                feconf.MAILCHIMP_AUDIENCE_ID,
                {'members': mailchimp_data, 'update_existing': True})
        except mailchimpclient.MailChimpError as error:
            error_message = ast.literal_eval(str(error))
            raise Exception(error_message['detail']) from error

        if (
                len(response['new_members']) + len(response['updated_members'])
                == len(email_tuples)):
            yield result.Ok()
        else:
            failed_emails = []
            for user in response['errors']:
                failed_emails.append(user['email_address'])
            yield result.Err('User update failed for: %s' % failed_emails)


class CombineTuples(beam.CombineFn):  # type: ignore[misc]
    """CombineFn for combining all user email, status tuples."""

    def create_accumulator(self) -> List:
        """Base accumulator where the tuples are added."""
        return []

    def add_input(self, accumulator: List, model: Tuple) -> List:
        """Append each tuple to the accumulator list."""
        accumulator.append(model)
        return accumulator

    def merge_accumulators(self, accumulators: Iterable[List]) -> List:
        """Merging accumulators is just combining both of them into a single
        list.
        """
        return list(accumulators)

    def extract_output(
        self, accumulator: List
    ) -> List:
        """Output is the accumulator itself."""
        return accumulator


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
            | 'Convert model into a dict' >> beam.Map(
                lambda model: (model.id, model.value)))
        batch_index_dict = beam.pvalue.AsDict(config_property)

        # PCollection with all user ids that have opted in for email
        # newsletters.
        relevant_user_ids = (
            self.pipeline
            | 'Get all UserEmailPreferencesModel' >> ndb_io.GetModels(
                user_models.UserEmailPreferencesModel.get_all().order(
                    'created_on'))
            | 'Filter for site_updates == true' >> beam.Filter(
                lambda model: model.site_updates is True)
            | 'Extract user id as tuple' >> beam.Map(
                lambda preferences_model: (preferences_model.id, True))
        )

        # PCollection of all user ids in oppia mapped to their emails.
        relevant_user_emails = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all())
            | 'Extract user email' >> beam.Map(
                lambda settings_model: (settings_model.id, settings_model.email)
            )
        )

        # Merge both PCollections to map the user email to the user ids along
        # with a bool 'True' if they have opted in for newsletter.
        mailchimp_results = (
            (relevant_user_emails, relevant_user_ids)
            | 'Group by user_id' >> beam.CoGroupByKey()
            | 'Drop user id' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Filter for valid user emails' >> beam.Filter(
                lambda email_status: (
                    len(email_status[1]) == 1 and email_status[1][0] is True)
            )
            | 'Combine all valid tuples into a single list' >>
                beam.CombineGlobally(CombineTuples())
            | 'Send mailchimp request for current batch' >> beam.ParDo(
                SendBatchMailchimpRequest(), batch_index_dict=batch_index_dict)
            | 'Get final result' >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    result.value))
        )

        return mailchimp_results
