# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Controllers for Android release coordination."""

from __future__ import annotations

from core import feconf, utils
from core.controllers import acl_decorators, base
from core.domain import (
    android_feature_flag_registry,
    android_feature_flag_services,
)

from typing import Dict, Optional, TypedDict


class AndroidFeatureFlagsAdminHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of the normalized Android feature-flag payload."""

    min_app_version: Optional[str]
    max_app_version: Optional[str]
    rollout_percentage: Optional[int]


class AndroidFeatureFlagsAdminHandler(
    base.BaseHandler[
        AndroidFeatureFlagsAdminHandlerNormalizedPayloadDict, Dict[str, str]
    ]
):
    """Handler for Android feature-flag administration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'feature_flag_name': {
            'schema': {'type': 'basestring'},
            'default_value': None,
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'min_app_version': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'max_app_version': {
                'schema': {'type': 'basestring'},
                'default_value': None,
            },
            'rollout_percentage': {
                'schema': {
                    'type': 'int',
                    'validators': [
                        {'id': 'is_at_least', 'min_value': 0},
                        {'id': 'is_at_most', 'max_value': 100},
                    ],
                },
                'default_value': None,
            },
        },
    }

    @acl_decorators.can_access_android_release_coordinator_page
    def get(self, feature_flag_name: Optional[str] = None) -> None:
        """Returns all registered Android feature-flag configurations."""
        if feature_flag_name is not None:
            raise self.NotFoundException(
                'Android feature flag configurations are only available at '
                'the collection endpoint.'
            )
        feature_flag_names = (
            android_feature_flag_registry.Registry.get_all_feature_flag_names()
        )
        feature_flags = (
            android_feature_flag_services.get_all_android_feature_flags()
        )
        self.render_json(
            {
                'feature_flags': [
                    {'name': name, **feature_flag.to_dict()}
                    for name, feature_flag in zip(
                        feature_flag_names, feature_flags, strict=True
                    )
                ]
            }
        )

    @acl_decorators.can_access_android_release_coordinator_page
    def put(self, feature_flag_name: Optional[str] = None) -> None:
        """Updates the specified Android feature-flag configuration."""
        if feature_flag_name is None:
            raise self.InvalidInputException(
                'An Android feature flag name must be provided.'
            )
        assert self.normalized_payload is not None
        min_app_version = self.normalized_payload.get('min_app_version')
        max_app_version = self.normalized_payload.get('max_app_version')
        rollout_percentage = self.normalized_payload.get('rollout_percentage')
        if (
            min_app_version is None
            and max_app_version is None
            and rollout_percentage is None
        ):
            raise self.InvalidInputException(
                'At least one Android feature-flag configuration field must '
                'be provided.'
            )

        if feature_flag_name not in (
            android_feature_flag_registry.Registry.get_all_feature_flag_names()
        ):
            raise self.InvalidInputException(
                'Unknown Android feature flag: %s.' % feature_flag_name
            )

        try:
            android_feature_flag_services.update_android_feature_flag(
                feature_flag_name=feature_flag_name,
                min_app_version=min_app_version,
                max_app_version=max_app_version,
                rollout_percentage=rollout_percentage,
            )
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        self.render_json({})
