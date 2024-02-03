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

"""Controllers for the release coordinator page."""

from __future__ import annotations

import logging

from core import feconf
from core import utils
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import caching_services
from core.domain import feature_flag_domain
from core.domain import feature_flag_services as feature_services

from typing import Dict, List, TypedDict


class MemoryCacheHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Handler for memory cache profile."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {
        'GET': {},
        'DELETE': {}
    }

    @acl_decorators.can_manage_memcache
    def get(self) -> None:
        """Retrieves statistics about the memory cache."""
        cache_stats = caching_services.get_memory_cache_stats()
        self.render_json({
            'total_allocation': cache_stats.total_allocated_in_bytes,
            'peak_allocation': cache_stats.peak_memory_usage_in_bytes,
            'total_keys_stored': cache_stats.total_number_of_keys_stored
        })

    @acl_decorators.can_manage_memcache
    def delete(self) -> None:
        """Flushes the memory cache."""
        caching_services.flush_memory_caches()
        self.render_json({})


class FeatureFlagsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of FeatureFlag's normalized_payload
    dictionary.
    """

    action: str
    feature_flag_name: str
    force_enable_for_all_users: bool
    rollout_percentage: int
    user_group_ids: List[str]


class FeatureFlagsHandler(
    base.BaseHandler[
        FeatureFlagsHandlerNormalizedPayloadDict, Dict[str, str]]
):
    """Handler for feature-flags."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'PUT': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'update_feature_flag'
                    ]
                },
                'default_value': None
            },
            'feature_flag_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'force_enable_for_all_users': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': None
            },
            'rollout_percentage': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        'min_value': 0
                    }, {
                        'id': 'is_at_most',
                        'max_value': 100
                    }]
                },
                'default_value': None
            },
            'user_group_ids': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'unicode'
                    }
                },
                'default_value': None
            }
        }
    }

    @acl_decorators.can_access_release_coordinator_page
    def get(self) -> None:
        """Handles GET requests."""
        feature_flags = feature_services.get_all_feature_flags()
        feature_flags_dict = []
        for feature_flag in feature_flags:
            feature_flags_dict.append(feature_flag.to_dict())
        self.render_json({
            'feature_flags': feature_flags_dict,
            'server_stage': feature_flag_domain.get_server_mode().value
        })

    @acl_decorators.can_access_release_coordinator_page
    def put(self) -> None:
        """Handles PUT requests."""
        assert self.normalized_payload is not None
        action = self.normalized_payload.get('action')
        try:
            # The handler schema defines the possible values of 'action'.
            # If 'action' has a value other than those defined in the
            # schema, a Bad Request error will be thrown. Hence, 'action'
            # must be 'update_feature_flag' if this branch is
            # executed.
            assert action == 'update_feature_flag'
            feature_flag_name = self.normalized_payload.get('feature_flag_name')
            if feature_flag_name is None:
                raise Exception(
                    'The \'feature_flag_name\' must be provided when the action'
                    ' is update_feature_flag.'
                )

            force_enable_for_all_users = self.normalized_payload.get(
                'force_enable_for_all_users')
            # Ruling out the possibility of any other type for mypy
            # type checking.
            assert force_enable_for_all_users is not None
            rollout_percentage = self.normalized_payload.get(
                'rollout_percentage')
            # Ruling out the possibility of any other type for mypy
            # type checking.
            assert rollout_percentage is not None
            user_group_ids = self.normalized_payload.get('user_group_ids')
            # Ruling out the possibility of any other type for mypy
            # type checking.
            assert user_group_ids is not None
            try:
                feature_services.update_feature_flag(
                    feature_flag_name,
                    force_enable_for_all_users,
                    rollout_percentage,
                    user_group_ids
                )
            except (
                    utils.ValidationError,
                    feature_services.FeatureFlagNotFoundException) as e:
                raise self.InvalidInputException(e)

            logging.info(
                '[RELEASE-COORDINATOR] %s updated feature %s with new values: '
                'rollout_percentage - %d, force_enable_for_all_users - %s, '
                'user_group_ids - %s.' % (
                    self.user_id, feature_flag_name,
                    rollout_percentage,
                    force_enable_for_all_users,
                    user_group_ids)
                )
            self.render_json(self.values)
        except Exception as e:
            logging.exception('[RELEASE-COORDINATOR] %s', e)
            self.render_json({'error': str(e)})
            raise e
