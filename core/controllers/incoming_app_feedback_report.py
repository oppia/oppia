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

"""Controllers for the incoming app feedback reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import app_feedback_report_services

import feconf
import utils


class IncomingAndroidFeedbackReportHandler(base.BaseHandler):
    """Handles incoming android feedback reports from the app."""

    @acl_decorators.open_access
    def post(self):
        """Handles POST requests.

        Verifies that the incoming message is from Oppia Android based on the
        request header and stores the feedback report.
        """
        if not self._has_valid_android_request_headers(self.request.headers):
            raise UnauthorizedRequestException(
                'The incoming request does not have valid authentication for '
                'Oppia Android.')

        report_dict = self.payload.get('report')
        if not report_dict:
            raise utils.InvalidInputException(
                'A report must be sent in the request.')

        report_obj = (
            app_feedback_report_services.create_android_report_from_json(
                report_dict))
        report_obj.validate()
        app_feedback_report_services.save_feedback_report_to_storage(
            report_obj, new_incoming_report=True)
        app_feedback_report_services.store_incoming_report_stats(report_obj)

        return self.render_json({})

    def _has_valid_android_request_headers(self, headers):
        """Verifies the headers from the incoming request.

        Args:
            headers: list(str). The headers to validate from the request.

        Returns:
            bool. Whether the request headers are valid and correspond to the
            expected header values for Android requests.
        """
        api_key = headers.get('api_key')
        app_package_name = headers.get('app_package_name')
        app_version_name = headers.get('app_version_name')
        app_version_code = headers.get('app_version_code')
        if (
                api_key != feconf.ANDROID_API_KEY or
                app_package_name != feconf.ANDROID_APP_PACKAGE_NAME or
                app_version_name != feconf.ANDROID_APP_VERSION_NAME or
                app_version_code != feconf.ANDROID_APP_VERSION_CODE):
            return False
        return True


class UnauthorizedRequestException(Exception):
    """Error class for an unauthorized request."""

    pass
