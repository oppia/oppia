# Copyright 2020 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Configures a request handler for exporting backups."""

from __future__ import absolute_import # pylint: disable=import-only-modules
from __future__ import unicode_literals # pylint: disable=import-only-modules

import datetime
import json
import logging

from google.appengine.api import app_identity
from google.appengine.api import users
import requests
import webapp2

APP_NAME_OPPIASERVER = 'oppiaserver'
GCS_BUCKET_URL_PREFIX = 'gs://'
XSSI_PREFIX = ')]}\'\n'


class ExportToCloudDatastoreHandler(webapp2.RequestHandler):
    """Request handler which supports triggering automatic exports of the
    entities that application stores in Google Cloud Datastore.
    """

    @property
    def is_cron_job(self):
        """Returns whether the request came from a cron job."""
        return self.request.headers.get('X-AppEngine-Cron') is not None

    @property
    def is_super_admin(self):
        """Returns whether the request came from an admin."""
        return users.is_current_user_admin()

    def handle_exception(self, exception, unused_debug_mode):
        """Overwrites the default exception handler.

        Args:
            exception: Exception. The exception that was thrown.
            unused_debug_mode: bool. True if the web application is running
                in debug mode.
        """
        logging.error(exception)
        self.response.content_type = b'application/json; charset=utf-8'
        self.response.headers.update({
            b'Content-Disposition': (
                b'attachment; filename="oppia-attachment.txt"'),
            b'Strict-Transport-Security': (
                b'max-age=31536000; includeSubDomains'),
            b'X-Content-Type-Options': b'nosniff',
            b'X-Xss-Protection': b'1; mode=block',
        })
        json_output = json.dumps({'error': repr(exception)})
        self.response.write('%s%s' % (XSSI_PREFIX, json_output))

    def get(self):
        """Triggers an export of Google Cloud Datastore.

        Export data described in request parameters.

        Raises:
            Exception. One of the following ocurred:
                -   The user does not have credentials to access the page.
                -   The request was not made in the correct environment.
                -   The bucket parameter is malformed or missing.
                -   The export request failed to respond.
        """

        if not (self.is_cron_job or self.is_super_admin):
            self.response.status_code = 401
            raise Exception(
                'You do not have the credentials to access this page.')

        app_id = app_identity.get_application_id()
        if app_id != APP_NAME_OPPIASERVER:
            self.response.status_code = 500
            raise Exception(
                'Export service has been pinged from a non-production '
                'or non-Oppia environment, so the request has been ignored.')

        bucket = self.request.get('bucket')
        if not bucket.startswith(GCS_BUCKET_URL_PREFIX):
            self.response.status_code = 400
            raise Exception(
                'bucket must begin with %s' % GCS_BUCKET_URL_PREFIX)

        access_token, unused_expiration_time = app_identity.get_access_token(
            'https://www.googleapis.com/auth/datastore')
        output_url_prefix = '%s/%s' % (
            bucket, datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S'))

        url = 'https://datastore.googleapis.com/v1/projects/%s:export' % app_id
        headers = {
            b'Content-Type': b'application/json',
            b'Authorization': b'Bearer %s' % access_token,
        }
        payload = {
            'project_id': app_id,
            'output_url_prefix': output_url_prefix,
            'entity_filter': {
                'kinds': self.request.get_all('kind'),
                'namespace_ids': self.request.get_all('namespace_id'),
            },
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
        except Exception:
            self.response.status_code = 500
            raise
        else:
            logging.info(resp.content)


app = webapp2.WSGIApplication( # pylint: disable=invalid-name
    [('/cloud_datastore_export', ExportToCloudDatastoreHandler)],
    debug=True)
