# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Tests for exploration rights domain objects and methods defined on them."""

from __future__ import annotations

from core import utils
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils


class ExplorationRightsTests(test_utils.GenericTestBase):

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.signup(self.VIEWER_EMAIL, self.VIEWER_USERNAME)
        self.viewer_id = self.get_user_id_from_email(self.VIEWER_EMAIL)
        self.viewer = user_services.get_user_actions_info(self.viewer_id)

        self.exp_id = 'exp_id'
        self.save_new_valid_exploration(self.exp_id, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.exp_id)
        self.exploration_rights = rights_manager.get_exploration_rights(
            self.exp_id)

    def test_validation_passes_with_valid_properties(self) -> None:
        self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_community_owned(
        self
    ) -> None:
        self.exploration_rights.community_owned = 'owned'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected community_owned to be bool, received owned'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_owner_ids(self) -> None:
        self.exploration_rights.owner_ids = 'owner_id_1'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected owner_ids to be list, received owner_id_1'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_non_string_owner_id(self) -> None:
        self.exploration_rights.owner_ids = [123]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in owner_ids to be string, received 123'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_editor_ids(self) -> None:
        self.exploration_rights.editor_ids = 'editor'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected editor_ids to be list, received editor'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_non_string_editor_id(self) -> None:
        self.exploration_rights.editor_ids = [True]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in editor_ids to be string, received True'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_voice_artist_ids(
        self
    ) -> None:
        self.exploration_rights.voice_artist_ids = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected voice_artist_ids to be list, received 123'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_non_string_voice_artist_id(self) -> None:
        self.exploration_rights.voice_artist_ids = [None]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in voice_artist_ids to be string, '
            'received None'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_viewer_ids(self) -> None:
        self.exploration_rights.viewer_ids = 123  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected viewer_ids to be list, received 123'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_non_string_viewer_id(self) -> None:
        self.exploration_rights.viewer_ids = [{}]  # type: ignore[list-item]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected each id in viewer_ids to be string, received {}'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_invalid_type_of_viewable_if_private(
        self
    ) -> None:
        self.exploration_rights.viewable_if_private = 'yes'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected viewable_if_private to be boolean, received yes'):
            self.exploration_rights.validate()

    def test_validation_fails_with_invalid_status(self) -> None:
        self.exploration_rights.status = 'archived'
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected status to be either "private" or "public", '
            'received "archived"'):
            self.exploration_rights.validate()

    def test_validation_fails_with_negative_first_published_msec(self) -> None:
        self.exploration_rights.first_published_msec = -123.456
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected first_published_msec to be non-negative, '
            'received -123.456'):
            self.exploration_rights.validate()

    # TODO(#13059): Here we use MyPy ignore because after we fully type
    # the codebase we plan to get rid of the tests that intentionally test
    # wrong inputs that we can normally catch by typing.
    def test_validation_fails_with_non_float_first_published_msec(
        self
    ) -> None:
        self.exploration_rights.first_published_msec = '123'  # type: ignore[assignment]
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected first_published_msec to be a float, received 123'):
            self.exploration_rights.validate()
