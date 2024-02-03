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

import datetime
import enum
import re

from core import feconf
from core import utils
from core.constants import constants

from typing import Final, List, Optional, TypedDict


class ServerMode(enum.Enum):
    """Enum for server modes."""

    DEV = 'dev'
    TEST = 'test'
    PROD = 'prod'


FeatureStages = ServerMode


def get_server_mode() -> ServerMode:
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


class FeatureFlagDict(TypedDict):
    """Dictionary representing FeatureFlag object."""

    name: str
    description: str
    feature_stage: str
    force_enable_for_all_users: bool
    rollout_percentage: int
    user_group_ids: List[str]
    last_updated: Optional[str]


class FeatureFlag:
    """FeatureFlag domain object."""

    FEATURE_NAME_REGEXP: Final = r'^[A-Za-z0-9_]{1,100}$'

    def __init__(
        self,
        name: str,
        feature_flag_spec: FeatureFlagSpec,
        feature_flag_config: FeatureFlagConfig
    ):
        self._name = name
        self._feature_flag_spec = feature_flag_spec
        self._feature_flag_config = feature_flag_config

    @property
    def name(self) -> str:
        """Returns the name of the feature flag.

        Returns:
            str. The name of the feature flag.
        """
        return self._name

    @property
    def feature_flag_spec(self) -> FeatureFlagSpec:
        """The FeatureFlagSpec property of FeatureFlag."""
        return self._feature_flag_spec

    @property
    def feature_flag_config(self) -> FeatureFlagConfig:
        """The FeatureFlagConfig property of FeatureFlag."""
        return self._feature_flag_config

    def validate(self) -> None:
        """Validates the FeatureFlag object."""
        if re.match(self.FEATURE_NAME_REGEXP, self._name) is None:
            raise utils.ValidationError(
                'Invalid feature flag name \'%s\', expected to match regexp '
                '%s.' % (self._name, self.FEATURE_NAME_REGEXP))

        self._feature_flag_config.validate(
            self._feature_flag_spec.feature_stage)

    def to_dict(self) -> FeatureFlagDict:
        """Returns a dict representation of the FeatureFlag domain object.

        Returns:
            dict. A dict mapping of all fields of FeatureFlag object.
        """
        last_updated = utils.convert_naive_datetime_to_string(
            self._feature_flag_config.last_updated
        ) if self._feature_flag_config.last_updated else None
        return {
            'name': self._name,
            'description': self._feature_flag_spec.description,
            'feature_stage': self._feature_flag_spec.feature_stage.value,
            'force_enable_for_all_users': (
                self._feature_flag_config.force_enable_for_all_users),
            'rollout_percentage': self._feature_flag_config.rollout_percentage,
            'user_group_ids': self._feature_flag_config.user_group_ids,
            'last_updated': last_updated
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
        feature_flag_spec = FeatureFlagSpec.from_dict({
            'description': feature_dict['description'],
            'feature_stage': feature_dict['feature_stage']
        })
        feature_flag_config = FeatureFlagConfig.from_dict({
            'force_enable_for_all_users': feature_dict[
                'force_enable_for_all_users'],
            'rollout_percentage': feature_dict['rollout_percentage'],
            'user_group_ids': feature_dict['user_group_ids'],
            'last_updated': feature_dict['last_updated']
        })

        return cls(
            feature_dict['name'],
            feature_flag_spec,
            feature_flag_config
        )


class FeatureFlagSpecDict(TypedDict):
    """Dictionary representing FeatureFlagSpec object."""

    description: str
    feature_stage: str


class FeatureFlagSpec:
    """The FeatureFlagSpec domain object."""

    def __init__(
        self,
        description: str,
        feature_stage: ServerMode
    ) -> None:
        self._description = description
        self._feature_stage = feature_stage

    @property
    def description(self) -> str:
        """Returns the description of the feature flag.

        Returns:
            str. The description of the feature flag.
        """
        return self._description

    @property
    def feature_stage(self) -> ServerMode:
        """Returns the feature_stage of the feature flag.

        Returns:
            ServerMode. The feature_stage of the feature flag.
        """
        return self._feature_stage

    def to_dict(self) -> FeatureFlagSpecDict:
        """Returns a dict representation of the FeatureFlagSpec domain object.

        Returns:
            dict. A dict mapping of all fields of FeatureFlagSpec object.
        """
        return {
            'description': self._description,
            'feature_stage': self._feature_stage.value
        }

    @classmethod
    def from_dict(cls, feature_dict: FeatureFlagSpecDict) -> FeatureFlagSpec:
        """Returns an FeatureFlagSpec object from dictionary.

        Args:
            feature_dict: dict. A dict mapping of all fields of
                FeatureFlagSpec object.

        Returns:
            FeatureFlagSpec. The corresponding FeatureFlagSpec domain object.

        Raises:
            Exception. Invalid feature stage.
        """
        if feature_dict['feature_stage'] == 'dev':
            feature_stage = ServerMode.DEV
        elif feature_dict['feature_stage'] == 'test':
            feature_stage = ServerMode.TEST
        elif feature_dict['feature_stage'] == 'prod':
            feature_stage = ServerMode.PROD
        else:
            raise Exception(
                'Invalid feature stage, should be one of ServerMode.DEV, '
                'ServerMode.TEST or ServerMode.PROD.')

        return cls(
            feature_dict['description'],
            feature_stage
        )


class FeatureFlagConfigDict(TypedDict):
    """Dictionary representing FeatureFlagConfig object."""

    force_enable_for_all_users: bool
    rollout_percentage: int
    user_group_ids: List[str]
    last_updated: Optional[str]


class FeatureFlagConfig:
    """The FeatureFlagConfig domain object."""

    def __init__(
        self,
        force_enable_for_all_users: bool,
        rollout_percentage: int,
        user_group_ids: List[str],
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        self._force_enable_for_all_users = force_enable_for_all_users
        self._rollout_percentage = rollout_percentage
        self._user_group_ids = user_group_ids
        self._last_updated = last_updated

    @property
    def force_enable_for_all_users(self) -> bool:
        """Returns the force_enable_for_all_users field of the feature flag.

        Returns:
            str. The force_enable_for_all_users field of the feature flag.
        """
        return self._force_enable_for_all_users

    def set_force_enable_for_all_users(
        self, force_enable_for_all_users: bool
    ) -> None:
        """Sets the force_enable_for_all_users of FeatureFlagConfig.

        Args:
            force_enable_for_all_users: bool. The new value of
                force_enable_for_all_users.
        """
        self._force_enable_for_all_users = force_enable_for_all_users

    @property
    def rollout_percentage(self) -> int:
        """Returns the rollout_percentage field of the feature flag.

        Returns:
            str. The rollout_percentage field of the feature flag.
        """
        return self._rollout_percentage

    def set_rollout_percentage(self, rollout_percentage: int) -> None:
        """Sets the rollout_percentage of FeatureFlagConfig.

        Args:
            rollout_percentage: int. The new value of rollout_percentage.
        """
        self._rollout_percentage = rollout_percentage

    @property
    def user_group_ids(self) -> List[str]:
        """Returns the user_group_ids of the feature flag.

        Returns:
            str. The user_group_ids of the feature flag.
        """
        return self._user_group_ids

    def set_user_group_ids(self, user_group_ids: List[str]) -> None:
        """Sets the user_group_ids of FeatureFlagConfig.

        Args:
            user_group_ids: List[str]. The new value of user_group_ids.
        """
        self._user_group_ids = user_group_ids

    @property
    def last_updated(self) -> Optional[datetime.datetime]:
        """Returns the last_updated field of the feature flag.
        Date when the model was last updated, or None if there is no model
        for this feature flag in the datastore.

        Returns:
            Optional[datetime.datetime]. The last_updated of the feature flag.
        """
        return self._last_updated

    def set_last_updated(self, last_updated: datetime.datetime) -> None:
        """Sets the last_updated field of the FeatureFlagConfig.

        Args:
            last_updated: datetime.datetime. The new value of last_updated.
        """
        self._last_updated = last_updated

    def validate(self, feature_stage: ServerMode) -> None:
        """Validates the FeatureFlagConfig object."""
        if self._rollout_percentage < 0 or self._rollout_percentage > 100:
            raise utils.ValidationError(
                'Feature flag rollout-percentage should be between '
                '0 and 100 inclusive.')

        server_mode = get_server_mode()
        if (
            server_mode == ServerMode.TEST and
            feature_stage == ServerMode.DEV
        ):
            raise utils.ValidationError(
                'Feature flag in %s stage cannot be updated '
                'in %s environment.' % (
                    feature_stage.value, server_mode.value
                )
            )
        if (
            server_mode == ServerMode.PROD and
            feature_stage in (ServerMode.DEV, ServerMode.TEST)
        ):
            raise utils.ValidationError(
                'Feature flag in %s stage cannot be updated '
                'in %s environment.' % (
                    feature_stage.value, server_mode.value
                )
            )

    def to_dict(self) -> FeatureFlagConfigDict:
        """Returns a dict representation of the FeatureFlagConfig domain object.

        Returns:
            dict. A dict mapping of all fields of FeatureFlagConfig object.
        """
        last_updated = utils.convert_naive_datetime_to_string(
            self.last_updated) if self.last_updated else None
        return {
            'force_enable_for_all_users': self._force_enable_for_all_users,
            'rollout_percentage': self._rollout_percentage,
            'user_group_ids': self._user_group_ids,
            'last_updated': last_updated
        }

    @classmethod
    def from_dict(
        cls, feature_flag_config_dict: FeatureFlagConfigDict
    ) -> FeatureFlagConfig:
        """Returns an FeatureFlagConfig object from dictionary.

        Args:
            feature_flag_config_dict: dict. A dict mapping of all fields of
                FeatureFlagConfig object.

        Returns:
            FeatureFlagConfig. The corresponding FeatureFlagConfig domain
            object.
        """
        last_updated = utils.convert_string_to_naive_datetime_object(
            feature_flag_config_dict['last_updated']
        ) if isinstance(feature_flag_config_dict['last_updated'], str) else None
        return cls(
            feature_flag_config_dict['force_enable_for_all_users'],
            feature_flag_config_dict['rollout_percentage'],
            feature_flag_config_dict['user_group_ids'],
            last_updated
        )
