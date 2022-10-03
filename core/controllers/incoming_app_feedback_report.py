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


USER_SUPPLIED_FEEDBACK_DICT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'report_type',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'category',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'user_feedback_selected_items',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
        }
    }, {
        'name': 'user_feedback_other_text_input',
        'schema': {
            'type': 'unicode'
        }
    }]
}


ANDROID_SYSTEM_CONTEXT_DICT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'platform_version',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'package_version_code',
        'schema': {
            'type': 'int'
        }
    }, {
        'name': 'android_device_country_locale_code',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'android_device_language_locale_code',
        'schema': {
            'type': 'unicode'
        }
    }]
}


ANDROID_DEVICE_CONTEXT_DICT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'android_device_model',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'android_sdk_version',
        'schema': {
            'type': 'int'
        }
    }, {
        'name': 'build_fingerprint',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'network_type',
        'schema': {
            'type': 'unicode'
        }
    }]
}


ENTRY_POINT_DICT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'entry_point_name',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'entry_point_exploration_id',
        'schema': {
            'type': 'unicode_or_none'
        }
    }, {
        'name': 'entry_point_story_id',
        'schema': {
            'type': 'unicode_or_none'
        }
    }, {
        'name': 'entry_point_topic_id',
        'schema': {
            'type': 'unicode_or_none'
        }
    }, {
        'name': 'entry_point_subtopic_id',
        'schema': {
            'type': 'unicode_or_none'
        }
    }]
}


ANDROID_APP_CONTEXT_DICT_SCHEMA = {
    'type': 'dict',
    'properties': [{
        'name': 'entry_point',
        'schema': ENTRY_POINT_DICT_SCHEMA
    }, {
        'name': 'text_language_code',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'audio_language_code',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'text_size',
        'schema': {
            'type': 'unicode'
        }
    }, {
        'name': 'only_allows_wifi_download_and_update',
        'schema': {
            'type': 'bool'
        }
    }, {
        'name': 'automatically_update_topics',
        'schema': {
            'type': 'bool'
        }
    }, {
        'name': 'account_is_profile_admin',
        'schema': {
            'type': 'bool'
        }
    }, {
        'name': 'event_logs',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
        }
    }, {
        'name': 'logcat_logs',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'unicode'
            },
        }
    }]
}


class IncomingAndroidFeedbackReportHandler(base.BaseHandler):
    """Handles incoming android feedback reports from the app."""

    URL_PATH_ARGS_SCHEMAS: Dict[str, Any] = {}
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'report': {
                'schema': {
                    'type': 'dict',
                    'properties': [{
                        'name': 'platform_type',
                        'schema': {
                            'type': 'unicode'
                        }
                    }, {
                        'name': 'android_report_info_schema_version',
                        'schema': {
                            'type': 'int'
                        }
                    }, {
                        'name': 'app_context',
                        'schema': ANDROID_APP_CONTEXT_DICT_SCHEMA
                    }, {
                        'name': 'device_context',
                        'schema': ANDROID_DEVICE_CONTEXT_DICT_SCHEMA
                    }, {
                        'name': 'report_submission_timestamp_sec',
                        'schema': {
                            'type': 'int'
                        }
                    }, {
                        'name': 'report_submission_utc_offset_hrs',
                        'schema': {
                            'type': 'int'
                        }
                    }, {
                        'name': 'system_context',
                        'schema': ANDROID_SYSTEM_CONTEXT_DICT_SCHEMA
                    }, {
                        'name': 'user_supplied_feedback',
                        'schema': USER_SUPPLIED_FEEDBACK_DICT_SCHEMA
                    }]
                }
            }
        }
    }

    @acl_decorators.is_from_oppia_android
    def post(self):
        """Handles POST requests.

        Verifies that the incoming message is from Oppia Android based on the
        request header and stores the feedback report.
        """
        report_dict = self.normalized_payload.get('report')
        report_obj = (
            app_feedback_report_domain.AppFeedbackReport.from_submitted_feedback_dict(  # pylint: disable=line-too-long
                report_dict
            )
        )
        app_feedback_report_services.save_feedback_report_to_storage(
            report_obj, new_incoming_report=True)
        app_feedback_report_services.store_incoming_report_stats(report_obj)

        return self.render_json({})
