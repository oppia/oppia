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

from __future__ import annotations

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import app_feedback_report_domain
from core.domain import app_feedback_report_services

from typing import Dict, Any # isort:skip # pylint: disable=unused-import


class IncomingAndroidFeedbackReportHandler(base.BaseHandler):
    """Handles incoming android feedback reports from the app."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'report': {
                'schema': {
                    'type': 'object_dict',
                    'object_class': (
                        app_feedback_report_domain.AppFeedbackReport)
                }
            }
        }
    }

    @acl_decorators.is_from_oppia_android
    def post(self): # type: ignore[no-untyped-def]
        """Handles POST requests.

        Verifies that the incoming message is from Oppia Android based on the
        request header and stores the feedback report.
        """
        report_obj = self.normalized_payload.get('report')
        app_feedback_report_services.save_feedback_report_to_storage(
            report_obj, new_incoming_report=True)
        app_feedback_report_services.store_incoming_report_stats(report_obj)

        return self.render_json({})
