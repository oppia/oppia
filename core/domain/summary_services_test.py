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

"""Unit tests for core.domain.summary_services."""

from __future__ import annotations

from core import feconf
from core import utils
from core.constants import constants
from core.domain import activity_domain
from core.domain import activity_services
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import summary_services
from core.domain import user_services
from core.tests import test_utils

from typing import Final


class ExplorationDisplayableSummariesTest(
        exp_services_test.ExplorationServicesUnitTests):
    """Test functions for getting displayable exploration summary dicts."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    BOB_NAME: Final = 'bob'

    USER_C_NAME: Final = 'c'
    USER_D_NAME: Final = 'd'
    USER_C_EMAIL: Final = 'c@example.com'
    USER_D_EMAIL: Final = 'd@example.com'

    USER_C_PROFILE_PICTURE: Final = 'c_profile_picture'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    EXP_ID_3: Final = 'eid3'
    EXP_ID_4: Final = 'eid4'
    EXP_ID_5: Final = 'eid5'

    EXPECTED_VERSION_1: Final = 4
    EXPECTED_VERSION_2: Final = 2

    def setUp(self) -> None:
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

        - (1) User_3 (has a profile_picture) creates EXP_ID_4.
        - (2) User_4 edits the title of EXP_ID_4.
        - (3) User_4 edits the title of EXP_ID_4.
        """

        super().setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

        self.albert = user_services.get_user_actions_info(self.albert_id)
        self.bob = user_services.get_user_actions_info(self.bob_id)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)

        exp_services.update_exploration(
            self.bob_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 title'
            })], 'Changed title.')

        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 1 Albert title'
            })], 'Changed title to Albert1 title.')

        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration 2 Albert title'
            })], 'Changed title to Albert2 title.')

        exp_services.revert_exploration(self.bob_id, self.EXP_ID_1, 3, 2)

        with self.assertRaisesRegex(
            Exception, 'This exploration cannot be published'
            ):
            rights_manager.publish_exploration(self.bob, self.EXP_ID_2)

        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_3)
        exp_services.delete_exploration(self.albert_id, self.EXP_ID_3)
        self.signup(self.USER_C_EMAIL, self.USER_C_NAME)
        self.signup(self.USER_D_EMAIL, self.USER_D_NAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)
        user_services.update_profile_picture_data_url(
            self.user_c_id, self.USER_C_PROFILE_PICTURE)

        self.save_new_valid_exploration(self.EXP_ID_4, self.user_c_id)
        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_4, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration updated title'
            })], 'Changed title once.')

        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_4, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'Exploration updated title again'
            })], 'Changed title twice.')

        self.save_new_valid_exploration(self.EXP_ID_5, self.bob_id)

    def test_get_human_readable_contributors_summary(self) -> None:
        contributors_summary = {self.albert_id: 10, self.bob_id: 13}
        self.assertEqual({
            self.ALBERT_NAME: {
                'num_commits': 10,
            },
            self.BOB_NAME: {
                'num_commits': 13,
            }
        }, summary_services.get_human_readable_contributors_summary(
            contributors_summary))

        contributors_summary = {self.user_c_id: 1, self.user_d_id: 2}
        self.assertEqual({
            self.USER_C_NAME: {
                'num_commits': 1,
            },
            self.USER_D_NAME: {
                'num_commits': 2,
            }
        }, summary_services.get_human_readable_contributors_summary(
            contributors_summary))

    def test_get_human_readable_contributors_summary_with_deleted_user(
        self
    ) -> None:
        contributors_summary = {self.albert_id: 10}
        user_services.mark_user_for_deletion(self.albert_id)
        self.assertEqual(
            {'[User being deleted]': {'num_commits': 10}},
            summary_services.get_human_readable_contributors_summary(
                contributors_summary
            )
        )

    def test_get_displayable_exp_summary_dicts_matching_ids(self) -> None:
        # A list of exp_id's are passed in:
        # EXP_ID_1 -- private exploration owned by Albert.
        # EXP_ID_2 -- pubished exploration owned by Albert.
        # EXP_ID_3 -- deleted exploration.
        # EXP_ID_5 -- private exploration owned by Bob.
        # Should only return [EXP_ID_2].

        displayable_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3, self.EXP_ID_5]))
        expected_summary = {
            'category': u'Algebra',
            'community_owned': False,
            'id': self.EXP_ID_2,
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'num_views': 0,
            'objective': u'An objective',
            'ratings': feconf.get_empty_ratings(),
            'status': 'public',
            'tags': [],
            'thumbnail_bg_color': '#cd672b',
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'title': u'Exploration 2 Albert title',
        }
        self.assertIn('last_updated_msec', displayable_summaries[0])
        self.assertDictContainsSubset(
            expected_summary, displayable_summaries[0])

    def test_get_displayable_exp_summary_dicts_matching_ids_with_invalid_exp_id(
        self
    ) -> None:
        displayable_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                ['invalid_exp_id']))
        self.assertEqual(displayable_summaries, [])

    def test_get_public_and_filtered_private_summary_dicts_for_creator(
        self
    ) -> None:
        # If a new exploration is created by another user (Bob) and not public,
        # then Albert cannot see it when querying for explorations.
        displayable_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3, self.EXP_ID_5],
                user=self.albert))

        self.assertEqual(len(displayable_summaries), 2)
        self.assertEqual(displayable_summaries[0]['id'], self.EXP_ID_1)
        self.assertEqual(displayable_summaries[1]['id'], self.EXP_ID_2)

        # However, if Albert is granted editor access to Bob's exploration,
        # then Albert has access to the corresponding summary.
        rights_manager.assign_role_for_exploration(
            self.bob, self.EXP_ID_5, self.albert_id,
            rights_domain.ROLE_EDITOR)

        displayable_summaries = (
            summary_services.get_displayable_exp_summary_dicts_matching_ids(
                [self.EXP_ID_1, self.EXP_ID_2, self.EXP_ID_3, self.EXP_ID_5],
                user=self.albert))

        self.assertEqual(len(displayable_summaries), 3)
        self.assertEqual(displayable_summaries[0]['status'], 'private')
        self.assertEqual(displayable_summaries[0]['id'], self.EXP_ID_1)

        self.assertEqual(displayable_summaries[1]['status'], 'public')
        self.assertEqual(displayable_summaries[1]['id'], self.EXP_ID_2)

        self.assertEqual(displayable_summaries[2]['status'], 'private')
        self.assertEqual(displayable_summaries[2]['id'], self.EXP_ID_5)


class LibraryGroupsTest(exp_services_test.ExplorationServicesUnitTests):
    """Test functions for getting summary dicts for library groups."""

    def setUp(self) -> None:
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Admin logs in.
        - (2) Admin access admin page.
        - (3) Admin reloads exploration with id '3'.
        - (4) Admin logs out.
        """

        super().setUp()
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        csrf_token = self.get_new_csrf_token()

        self.post_json(
            '/adminhandler', {
                'action': 'reload_exploration',
                'exploration_id': '3'
            }, csrf_token=csrf_token)
        self.logout()

    def test_get_library_groups(self) -> None:
        """The exploration with id '3' is an exploration in the Mathematics
        category. The call to get_library_groups() should return the
        exploration as part of the Mathematics & Statistics group.
        """
        library_groups = summary_services.get_library_groups([])
        expected_exploration_summary_dict = {
            'id': '3',
            'title': 'Root Linear Coefficient Theorem',
            'activity_type': 'exploration',
            'category': u'Algebra',
            'objective': 'discover the Root Linear Coefficient Theorem',
            'language_code': 'en',
            'human_readable_contributors_summary': {},
            'status': 'public',
            'ratings': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0},
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'thumbnail_bg_color': '#cd672b',
            'num_views': 0
        }
        expected_group = {
            'categories': [
                'Mathematics', 'Algebra', 'Arithmetic',
                'Calculus', 'Combinatorics', 'Geometry', 'Graph Theory',
                'Logic', 'Probability', 'Statistics', 'Trigonometry'
            ],
            'header_i18n_id': 'I18N_LIBRARY_GROUPS_MATHEMATICS_&_STATISTICS',
        }

        self.assertEqual(len(library_groups), 1)
        self.assertDictContainsSubset(expected_group, library_groups[0])
        self.assertEqual(
            len(library_groups[0]['activity_summary_dicts']), 1)
        actual_exploration_summary_dict = (
            library_groups[0]['activity_summary_dicts'][0])
        self.assertDictContainsSubset(expected_exploration_summary_dict, (
            actual_exploration_summary_dict))


class FeaturedExplorationDisplayableSummariesTest(
        test_utils.GenericTestBase):
    """Test functions for getting displayable featured exploration
    summary dicts.
    """

    ALBERT_NAME: Final = 'albert'
    ALBERT_EMAIL: Final = 'albert@example.com'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    LANGUAGE_CODE_ES: Final = 'es'

    def setUp(self) -> None:
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Albert creates EXP_ID_2.
        - (3) Albert publishes EXP_ID_1.
        - (4) Albert publishes EXP_ID_2.
        - (5) Admin user is set up.
        """

        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.albert = user_services.get_user_actions_info(self.albert_id)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.albert_id, language_code=self.LANGUAGE_CODE_ES)
        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)

        rights_manager.publish_exploration(self.albert, self.EXP_ID_1)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_for_featured_explorations(self) -> None:
        """Note that both EXP_ID_1 and EXP_ID_2 are public. However, only
        EXP_ID_2 is featured, so the call to get_featured_explorations() should
        only return [EXP_ID_2].
        """
        activity_services.update_featured_activity_references([
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_2)
        ])

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([
                constants.DEFAULT_LANGUAGE_CODE]))
        self.assertEqual(len(featured_activity_summaries), 1)
        self.assertDictContainsSubset({
            'status': 'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_2,
            'category': 'Algebra',
            'ratings': feconf.get_empty_ratings(),
            'title': 'A title',
            'num_views': 0,
            'objective': 'An objective'
        }, featured_activity_summaries[0])

    def test_language_code_filter(self) -> None:
        """Note that both EXP_ID_1 is in Spanish and EXP_ID_2 is in English."""
        activity_services.update_featured_activity_references([
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_1),
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_2)
        ])

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([
                constants.DEFAULT_LANGUAGE_CODE]))
        self.assertEqual(len(featured_activity_summaries), 1)
        self.assertDictContainsSubset({
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_2,
        }, featured_activity_summaries[0])

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([
                self.LANGUAGE_CODE_ES]))
        self.assertEqual(len(featured_activity_summaries), 1)
        self.assertDictContainsSubset({
            'language_code': self.LANGUAGE_CODE_ES,
            'id': self.EXP_ID_1,
        }, featured_activity_summaries[0])

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([
                constants.DEFAULT_LANGUAGE_CODE, self.LANGUAGE_CODE_ES]))
        self.assertEqual(len(featured_activity_summaries), 2)
        self.assertDictContainsSubset({
            'language_code': self.LANGUAGE_CODE_ES,
            'id': self.EXP_ID_1,
        }, featured_activity_summaries[0])
        self.assertDictContainsSubset({
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_2,
        }, featured_activity_summaries[1])

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([
                'nonexistent_language_code']))
        self.assertEqual(len(featured_activity_summaries), 0)

        featured_activity_summaries = (
            summary_services.get_featured_activity_summary_dicts([]))
        self.assertEqual(len(featured_activity_summaries), 0)


class CollectionLearnerDictTests(test_utils.GenericTestBase):
    """Test get_learner_collection_dict_by_id."""

    EXP_ID: Final = 'exploration_id'
    EXP_ID_1: Final = 'exp_id1'
    COLLECTION_ID: Final = 'A_collection_id'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.editor = user_services.get_user_actions_info(self.editor_id)

    def test_get_displayable_collection_summary_dicts_matching_ids(
        self
    ) -> None:
        collection_id_1 = self.COLLECTION_ID + '_1'
        self.save_new_valid_collection(self.COLLECTION_ID, self.owner_id)
        self.save_new_valid_collection(collection_id_1, self.owner_id)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        rights_manager.publish_collection(self.owner, collection_id_1)
        collection_id_list = [collection_id_1, self.COLLECTION_ID]
        collection_summaries = (
            summary_services.
            get_displayable_collection_summary_dicts_matching_ids(
                collection_id_list))
        self.assertEqual(len(collection_summaries), 2)
        for collection_summary in collection_summaries:
            self.assertIn(collection_summary['id'], collection_id_list)

    def test_get_learner_collection_dict_by_id_without_user_id(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID, self.owner_id)
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=self.EXP_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        mock_user = user_services.get_user_actions_info(None)
        collection_dict = (
            summary_services.get_learner_collection_dict_by_id(
                self.COLLECTION_ID, mock_user)
            )
        self.assertEqual(
            len(
                collection_dict['playthrough_dict']
                ['completed_exploration_ids']), 0)
        self.assertEqual(
            collection_dict['playthrough_dict']['next_exploration_id'],
            self.EXP_ID
        )

    def test_raises_error_if_invalid_collection_id_provided(self) -> None:
        with self.assertRaisesRegex(
            Exception,
            'No collection exists for the given collection id'):
            summary_services.get_learner_collection_dict_by_id(
                'Invalid_id', self.owner, strict=False
            )

    def test_get_learner_dict_with_deleted_exp_fails_validation(self) -> None:
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=self.EXP_ID)
        summary_services.get_learner_collection_dict_by_id(
            self.COLLECTION_ID, self.owner)

        exp_services.delete_exploration(self.owner_id, self.EXP_ID)

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected collection to only reference valid explorations, but '
            'found an exploration with ID: exploration_id'):
            summary_services.get_learner_collection_dict_by_id(
                self.COLLECTION_ID, self.owner)

    def test_get_learner_dict_when_referencing_inaccessible_explorations(
        self
    ) -> None:
        self.save_new_default_collection(self.COLLECTION_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID, self.editor_id)
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': self.EXP_ID
            }], 'Added another creator\'s private exploration')

        # A collection cannot access someone else's private exploration.
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Expected collection to only reference valid explorations, but '
            'found an exploration with ID: exploration_id'):
            summary_services.get_learner_collection_dict_by_id(
                self.COLLECTION_ID, self.owner)

        # After the exploration is published, the dict can now be created.
        rights_manager.publish_exploration(self.editor, self.EXP_ID)
        summary_services.get_learner_collection_dict_by_id(
            self.COLLECTION_ID, self.owner)

    def test_get_learner_dict_with_private_exp_fails_validation(self) -> None:
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=self.EXP_ID)

        # Since both the collection and exploration are private, the learner
        # dict can be created.
        summary_services.get_learner_collection_dict_by_id(
            self.COLLECTION_ID, self.owner)

        # A public collection referencing a private exploration is bad, however.
        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)
        with self.assertRaisesRegex(
            utils.ValidationError,
            'Cannot reference a private exploration within a public '
            'collection, exploration ID: exploration_id'):
            summary_services.get_learner_collection_dict_by_id(
                self.COLLECTION_ID, self.owner)

        # After the exploration is published, the learner dict can be crated
        # again.
        rights_manager.publish_exploration(self.owner, self.EXP_ID)
        summary_services.get_learner_collection_dict_by_id(
            self.COLLECTION_ID, self.owner)

    def test_get_learner_dict_with_allowed_private_exps(self) -> None:
        self.save_new_valid_collection(
            self.COLLECTION_ID, self.owner_id, exploration_id=self.EXP_ID)
        self.save_new_valid_exploration(self.EXP_ID_1, self.editor_id)
        collection_services.update_collection(
            self.owner_id, self.COLLECTION_ID, [{
                'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                'exploration_id': self.EXP_ID_1
            }], 'Added another creator\'s private exploration')

        rights_manager.publish_collection(self.owner, self.COLLECTION_ID)

        collection_dict = summary_services.get_learner_collection_dict_by_id(
            self.COLLECTION_ID, self.owner,
            allow_invalid_explorations=True)

        # The author's private exploration will be contained in the public
        # collection since invalid explorations are being allowed, but the
        # private exploration of another author will not.
        collection_node_dicts = collection_dict['nodes']
        exploration_summary = collection_node_dicts[0]['exploration_summary']
        assert exploration_summary is not None
        self.assertEqual(
            exploration_summary['id'], self.EXP_ID)
        self.assertIsNone(collection_node_dicts[1]['exploration_summary'])


class TopRatedExplorationDisplayableSummariesTest(
        test_utils.GenericTestBase):
    """Test functions for getting displayable top rated exploration
    summary dicts.
    """

    ALBERT_EMAIL: Final = 'albert@example.com'
    ALICE_EMAIL: Final = 'alice@example.com'
    BOB_EMAIL: Final = 'bob@example.com'
    ALBERT_NAME: Final = 'albert'
    ALICE_NAME: Final = 'alice'
    BOB_NAME: Final = 'bob'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    EXP_ID_3: Final = 'eid3'
    EXP_ID_4: Final = 'eid4'
    EXP_ID_5: Final = 'eid5'
    EXP_ID_6: Final = 'eid6'
    EXP_ID_7: Final = 'eid7'
    EXP_ID_8: Final = 'eid8'
    EXP_ID_9: Final = 'eid9'

    def setUp(self) -> None:
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Albert creates EXP_ID_2.
        - (3) Albert creates EXP_ID_3.
        - (4) Albert creates EXP_ID_4.
        - (5) Albert creates EXP_ID_5.
        - (6) Albert creates EXP_ID_6.
        - (7) Albert creates EXP_ID_7.
        - (8) Albert creates EXP_ID_8.
        - (9) Albert creates EXP_ID_9.
        - (10) Albert publishes EXP_ID_1.
        - (11) Albert publishes EXP_ID_2.
        - (12) Albert publishes EXP_ID_3.
        - (13) Albert publishes EXP_ID_4.
        - (14) Albert publishes EXP_ID_5.
        - (15) Albert publishes EXP_ID_6.
        - (16) Albert publishes EXP_ID_7.
        - (17) Albert publishes EXP_ID_8.
        - (18) Albert publishes EXP_ID_9.
        - (19) Admin user is set up.
        """

        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.ALICE_EMAIL, self.ALICE_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)

        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.alice_id = self.get_user_id_from_email(self.ALICE_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

        self.albert = user_services.get_user_actions_info(self.albert_id)

        self.save_new_valid_exploration(self.EXP_ID_1, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_2, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_3, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_4, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_5, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_6, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_7, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_8, self.albert_id)
        self.save_new_valid_exploration(self.EXP_ID_9, self.albert_id)

        rights_manager.publish_exploration(self.albert, self.EXP_ID_1)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_3)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_4)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_5)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_6)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_7)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_8)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_9)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_at_most_eight_top_rated_explorations(self) -> None:
        """Note that at most 8 explorations should be returned."""
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_2, 5)
        rating_services.assign_rating_to_exploration(
            self.alice_id, self.EXP_ID_3, 5)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_3, 4)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_4, 4)
        rating_services.assign_rating_to_exploration(
            self.alice_id, self.EXP_ID_5, 4)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_5, 3)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_6, 3)
        rating_services.assign_rating_to_exploration(
            self.alice_id, self.EXP_ID_6, 2)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_8, 2)
        rating_services.assign_rating_to_exploration(
            self.alice_id, self.EXP_ID_8, 2)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_7, 2)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_9, 2)
        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_1, 1)

        top_rated_exploration_summaries = (
            summary_services.get_top_rated_exploration_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE],
                feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE))
        expected_summary = {
            'status': u'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'id': self.EXP_ID_3,
            'category': u'Algebra',
            'ratings': {u'1': 0, u'3': 0, u'2': 0, u'5': 1, u'4': 1},
            'title': u'A title',
            'num_views': 0,
            'objective': u'An objective'
        }

        self.assertDictContainsSubset(
            expected_summary, top_rated_exploration_summaries[0])

        expected_ordering = [
            self.EXP_ID_3, self.EXP_ID_2, self.EXP_ID_5, self.EXP_ID_4,
            self.EXP_ID_6, self.EXP_ID_8, self.EXP_ID_7, self.EXP_ID_9]

        actual_ordering = [exploration['id'] for exploration in
                           top_rated_exploration_summaries]

        self.assertEqual(expected_ordering, actual_ordering)

    def test_only_explorations_with_ratings_are_returned(self) -> None:
        """Note that only explorations with ratings will be included."""

        rating_services.assign_rating_to_exploration(
            self.bob_id, self.EXP_ID_2, 5)

        top_rated_exploration_summaries = (
            summary_services.get_top_rated_exploration_summary_dicts(
                [constants.DEFAULT_LANGUAGE_CODE],
                feconf.NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE))

        expected_summary = {
            'status': u'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_2,
            'category': u'Algebra',
            'ratings': {u'1': 0, u'3': 0, u'2': 0, u'5': 1, u'4': 0},
            'title': u'A title',
            'num_views': 0,
            'objective': u'An objective'
        }
        self.assertDictContainsSubset(
            expected_summary, top_rated_exploration_summaries[0])

        expected_ordering = [self.EXP_ID_2]

        actual_ordering = [exploration['id'] for exploration in
                           top_rated_exploration_summaries]

        self.assertEqual(expected_ordering, actual_ordering)


class RecentlyPublishedExplorationDisplayableSummariesTest(
        test_utils.GenericTestBase):
    """Test functions for getting displayable recently published exploration
    summary dicts.
    """

    ALBERT_NAME: Final = 'albert'
    ALBERT_EMAIL: Final = 'albert@example.com'

    EXP_ID_1: Final = 'eid1'
    EXP_ID_2: Final = 'eid2'
    EXP_ID_3: Final = 'eid3'

    def setUp(self) -> None:
        """Populate the database of explorations and their summaries.

        The sequence of events is:
        - (1) Albert creates EXP_ID_1.
        - (2) Albert creates EXP_ID_2.
        - (3) Albert creates EXP_ID_3.
        - (4) Albert publishes EXP_ID_1.
        - (5) Albert publishes EXP_ID_2.
        - (6) Albert publishes EXP_ID_3.
        - (7) Admin user is set up.
        """

        super().setUp()

        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.albert = user_services.get_user_actions_info(self.albert_id)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.albert_id,
            end_state_name='End')
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.albert_id,
            end_state_name='End')
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.albert_id,
            end_state_name='End')

        rights_manager.publish_exploration(self.albert, self.EXP_ID_2)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_1)
        rights_manager.publish_exploration(self.albert, self.EXP_ID_3)

        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_for_recently_published_explorations(self) -> None:
        """Tests for recently published explorations."""

        self.process_and_flush_pending_tasks()
        recently_published_exploration_summaries = (
            summary_services.get_recently_published_exp_summary_dicts(
                feconf.RECENTLY_PUBLISHED_QUERY_LIMIT_FOR_LIBRARY_PAGE))
        test_summary_1 = {
            'status': 'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_1,
            'category': u'Algebra',
            'ratings': feconf.get_empty_ratings(),
            'title': u'A title',
            'num_views': 0,
            'objective': u'An objective'
        }
        test_summary_2 = {
            'status': 'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_2,
            'category': u'Algebra',
            'ratings': feconf.get_empty_ratings(),
            'title': u'A title',
            'num_views': 0,
            'objective': u'An objective'
        }
        test_summary_3 = {
            'status': 'public',
            'thumbnail_bg_color': '#cd672b',
            'community_owned': False,
            'tags': [],
            'thumbnail_icon_url': '/subjects/Algebra.svg',
            'language_code': constants.DEFAULT_LANGUAGE_CODE,
            'id': self.EXP_ID_3,
            'category': u'Algebra',
            'ratings': feconf.get_empty_ratings(),
            'title': u'A title',
            'num_views': 0,
            'objective': u'An objective'
        }

        self.assertDictContainsSubset(
            test_summary_3, recently_published_exploration_summaries[0])
        self.assertDictContainsSubset(
            test_summary_1, recently_published_exploration_summaries[1])
        self.assertDictContainsSubset(
            test_summary_2, recently_published_exploration_summaries[2])

        # Test that editing an exploration does not change its
        # 'recently-published' status.
        exp_services.update_exploration(
            self.albert_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'title',
                'new_value': 'New title'
            })], 'Changed title.')
        self.process_and_flush_pending_tasks()

        recently_published_exploration_summaries = (
            summary_services.get_recently_published_exp_summary_dicts(
                feconf.RECENTLY_PUBLISHED_QUERY_LIMIT_FOR_LIBRARY_PAGE))
        self.assertEqual(
            recently_published_exploration_summaries[1]['title'], 'New title')
        self.assertDictContainsSubset(
            test_summary_3, recently_published_exploration_summaries[0])


class ActivityReferenceAccessCheckerTests(test_utils.GenericTestBase):
    """Tests for requiring that activity references are public."""

    EXP_ID_0: Final = 'exp_id_0'
    EXP_ID_1: Final = 'exp_id_1'
    COL_ID_2: Final = 'col_id_2'

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

    def test_requiring_nonexistent_activities_be_public_raises_exception(
        self
    ) -> None:
        with self.assertRaisesRegex(Exception, 'non-existent exploration'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    constants.ACTIVITY_TYPE_EXPLORATION, 'fake')])
        with self.assertRaisesRegex(Exception, 'non-existent collection'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    constants.ACTIVITY_TYPE_COLLECTION, 'fake')])

    def test_requiring_private_activities_to_be_public_raises_exception(
        self
    ) -> None:
        self.save_new_valid_exploration(self.EXP_ID_0, self.owner_id)
        self.save_new_valid_exploration(self.EXP_ID_1, self.owner_id)
        self.save_new_valid_collection(
            self.COL_ID_2, self.owner_id, exploration_id=self.EXP_ID_0)

        with self.assertRaisesRegex(Exception, 'private exploration'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_0)])
        with self.assertRaisesRegex(Exception, 'private collection'):
            summary_services.require_activities_to_be_public([
                activity_domain.ActivityReference(
                    constants.ACTIVITY_TYPE_COLLECTION, self.COL_ID_2)])

    def test_requiring_public_activities_to_be_public_succeeds(self) -> None:
        self.save_new_valid_exploration(self.EXP_ID_0, self.owner_id)
        self.save_new_valid_collection(
            self.COL_ID_2, self.owner_id, exploration_id=self.EXP_ID_0)

        rights_manager.publish_exploration(self.owner, self.EXP_ID_0)
        rights_manager.publish_collection(self.owner, self.COL_ID_2)

        # There are no validation errors.
        summary_services.require_activities_to_be_public([
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_EXPLORATION, self.EXP_ID_0),
            activity_domain.ActivityReference(
                constants.ACTIVITY_TYPE_COLLECTION, self.COL_ID_2)])


class CollectionNodeMetadataDictsTest(
        exp_services_test.ExplorationServicesUnitTests):
    """Test functions for getting collection node metadata dicts."""

    ALBERT_EMAIL: Final = 'albert@example.com'
    ALBERT_NAME: Final = 'albert'

    BOB_EMAIL: Final = 'bob@example.com'
    BOB_NAME: Final = 'bob'

    EXP_ID1: Final = 'eid1'
    EXP_ID2: Final = 'eid2'
    EXP_ID3: Final = 'eid3'
    EXP_ID4: Final = 'eid4'
    EXP_ID5: Final = 'eid5'
    INVALID_EXP_ID: Final = 'invalid_exp_id'

    def setUp(self) -> None:
        super().setUp()

        self.signup(self.ALBERT_EMAIL, self.ALBERT_NAME)
        self.signup(self.BOB_EMAIL, self.BOB_NAME)
        self.albert_id = self.get_user_id_from_email(self.ALBERT_EMAIL)
        self.bob_id = self.get_user_id_from_email(self.BOB_EMAIL)

        self.albert = user_services.get_user_actions_info(self.albert_id)
        self.bob = user_services.get_user_actions_info(self.bob_id)

        self.save_new_valid_exploration(
            self.EXP_ID1, self.albert_id,
            title='Exploration 1 Albert title',
            objective='An objective 1')

        self.save_new_valid_exploration(
            self.EXP_ID2, self.albert_id,
            title='Exploration 2 Albert title',
            objective='An objective 2')

        self.save_new_valid_exploration(
            self.EXP_ID3, self.albert_id,
            title='Exploration 3 Albert title',
            objective='An objective 3')

        self.save_new_valid_exploration(
            self.EXP_ID4, self.bob_id,
            title='Exploration 4 Bob title',
            objective='An objective 4')

        self.save_new_valid_exploration(
            self.EXP_ID5, self.albert_id,
            title='Exploration 5 Albert title',
            objective='An objective 5')

        rights_manager.publish_exploration(self.albert, self.EXP_ID1)
        rights_manager.publish_exploration(self.albert, self.EXP_ID2)
        rights_manager.publish_exploration(self.albert, self.EXP_ID3)
        rights_manager.publish_exploration(self.bob, self.EXP_ID4)

        exp_services.index_explorations_given_ids([
            self.EXP_ID1, self.EXP_ID2, self.EXP_ID3,
            self.EXP_ID4])

    def test_get_exploration_metadata_dicts(self) -> None:
        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID1, self.EXP_ID2, self.EXP_ID3], self.albert))

        expected_metadata_dicts = [{
            'id': self.EXP_ID1,
            'objective': u'An objective 1',
            'title': u'Exploration 1 Albert title',
        }, {
            'id': self.EXP_ID2,
            'objective': u'An objective 2',
            'title': u'Exploration 2 Albert title',
        }, {
            'id': self.EXP_ID3,
            'objective': u'An objective 3',
            'title': u'Exploration 3 Albert title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_get_exploration_metadata_dicts_with_invalid_exploration_id(
        self
    ) -> None:
        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            ['invalid_exp_id'], self.albert))

        self.assertEqual(metadata_dicts, [])

    def test_private_exps_of_another_user_are_not_returned(self) -> None:
        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID5, self.EXP_ID4], self.bob))

        expected_metadata_dicts = [{
            'id': self.EXP_ID4,
            'objective': u'An objective 4',
            'title': u'Exploration 4 Bob title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_public_exps_of_another_user_are_returned(self) -> None:
        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID2, self.EXP_ID3, self.EXP_ID4], self.bob))

        expected_metadata_dicts = [{
            'id': self.EXP_ID2,
            'objective': u'An objective 2',
            'title': u'Exploration 2 Albert title',
        }, {
            'id': self.EXP_ID3,
            'objective': u'An objective 3',
            'title': u'Exploration 3 Albert title',
        }, {
            'id': self.EXP_ID4,
            'objective': u'An objective 4',
            'title': u'Exploration 4 Bob title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_deleted_exps_are_not_returned(self) -> None:
        exp_services.delete_exploration(self.albert_id, self.EXP_ID2)

        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID2, self.EXP_ID3, self.EXP_ID4], self.bob))

        expected_metadata_dicts = [{
            'id': self.EXP_ID3,
            'objective': u'An objective 3',
            'title': u'Exploration 3 Albert title',
        }, {
            'id': self.EXP_ID4,
            'objective': u'An objective 4',
            'title': u'Exploration 4 Bob title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_exp_metadata_dicts_matching_query(self) -> None:
        metadata_dicts, _ = (
            summary_services.get_exp_metadata_dicts_matching_query(
                'Exploration 1', None, self.albert))

        expected_metadata_dicts = [{
            'id': self.EXP_ID1,
            'objective': u'An objective 1',
            'title': u'Exploration 1 Albert title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_invalid_exp_ids(self) -> None:
        metadata_dicts = (summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID3, self.INVALID_EXP_ID], self.albert))

        expected_metadata_dicts = [{
            'id': self.EXP_ID3,
            'objective': u'An objective 3',
            'title': u'Exploration 3 Albert title',
        }]
        self.assertEqual(expected_metadata_dicts, metadata_dicts)

    def test_guest_can_fetch_public_exploration_metadata_dicts(self) -> None:
        new_guest_user = user_services.get_user_actions_info('mock_user')
        metadata_dicts = summary_services.get_exploration_metadata_dicts(
            [self.EXP_ID3, self.EXP_ID4], new_guest_user)

        expected_metadata_dicts = [{
            'id': self.EXP_ID3,
            'objective': u'An objective 3',
            'title': u'Exploration 3 Albert title',
        }, {
            'id': self.EXP_ID4,
            'objective': u'An objective 4',
            'title': u'Exploration 4 Bob title',
        }]

        self.assertEqual(metadata_dicts, expected_metadata_dicts)

    def test_guest_cannot_fetch_private_exploration_metadata_dicts(
        self
    ) -> None:
        new_guest_user = user_services.get_user_actions_info(None)
        self.save_new_valid_exploration('exp_id', self.albert_id)
        metadata_dicts = summary_services.get_exploration_metadata_dicts(
            ['exp_id'], new_guest_user)

        self.assertEqual(metadata_dicts, [])
