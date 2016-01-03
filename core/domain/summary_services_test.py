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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import rights_manager
from core.domain import summary_services
import feconf


class ExplorationDisplayableSummaries(
        exp_services_test.ExplorationServicesUnitTests):
    """Test functions for getting displayable exploration summary dicts."""

    ALBERT_EMAIL = 'albert@example.com'
    BOB_EMAIL = 'bob@example.com'
    ALBERT_NAME = 'albert'
    BOB_NAME = 'bob'

    EXP_ID_1 = 'eid1'
    EXP_ID_2 = 'eid2'
    EXP_ID_3 = 'eid3'

    EXPECTED_VERSION_1 = 4
    EXPECTED_VERSION_2 = 2

    def setUp(self):
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Bob edits the title of EXP_ID_1.
        - (3) Albert creates EXP_ID_2.
        - (4) Albert edits the title of EXP_ID_1.
        - (5) Albert edits the title of EXP_ID_2.
        - (6) Bob reverts Albert's last edit to EXP_ID_1.
        - Bob tries to publish EXP_ID_2, and is denied access.
        - (7) Albert publishes EXP_ID_2.
        - (8) Albert creates EXP_ID_3
        - (9) Albert publishes EXP_ID_3
        - (10) Albert deletes EXP_ID_3
        """
        super(ExplorationDisplayableSummaries, self).setUp()

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            }], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            }], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [{
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            }], 'Changed title to Albert2 title.')

        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

        with self.assertRaisesRegexp(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob_id, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert_id, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)

    def test_get_displayable_exp_summary_dicts_matching_ids(self):
        # A list of exp_id's are passed in:
        # EXP_ID_1 -- private exploration
        # EXP_ID_2 -- pubished exploration
        # EXP_ID_3 -- deleted exploration
        # Should only return [EXP_ID_2]

        displayable_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3]))

        self.assertEqual(len(displayable_summaries), 1)
        self.assertEqual(
            displayable_summaries[0]['id'], self.EXP_ID_2)
        self.assertEqual(
            displayable_summaries[0]['status'],
            rights_manager.ACTIVITY_STATUS_PUBLIC)
        self.assertEqual(
            displayable_summaries[0]['community_owned'], False)
        self.assertEqual(
            displayable_summaries[0]['language_code'],
            feconf.DEFAULT_LANGUAGE_CODE)
        self.assertEqual(
            displayable_summaries[0]['category'], 'A category')
        self.assertEqual(
            displayable_summaries[0]['ratings'], feconf.get_empty_ratings())
        self.assertEqual(
            displayable_summaries[0]['title'], 'Exploration 2 Albert title')
        self.assertEqual(
            displayable_summaries[0]['contributor_names'], [self.ALBERT_NAME])
        self.assertEqual(
            displayable_summaries[0]['objective'], 'An objective')
        self.assertEqual(displayable_summaries[0]['num_views'], 0)
        self.assertIn('last_updated_msec', displayable_summaries[0])
