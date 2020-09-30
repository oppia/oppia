# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Tests for the export request handler."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
from export import cloud_datastore_admin
import requests_mock

from google.appengine.api import app_identity
import requests
import webtest


class ExportToCloudDatastoreHandlerTests(test_utils.GenericTestBase):

    VIEWER_EMAIL = 'viewer@example.com'
    VIEWER_USERNAME = 'viewer'

    EXPORT_URL = 'https://datastore.googleapis.com/v1/projects/%s:export' % (
        cloud_datastore_admin.APP_NAME_OPPIASERVER)

    def setUp(self):
        super(ExportToCloudDatastoreHandlerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.testapp = webtest.TestApp(cloud_datastore_admin.app)

    def mock_production_environment(self):
        """Returns a context manager that mocks a production environment."""
        return self.swap(
            app_identity, 'get_application_id',
            lambda: cloud_datastore_admin.APP_NAME_OPPIASERVER)

    def test_export_as_admin_succeeds(self):
        admin_ctx = self.login_context(self.ADMIN_EMAIL, is_super_admin=True)
        prod_ctx = self.mock_production_environment()

        with admin_ctx, prod_ctx, requests_mock.Mocker() as requests_mocker:
            requests_mocker.post(self.EXPORT_URL)

            res = self.testapp.get('/cloud_datastore_export?bucket=gs://abc')

        self.assertEqual(res.status_code, 200)

    def test_export_as_cron_job_succeeds(self):
        cron_job_headers = {b'X-AppEngine-Cron': b'true'}
        prod_ctx = self.mock_production_environment()

        with prod_ctx, requests_mock.Mocker() as requests_mocker:
            requests_mocker.post(self.EXPORT_URL)

            res = self.testapp.get(
                '/cloud_datastore_export?bucket=gs://abc',
                headers=cron_job_headers)

        self.assertEqual(res.status_code, 200)

    def test_export_when_http_request_raises_error_fails(self):
        admin_ctx = self.login_context(self.ADMIN_EMAIL, is_super_admin=True)
        prod_ctx = self.mock_production_environment()

        with admin_ctx, prod_ctx, requests_mock.Mocker() as requests_mocker:
            requests_mocker.post(self.EXPORT_URL, exc=Exception('uh-oh!'))

            res = self.testapp.get(
                '/cloud_datastore_export?bucket=gs://abc',
                expect_errors=True)

        self.assertEqual(res.status_code, 500)
        self.assertIn('uh-oh!', res.body)

    def test_export_outside_of_prod_environment_fails(self):
        admin_ctx = self.login_context(self.ADMIN_EMAIL, is_super_admin=True)

        with admin_ctx:
            res = self.testapp.get(
                '/cloud_datastore_export?bucket=gs://abc', expect_errors=True)

        self.assertEqual(res.status_code, 500)
        self.assertIn(
            'Export service has been pinged from a non-production '
            'or non-Oppia environment, so the request has been ignored.',
            res.body)

    def test_export_with_no_bucket_fails(self):
        admin_ctx = self.login_context(self.ADMIN_EMAIL, is_super_admin=True)
        prod_ctx = self.mock_production_environment()

        with admin_ctx, prod_ctx:
            res = self.testapp.get(
                '/cloud_datastore_export', expect_errors=True)

        self.assertEqual(res.status_code, 400)
        self.assertIn('bucket must begin with gs://', res.body)

    def test_export_with_bucket_missing_prefix_fails(self):
        admin_ctx = self.login_context(self.ADMIN_EMAIL, is_super_admin=True)
        prod_ctx = self.mock_production_environment()

        with admin_ctx, prod_ctx:
            res = self.testapp.get(
                '/cloud_datastore_export?bucket=abc', expect_errors=True)

        self.assertEqual(res.status_code, 400)
        self.assertIn('bucket must begin with gs://', res.body)

    def test_viewer_can_not_initiate_export(self):
        non_admin_ctx = (
            self.login_context(self.VIEWER_EMAIL, is_super_admin=False))
        prod_ctx = self.mock_production_environment()

        with non_admin_ctx, prod_ctx:
            res = self.testapp.get(
                '/cloud_datastore_export?bucket=gs://abc', expect_errors=True)

        self.assertEqual(res.status_code, 401)
        self.assertIn(
            'You do not have the credentials to access this page', res.body)
