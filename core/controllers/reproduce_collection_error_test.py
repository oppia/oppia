# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Reproduction test for collection summaries error."""

from __future__ import annotations

from core.domain import rights_manager, user_services
from core.tests import test_utils


class CollectionSummariesErrorTest(test_utils.GenericTestBase):
    """Test class for collection summaries error."""

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_default_collection(
            'col_id', self.owner_id, title='A title', category='A category')
        rights_manager.publish_collection(self.owner, 'col_id')

    def test_missing_collection_ids(self) -> None:
        """Test missing collection ids."""
        # Request without stringified_collection_ids.
        self.get_json(
            '/collectionsummarieshandler/data',
            params={},
            expected_status_int=400
        )

    def test_invalid_json(self) -> None:
        """Test invalid JSON."""
        # Request with invalid JSON.
        self.get_json(
            '/collectionsummarieshandler/data',
            params={'stringified_collection_ids': 'invalid_json'},
            expected_status_int=400
        )

    def test_valid_request(self) -> None:
        """Test valid request."""
        # Request with valid params.
        self.get_json(
            '/collectionsummarieshandler/data',
            params={'stringified_collection_ids': '["col_id"]'}
        )
