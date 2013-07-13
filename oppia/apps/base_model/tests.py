# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Sean Lip'

import test_utils

from oppia.apps.base_model.models import IdModel


class IdModelUnitTests(test_utils.AppEngineTestBase):
    """Test the generic id model."""

    def setUp(self):
        super(IdModelUnitTests, self).setUp()

    def tearDown(self):
        super(IdModelUnitTests, self).tearDown()

    def test_get_error_cases(self):
        """Test the error cases for the get() method."""

        class FakeIdModel(IdModel):
            pass

        with self.assertRaises(IdModel.EntityNotFoundError):
            FakeIdModel.get('Invalid id')
        with self.assertRaises(IdModel.EntityNotFoundError):
            FakeIdModel.get('Invalid id', strict=True)

        # The get() method should fail silently when strict == False.
        self.assertIsNone(FakeIdModel.get('Invalid id', strict=False))
