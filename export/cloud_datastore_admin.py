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
import logging

from core.controllers import base

from google.appengine.api import app_identity
import requests
import webapp2

APP_NAME_OPPIASERVER = 'oppiaserver'
GCS_BUCKET_URL_PREFIX = 'gs://'


class ExportToCloudDatastoreHandler(base.BaseHandler):
    """Request handler which supports triggering automatic exports of the
    entities that application stores in Google Cloud Datastore.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = 'json'

    @property
    def is_cron_job(self):
        """Returns whether the request came from a cron job."""
        return self.request.headers.get('X-AppEngine-Cron') is not None

    def get(self):
        """Triggers an export of Google Cloud Datastore.

        Export data described in request parameters.

        Raises:
            UnauthorizedUserException. The user does not have credentials to
                access the page.
        """

        if not (self.is_cron_job or self.is_super_admin):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to access this page.')

        app_id = app_identity.get_application_id()
        if app_id != APP_NAME_OPPIASERVER:
            raise self.PageNotFoundException(
                'Export service has been pinged from a non-production '
                'environment so the request has been ignored.')

        bucket = self.request.get('bucket')
        if not bucket.startswith(GCS_BUCKET_URL_PREFIX):
            raise self.InvalidInputException(
                'bucket must begin with %s' % GCS_BUCKET_URL_PREFIX)

        access_token, unused_expiration_time = app_identity.get_access_token(
            'https://www.googleapis.com/auth/datastore')
        output_url_prefix = '%s/%s' % (
            bucket, datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S'))

        url = 'https://datastore.googleapis.com/v1/projects/%s:export' % app_id
        payload = {
            'project_id': app_id,
            'output_url_prefix': output_url_prefix,
            'entity_filter': {
                'kinds': self.request.get_all('kind'),
                'namespace_ids': self.request.get_all('namespace_id'),
            },
        }
        headers = {
            b'Content-Type': b'application/json',
            b'Authorization': b'Bearer %s' % access_token,
        }

        try:
            response = (
                requests.post(url, json=payload, headers=headers, timeout=60))
            response.raise_for_status()
        except:
            logging.exception('Failed to initiate export.')
        else:
            logging.info(response.content)


app = webapp2.WSGIApplication( # pylint: disable=invalid-name
    [('/cloud_datastore_export', ExportToCloudDatastoreHandler)],
    debug=True)
