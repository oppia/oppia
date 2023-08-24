# coding: utf-8
#
# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for feature flags."""

from __future__ import annotations

import enum
import json
import re

from core import feconf
from core import utils
from core.constants import constants

from typing import Final, List, TypedDict


class ServerMode(enum.Enum):
    """Enum for server modes."""

    DEV = 'dev'
    TEST = 'test'
    PROD = 'prod'


FeatureStages = ServerMode

ALLOWED_FEATURE_STAGES: Final = [
    FeatureStages.DEV.value,
    FeatureStages.TEST.value,
    FeatureStages.PROD.value
]


class FeatureFlagDict(TypedDict):
    """Dictionary representing FeatureFlag object."""

    name: str
    description: str
    feature_stage: str
    force_enable_for_all_users: bool
    rollout_percentage: int
    user_group_ids: List[str]
    last_updated: str


class FeatureFlag:
    """Domain object for feature-flag."""

    FEATURE_NAME_REGEXP: Final = r'^[A-Za-z0-9_]{1,100}$'

    def __init__(
        self,
        name: str,
        description: str,
        feature_stage: str,
        force_enable_for_all_users: bool,
        rollout_percentage: int,
        user_group_ids: List[str],
        last_updated: str
    ) -> None:
        self._name = name
        self._description = description
        self._feature_stage = feature_stage
        self._force_enable_for_all_users = force_enable_for_all_users
        self._rollout_percentage = rollout_percentage
        self._user_group_ids = user_group_ids
        self._last_updated = last_updated

    @property
    def name(self) -> str:
        """Returns the name of the feature flag.

        Returns:
            str. The name of the feature flag.
        """
        return self._name

    @property
    def description(self) -> str:
        """Returns the description of the feature flag.

        Returns:
            str. The description of the feature flag.
        """
        return self._description

    @property
    def feature_stage(self) -> str:
        """Returns the feature_stage of the feature flag.

        Returns:
            str. The feature_stage of the feature flag.
        """
        return self._feature_stage

    @property
    def force_enable_for_all_users(self) -> bool:
        """Returns the force_enable_for_all_users of the feature flag.

        Returns:
            str. The force_enable_for_all_users of the feature flag.
        """
        return self._force_enable_for_all_users

    @property
    def rollout_percentage(self) -> int:
        """Returns the rollout_percentage of the feature flag.

        Returns:
            str. The rollout_percentage of the feature flag.
        """
        return self._rollout_percentage

    @property
    def user_group_ids(self) -> List[str]:
        """Returns the user_group_ids of the feature flag.

        Returns:
            str. The user_group_ids of the feature flag.
        """
        return self._user_group_ids

    @property
    def last_updated(self) -> str:
        """Returns the last_updated of the feature flag.

        Returns:
            str. The last_updated of the feature flag.
        """
        return self._last_updated

    def _get_server_mode(self) -> ServerMode:
        """Returns the current server mode.

        Returns:
            ServerMode. The current server mode.
        """
        return (
            ServerMode.DEV
            if constants.DEV_MODE
            else ServerMode.PROD
            if feconf.ENV_IS_OPPIA_ORG_PRODUCTION_SERVER
            else ServerMode.TEST
        )

    def validate(self) -> None:
        """Validates the FeatureFlag object."""
        if re.match(self.FEATURE_NAME_REGEXP, self._name) is None:
            raise utils.ValidationError(
                'Invalid feature name \'%s\', expected to match regexp '
                '%s.' % (self._name, self.FEATURE_NAME_REGEXP))

        if not any(
            self._feature_stage == feature_stage
            for feature_stage in ALLOWED_FEATURE_STAGES
        ):
            raise utils.ValidationError(
                'Invalid feature stage, got \'%s\', expected one of %s.' % (
                    self._feature_stage, ALLOWED_FEATURE_STAGES))

        server_mode = self._get_server_mode()
        if (
            server_mode == ServerMode.TEST and
            self._feature_stage == ServerMode.DEV.value
        ):
            raise utils.ValidationError(
                'Feature in %s stage cannot be updated in %s environment.' % (
                    self._feature_stage, server_mode.value
                )
            )
        if (
            server_mode == ServerMode.PROD and
            self._feature_stage in (ServerMode.DEV.value, ServerMode.TEST.value)
        ):
            raise utils.ValidationError(
                'Feature in %s stage cannot be updated in %s environment.' % (
                    self._feature_stage, server_mode.value
                )
            )

    def to_dict(self) -> FeatureFlagDict:
        """Returns a dict representation of the FeatureFlag domain object.

        Returns:
            dict. A dict mapping of all fields of FeatureFlag object.
        """
        return {
            'name': self._name,
            'description': self._description,
            'feature_stage': self._feature_stage,
            'force_enable_for_all_users': self._force_enable_for_all_users,
            'rollout_percentage': self._rollout_percentage,
            'user_group_ids': self._user_group_ids,
            'last_updated': self._last_updated
        }

    @classmethod
    def from_dict(cls, feature_dict: FeatureFlagDict) -> FeatureFlag:
        """Returns an FeatureFlag object from dictionary.

        Args:
            feature_dict: dict. A dict mapping of all fields of
                FeatureFlag object.

        Returns:
            FeatureFlag. The corresponding FeatureFlag domain object.
        """
        return cls(
            feature_dict['name'],
            feature_dict['description'],
            feature_dict['feature_stage'],
            feature_dict['force_enable_for_all_users'],
            feature_dict['rollout_percentage'],
            feature_dict['user_group_ids'],
            feature_dict['last_updated']
        )

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded string encoding all of the information composing
            the object.
        """
        feature_flag_dict = self.to_dict()
        return json.dumps(feature_flag_dict)

    @classmethod
    def deserialize(cls, json_string: str) -> FeatureFlag:
        """Returns a FeatureFlag domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a FeatureFlag.
                Only call on strings that were created using serialize().

        Returns:
            FeatureFlag. The corresponding FeatureFlag domain object.
        """
        feature_flag_dict = json.loads(json_string)
        feature_flag = cls.from_dict(feature_flag_dict)
        return feature_flag
