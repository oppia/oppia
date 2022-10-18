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

"""Unit tests for jobs.mailchimp_population_jobs."""

from __future__ import annotations

import datetime

from core import feconf
from core.jobs import job_test_utils
from core.jobs.batch_jobs import mailchimp_population_jobs
from core.jobs.types import job_run_result
from core.platform import models

from mailchimp3 import mailchimpclient

from typing import Dict, Final, List, Mapping, Type, TypedDict, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models
    from mypy_imports import user_models

(config_models, user_models) = models.Registry.import_models([
    models.Names.CONFIG, models.Names.USER
])


class MailChimpListsDataDict(TypedDict):
    """Dictionary representation for data argument of update_members method."""

    members: List[Dict[str, str]]
    update_existing: bool


class MailchimpPopulateJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        mailchimp_population_jobs.MailchimpPopulateJob
    ] = mailchimp_population_jobs.MailchimpPopulateJob

    USER_ID_PREFIX: Final = 'user_id_'
    DATETIME: Final = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')

    class MockMailchimpClass:
        """Class to mock Mailchimp class."""

        class MailchimpLists:
            """Class to mock Mailchimp lists object."""

            def __init__(self) -> None:
                self.parent_emails: List[str] = []

            def update_members(
                self,
                _audience_id: str,
                data: MailChimpListsDataDict
            ) -> Mapping[str, Union[List[str], List[Dict[str, str]]]]:
                """Mocks the update_members function of the mailchimp api.

                Args:
                    _audience_id: str. Audience Id of the mailchimp list.
                    data: list(dict(str,str)). Payload received.

                Returns:
                    dict. Returns correct dict based on whether invalid email
                    was received or not.

                Raises:
                    MailchimpError. Error 404 to mock API server error.
                """
                emails = []
                for user in data['members']:
                    emails.append(user['email_address'])

                self.parent_emails = emails

                if 'invalid_email' in emails:
                    updated_members: List[str] = []
                    invalid_email_dict: Dict[
                        str, Union[List[str], List[Dict[str, str]]]
                    ] = {
                        'new_members': emails[1:],
                        'updated_members': updated_members,
                        'errors': [{
                            'email_address': 'invalid_email'
                        }]
                    }
                    return invalid_email_dict

                # Mocking a request issue by throwing an exception for this
                # particular case.
                if 'errored_email' in emails:
                    raise mailchimpclient.MailChimpError({
                        'status': 404, 'title': 'Server Issue',
                        'detail': 'Server Issue'
                    })

                valid_email_dict: Dict[str, List[str]] = {
                    'new_members': emails,
                    'updated_members': []
                }
                return valid_email_dict

        def __init__(self) -> None:
            self.lists = self.MailchimpLists()

    def setUp(self) -> None:
        super().setUp()
        self.enabled_user_emails = []
        for i in range(0, 1200):
            user_id = '%s%d' % (self.USER_ID_PREFIX, i)
            user_email = '%s@email.com' % user_id

            if i % 2:
                self.enabled_user_emails.append(user_email)

            user_model = self.create_model(
                user_models.UserSettingsModel,
                id=user_id,
                email=user_email
            )
            user_model.update_timestamps()
            user_model.put()

            # Half of the users have emails enabled.
            preferences_model = self.create_model(
                user_models.UserEmailPreferencesModel,
                id=user_id,
                site_updates=bool(i % 2)
            )
            preferences_model.update_timestamps()
            preferences_model.put()

        self.enabled_user_emails.sort()
        self.first_batch_emails = self.enabled_user_emails[0:500]
        self.second_batch_emails = self.enabled_user_emails[500:1000]

        config_model = self.create_model(
                config_models.ConfigPropertyModel,
                id='batch_index_for_mailchimp',
                value=0
            )
        config_model.update_timestamps()
        config_model.commit('user_id_0', [])

        self.swap_audience_id = self.swap(
            feconf, 'MAILCHIMP_AUDIENCE_ID', 'audience_id')

    def test_job_runs_correctly_for_first_batch(self) -> None:
        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_population_jobs, '_get_mailchimp_class',
            swapped_mailchimp)

        with swap_mailchimp_context, self.swap_audience_id:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='Request successful')
            ])

            self.assertItemsEqual(
                mailchimp.lists.parent_emails, self.first_batch_emails)

    def test_job_runs_correctly_for_second_batch(self) -> None:
        config_model = self.create_model(
                config_models.ConfigPropertyModel,
                id='batch_index_for_mailchimp',
                value=1
            )
        config_model.update_timestamps()
        config_model.commit('user_id_0', [])

        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_population_jobs, '_get_mailchimp_class',
            swapped_mailchimp)

        with swap_mailchimp_context, self.swap_audience_id:
            self.assert_job_output_is([
                job_run_result.JobRunResult(stdout='Request successful')
            ])

            self.assertItemsEqual(
                mailchimp.lists.parent_emails, self.second_batch_emails)

    def test_job_runs_correctly_with_invalid_email(self) -> None:
        user_model = self.create_model(
                user_models.UserSettingsModel,
                id='user_id',
                email='invalid_email'
            )
        user_model.update_timestamps()
        user_model.put()

        # Half of the users have emails enabled.
        preferences_model = self.create_model(
            user_models.UserEmailPreferencesModel,
            id='user_id',
            site_updates=True
        )
        preferences_model.update_timestamps()
        preferences_model.put()

        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_population_jobs, '_get_mailchimp_class',
            swapped_mailchimp)

        with swap_mailchimp_context, self.swap_audience_id:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='User update failed for: [\'invalid_email\']')
            ])

    def test_job_fails_correctly_with_request_error(self) -> None:
        user_model = self.create_model(
                user_models.UserSettingsModel,
                id='user_id',
                email='errored_email'
            )
        user_model.update_timestamps()
        user_model.put()

        # Half of the users have emails enabled.
        preferences_model = self.create_model(
            user_models.UserEmailPreferencesModel,
            id='user_id',
            site_updates=True
        )
        preferences_model.update_timestamps()
        preferences_model.put()

        mailchimp = self.MockMailchimpClass()
        swapped_mailchimp = lambda: mailchimp
        swap_mailchimp_context = self.swap(
            mailchimp_population_jobs, '_get_mailchimp_class',
            swapped_mailchimp)

        with swap_mailchimp_context, self.swap_audience_id:
            self.assert_job_output_is([
                job_run_result.JobRunResult(
                    stdout='Server Issue')
            ])


class MockMailchimpPopulateJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[
        mailchimp_population_jobs.MockMailchimpPopulateJob
    ] = mailchimp_population_jobs.MockMailchimpPopulateJob

    USER_ID_PREFIX: Final = 'user_id_'
    DATETIME: Final = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')

    def setUp(self) -> None:
        super().setUp()
        self.enabled_user_emails = []
        for i in range(0, 1200):
            user_id = '%s%d' % (self.USER_ID_PREFIX, i)
            user_email = '%s@email.com' % user_id

            if i % 2:
                self.enabled_user_emails.append(user_email)

            user_model = self.create_model(
                user_models.UserSettingsModel,
                id=user_id,
                email=user_email
            )
            user_model.update_timestamps()
            user_model.put()

            # Half of the users have emails enabled.
            preferences_model = self.create_model(
                user_models.UserEmailPreferencesModel,
                id=user_id,
                site_updates=bool(i % 2)
            )
            preferences_model.update_timestamps()
            preferences_model.put()

        self.enabled_user_emails = sorted(self.enabled_user_emails)
        self.first_batch_emails = self.enabled_user_emails[0:500]
        self.second_batch_emails = self.enabled_user_emails[500:1000]

        config_model = self.create_model(
                config_models.ConfigPropertyModel,
                id='batch_index_for_mailchimp',
                value=0
            )
        config_model.update_timestamps()
        config_model.commit('user_id_0', [])

    def test_job_runs_correctly_for_first_batch(self) -> None:
        expected_emails = [
            'user_id_1001@email.com',
            'user_id_1003@email.com',
            'user_id_1005@email.com',
            'user_id_1007@email.com',
            'user_id_1009@email.com',
            'user_id_813@email.com',
            'user_id_815@email.com',
            'user_id_817@email.com',
            'user_id_819@email.com',
            'user_id_81@email.com',
        ]

        expected_output = ','.join(expected_emails)
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout=expected_output)
        ])

    def test_job_runs_correctly_for_second_batch(self) -> None:
        config_model = self.create_model(
                config_models.ConfigPropertyModel,
                id='batch_index_for_mailchimp',
                value=1
            )
        config_model.update_timestamps()
        config_model.commit('user_id_0', [])

        expected_emails = [
            'user_id_821@email.com',
            'user_id_823@email.com',
            'user_id_825@email.com',
            'user_id_827@email.com',
            'user_id_829@email.com',
            'user_id_995@email.com',
            'user_id_997@email.com',
            'user_id_999@email.com',
            'user_id_99@email.com',
            'user_id_9@email.com'
        ]

        expected_output = ','.join(expected_emails)
        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout=expected_output)
        ])
