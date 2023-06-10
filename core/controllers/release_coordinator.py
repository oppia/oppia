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
from core.domain import platform_feature_services as feature_services
from core.domain import platform_parameter_domain as parameter_domain

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
        cache_stats = caching_services.get_memory_cache_stats()
        self.render_json({
            'total_allocation': cache_stats.total_allocated_in_bytes,
            'peak_allocation': cache_stats.peak_memory_usage_in_bytes,
            'total_keys_stored': cache_stats.total_number_of_keys_stored
        })

    @acl_decorators.can_manage_memcache
    def delete(self) -> None:
        caching_services.flush_memory_caches()
        self.render_json({})


class FeatureFlagsHandlerNormalizedPayloadDict(TypedDict):
    """Dict representation of FeatureFlag's normalized_payload
    dictionary.
    """

    action: str
    feature_name: str
    commit_message: str
    new_rules: List[parameter_domain.PlatformParameterRule]


class FeatureFlagsHandler(
    base.BaseHandler[
        FeatureFlagsHandlerNormalizedPayloadDict, Dict[str, str]]
):
    """Handler for feature-flags."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS: Dict[str, str] = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'POST': {
            'action': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        'update_feature_flag_rules'
                    ]
                },
                'default_value': None
            },
            'feature_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'new_rules': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': parameter_domain.PlatformParameterRule
                    }
                },
                'default_value': None
            },
        }
    }

    @acl_decorators.can_access_release_coordinator_page
    def get(self) -> None:
        """Handles GET requests."""
        feature_flag_dicts = feature_services.get_all_feature_flag_dicts()
        self.render_json({
            'feature_flags': feature_flag_dicts,
        })

    @acl_decorators.can_access_release_coordinator_page
    def post(self) -> None:
        """Handles POST requests."""
        assert self.normalized_payload is not None
        action = self.normalized_payload.get('action')
        try:
            # The handler schema defines the possible values of 'action'.
            # If 'action' has a value other than those defined in the
            # schema, a Bad Request error will be thrown. Hence, 'action'
            # must be 'update_feature_flag_rules' if this branch is
            # executed.
            assert action == 'update_feature_flag_rules'
            feature_name = self.normalized_payload.get('feature_name')
            if feature_name is None:
                raise Exception(
                    'The \'feature_name\' must be provided when the action'
                    ' is update_feature_flag_rules.'
                )
            new_rules = self.normalized_payload.get('new_rules')
            if new_rules is None:
                raise Exception(
                    'The \'new_rules\' must be provided when the action'
                    ' is update_feature_flag_rules.'
                )
            commit_message = self.normalized_payload.get('commit_message')
            if commit_message is None:
                raise Exception(
                    'The \'commit_message\' must be provided when the '
                    'action is update_feature_flag_rules.'
                )

            assert self.user_id is not None
            try:
                feature_services.update_feature_flag_rules(
                    feature_name, self.user_id, commit_message,
                    new_rules)
            except (
                    utils.ValidationError,
                    feature_services.FeatureFlagNotFoundException) as e:
                raise self.InvalidInputException(e)

            new_rule_dicts = [rule.to_dict() for rule in new_rules]
            logging.info(
                '[RELEASE-COORDINATOR] %s updated feature %s with new rules: '
                '%s.' % (self.user_id, feature_name, new_rule_dicts))
            self.render_json(self.values)
        except Exception as e:
            logging.exception('[RELEASE-COORDINATOR] %s', e)
            self.render_json({'error': str(e)})
            raise e
