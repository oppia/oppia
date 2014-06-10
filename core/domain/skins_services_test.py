# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for skin services."""

__author__ = 'Sean Lip'

from core.domain import skins_services
import test_utils


class DefaultSkinsUnitTests(test_utils.GenericTestBase):
    """Tests for the default skins."""

    def test_get_all_skin_ids(self):
        self.assertEqual(
            sorted(skins_services.Registry.get_all_skin_classes().keys()),
            ['conversation_v1', 'snapshots_v1'])

    def test_default_skins_are_present(self):
        conversation_skin = skins_services.Registry.get_skin_html(
            'conversation_v1')
        self.assertIn('Conversation.js', conversation_skin)
        self.assertIn('conversation.css', conversation_skin)

        snapshots_skin = skins_services.Registry.get_skin_html('snapshots_v1')
        self.assertIn('Snapshots.js', snapshots_skin)

    def test_nonexistent_skins_raise_error(self):
        with self.assertRaises(Exception):
            skins_services.Registry.get_skin_html('nonexistent')
