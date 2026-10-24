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

"""Domain objects for Android feature flags."""

from __future__ import annotations

import enum
import json

from core import utils

import packaging.version
from typing import Optional, TypedDict, cast


class AndroidFeatureFlagState(enum.Enum):
    """States for an Android feature flag."""

    LIVE = 'live'
    FINAL = 'final'


class AndroidFeatureFlagConfigDict(TypedDict):
    """Dictionary representing an Android feature-flag configuration."""

    state: str
    min_app_version: str
    max_app_version: Optional[str]
    rollout_percentage: int


class AndroidFeatureFlagConfig:
    """Domain representation of an Android feature-flag configuration."""

    def __init__(
        self,
        state: AndroidFeatureFlagState,
        min_app_version: str,
        max_app_version: Optional[str],
        rollout_percentage: int,
    ) -> None:
        self._state = state
        self._min_app_version = min_app_version
        self._max_app_version = max_app_version
        self._rollout_percentage = rollout_percentage

    @property
    def state(self) -> AndroidFeatureFlagState:
        """Returns the state field of the android feature flag.

        Returns:
            AndroidFeatureFlagState. The state field of the android feature flag.
        """
        return self._state

    def set_state(self, state: AndroidFeatureFlagState) -> None:
        """Sets the state of AndroidFeatureFlagConfig.

        Args:
            state: AndroidFeatureFlagState. The new value of state.
        """
        self._state = state

    @property
    def min_app_version(self) -> str:
        """Returns the min_app_version field of the android feature flag.

        Returns:
            str. The min_app_version field of the android feature flag.
        """
        return self._min_app_version

    def set_min_app_version(self, min_app_version: str) -> None:
        """Sets the min_app_version of AndroidFeatureFlagConfig.

        Args:
            min_app_version: str. The new value of min_app_version.
        """
        self._min_app_version = min_app_version

    @property
    def max_app_version(self) -> Optional[str]:
        """Returns the max_app_version field of the android feature flag.

        Returns:
            Optional[str]. The max_app_version field of the android feature flag.
        """
        return self._max_app_version

    def set_max_app_version(self, max_app_version: Optional[str]) -> None:
        """Sets the max_app_version of AndroidFeatureFlagConfig.

        Args:
            max_app_version: Optional[str]. The new value of max_app_version.
        """
        self._max_app_version = max_app_version

    @property
    def rollout_percentage(self) -> int:
        """Returns the rollout_percentage field of the android feature flag.

        Returns:
            int. The rollout_percentage field of the android feature flag.
        """
        return self._rollout_percentage

    def set_rollout_percentage(self, rollout_percentage: int) -> None:
        """Sets the rollout_percentage of AndroidFeatureFlagConfig.

        Args:
            rollout_percentage: int. The new value of rollout_percentage.
        """
        self._rollout_percentage = rollout_percentage

    def validate(self) -> None:
        """Validates the Android feature-flag configuration."""
        if not isinstance(self._state, AndroidFeatureFlagState):
            raise utils.ValidationError(
                'Invalid Android feature flag state: %r.' % self._state
            )

        if self._min_app_version is None:
            raise utils.ValidationError('Minimum app version cannot be None.')

        if not isinstance(self._min_app_version, str):
            raise utils.ValidationError('Minimum app version must be a string.')

        if self._max_app_version is not None and (
            not isinstance(self._max_app_version, str)
        ):
            raise utils.ValidationError(
                'Maximum app version must be a string or None.'
            )

        try:
            min_app_version = packaging.version.Version(self._min_app_version)
            max_app_version = (
                packaging.version.Version(self._max_app_version)
                if self._max_app_version is not None
                else None
            )
        except packaging.version.InvalidVersion as error:
            raise utils.ValidationError(
                'Android app versions must be valid version strings.'
            ) from error

        if max_app_version is not None and min_app_version > max_app_version:
            raise utils.ValidationError(
                'Minimum app version cannot exceed maximum app version.'
            )

        if (
            not isinstance(self._rollout_percentage, int)
            or isinstance(self._rollout_percentage, bool)
            or self._rollout_percentage < 0
            or self._rollout_percentage > 100
        ):
            raise utils.ValidationError(
                'Android feature flag rollout percentage must be integer between '
                '0 and 100 inclusive.'
            )

    def to_dict(self) -> AndroidFeatureFlagConfigDict:
        """Returns a dict representation of the AndroidFeatureFlagConfig domain object.

        Returns:
            dict. A dict mapping of all fields of AndroidFeatureFlagConfig object.
        """
        return {
            'state': self._state.value,
            'min_app_version': self._min_app_version,
            'max_app_version': self._max_app_version,
            'rollout_percentage': self._rollout_percentage,
        }

    @classmethod
    def from_dict(
        cls, android_feature_flag_config_dict: AndroidFeatureFlagConfigDict
    ) -> AndroidFeatureFlagConfig:
        """Returns an AndroidFeatureFlagConfig object from dictionary.

        Args:
            android_feature_flag_config_dict: dict. A dict mapping of all fields of
                AndroidFeatureFlagConfig object.

        Returns:
            AndroidFeatureFlagConfig. The corresponding AndroidFeatureFlagConfig domain
            object.
        """
        try:
            state = AndroidFeatureFlagState(
                android_feature_flag_config_dict['state']
            )
        except (TypeError, ValueError) as error:
            raise utils.ValidationError(
                'Invalid Android feature flag state: %r.'
                % android_feature_flag_config_dict['state']
            ) from error

        config = cls(
            state,
            android_feature_flag_config_dict['min_app_version'],
            android_feature_flag_config_dict['max_app_version'],
            android_feature_flag_config_dict['rollout_percentage'],
        )
        config.validate()
        return config

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information
            composing the object.
        """
        return json.dumps(self.to_dict())

    @classmethod
    def deserialize(cls, json_string: str) -> AndroidFeatureFlagConfig:
        """Returns an AndroidFeatureFlagConfig object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing an AndroidFeatureFlagConfig.
                Only call on strings that were created using serialize().

        Returns:
            AndroidFeatureFlagConfig. The corresponding AndroidFeatureFlagConfig domain object.
        """
        # Here we use cast because json.loads returns Any, and this method is
        # documented to receive data produced by serialize().
        config_dict = cast(
            AndroidFeatureFlagConfigDict, json.loads(json_string)
        )
        return cls.from_dict(config_dict)
