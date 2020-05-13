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

"""Tests for core.storage.feedback.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import types

from core.domain import feedback_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

(base_models, feedback_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.feedback])

CREATED_ON_FIELD = 'created_on'
LAST_UPDATED_FIELD = 'last_updated'
DELETED_FIELD = 'deleted'
FIELDS_NOT_REQUIRED = [CREATED_ON_FIELD, LAST_UPDATED_FIELD, DELETED_FIELD]


class FeedbackThreadModelTest(test_utils.GenericTestBase):
    """Tests for the GeneralFeedbackThreadModel class."""

    NONEXISTENT_USER_ID = 'id_x'
    ENTITY_TYPE = feconf.ENTITY_TYPE_EXPLORATION
    ENTITY_ID = 'exp_id_2'
    USER_ID = 'user_1'
    STATUS = 'open'
    SUBJECT = 'dummy subject'
    HAS_SUGGESTION = True
    SUMMARY = 'This is a great summary.'
    MESSAGE_COUNT = 0

    def setUp(self):
        """Set up user models in datastore for use in testing."""
        super(FeedbackThreadModelTest, self).setUp()

        self.feedback_thread_model = feedback_models.GeneralFeedbackThreadModel(
            id='%s.%s.%s' % (self.ENTITY_TYPE, self.ENTITY_ID, 'random'),
            entity_type=self.ENTITY_TYPE,
            entity_id=self.ENTITY_ID,
            original_author_id=self.USER_ID,
            status=self.STATUS,
            subject=self.SUBJECT,
            has_suggestion=self.HAS_SUGGESTION,
            summary=self.SUMMARY,
            message_count=self.MESSAGE_COUNT
        )
        self.feedback_thread_model.put()

    def test_get_deletion_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackThreadModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        self.assertTrue(
            feedback_models.GeneralFeedbackThreadModel
            .has_reference_to_user_id(self.USER_ID))
        self.assertFalse(
            feedback_models.GeneralFeedbackThreadModel
            .has_reference_to_user_id(self.NONEXISTENT_USER_ID))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackThreadModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        # We need to compare the field types not the field values, thus using
        # python_utils.UNICODE.
        self.assertEqual(
            python_utils.UNICODE(
                feedback_models.GeneralFeedbackThreadModel
                .get_user_id_migration_field()),
            python_utils.UNICODE(
                feedback_models.GeneralFeedbackThreadModel.original_author_id))

    def test_raise_exception_by_mocking_collision(self):
        feedback_thread_model_cls = feedback_models.GeneralFeedbackThreadModel
        # Test create method.
        with self.assertRaisesRegexp(
            Exception, 'Feedback thread ID conflict on create.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                feedback_thread_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    feedback_thread_model_cls)):
                feedback_thread_model_cls.create(
                    'exploration.exp_id.thread_id')

        # Test generate_new_thread_id method.
        with self.assertRaisesRegexp(
            Exception,
            'New thread id generator is producing too many collisions.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                feedback_thread_model_cls, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    feedback_thread_model_cls)):
                feedback_thread_model_cls.generate_new_thread_id(
                    'exploration', 'exp_id')

    def test_export_data_trivial(self):
        user_data = feedback_models.GeneralFeedbackThreadModel.export_data(
            'fake_user'
        )
        test_data = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        user_data = (
            feedback_models
            .GeneralFeedbackThreadModel.export_data(self.USER_ID))
        feedback_id = '%s.%s.%s' % (self.ENTITY_TYPE, self.ENTITY_ID, 'random')
        test_data = {
            feedback_id: {
                'entity_type': self.ENTITY_TYPE,
                'entity_id': self.ENTITY_ID,
                'status': self.STATUS,
                'subject': self.SUBJECT,
                'has_suggestion': self.HAS_SUGGESTION,
                'summary': self.SUMMARY,
                'message_count': self.MESSAGE_COUNT,
                'last_updated_msec': utils.get_time_in_millisecs(
                    self.feedback_thread_model.last_updated)
            }
        }
        self.assertEqual(user_data, test_data)

    def test_message_cache_supports_huge_text(self):
        self.feedback_thread_model.last_nonempty_message_text = 'X' * 2000
        # Storing the model should not throw.
        self.feedback_thread_model.put()


class GeneralFeedbackMessageModelTests(test_utils.GenericTestBase):
    """Tests for the GeneralFeedbackMessageModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackMessageModel.get_deletion_policy(),
            base_models.DELETION_POLICY.LOCALLY_PSEUDONYMIZE)

    def test_has_reference_to_user_id(self):
        feedback_models.GeneralFeedbackMessageModel(
            id='id',
            thread_id='thread_id',
            message_id=1,
            author_id='user_id',
            received_via_email=False
        ).put()
        self.assertTrue(
            feedback_models.GeneralFeedbackMessageModel
            .has_reference_to_user_id('user_id'))
        self.assertFalse(
            feedback_models.GeneralFeedbackMessageModel
            .has_reference_to_user_id('id_x'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackMessageModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.ONE_FIELD)

    def test_get_user_id_migration_field(self):
        # We need to compare the field types not the field values, thus using
        # python_utils.UNICODE.
        self.assertEqual(
            python_utils.UNICODE(
                feedback_models.GeneralFeedbackMessageModel
                .get_user_id_migration_field()),
            python_utils.UNICODE(
                feedback_models.GeneralFeedbackMessageModel.author_id))

    def test_raise_exception_by_mocking_collision(self):
        with self.assertRaisesRegexp(
            Exception, 'Feedback message ID conflict on create.'):
            # Swap dependent method get_by_id to simulate collision every time.
            with self.swap(
                feedback_models.GeneralFeedbackMessageModel, 'get_by_id',
                types.MethodType(
                    lambda x, y: True,
                    feedback_models.GeneralFeedbackMessageModel)):
                feedback_models.GeneralFeedbackMessageModel.create(
                    'thread_id', 'message_id')

    def test_get_all_messages(self):
        thread_id = feedback_services.create_thread(
            'exploration', '0', None, 'subject 1', 'text 1')

        feedback_services.create_message(
            thread_id, None, 'open', 'subject 2', 'text 2')

        model = feedback_models.GeneralFeedbackMessageModel.get(
            thread_id, 0)
        self.assertEqual(model.entity_type, 'exploration')

        all_messages = (
            feedback_models.GeneralFeedbackMessageModel
            .get_all_messages(2, None))

        self.assertEqual(len(all_messages[0]), 2)

        self.assertEqual(all_messages[0][0].thread_id, thread_id)
        self.assertEqual(all_messages[0][0].entity_id, '0')
        self.assertEqual(all_messages[0][0].entity_type, 'exploration')
        self.assertEqual(all_messages[0][0].text, 'text 2')
        self.assertEqual(all_messages[0][0].updated_subject, 'subject 2')

        self.assertEqual(all_messages[0][1].thread_id, thread_id)
        self.assertEqual(all_messages[0][1].entity_id, '0')
        self.assertEqual(all_messages[0][1].entity_type, 'exploration')
        self.assertEqual(all_messages[0][1].text, 'text 1')
        self.assertEqual(all_messages[0][1].updated_subject, 'subject 1')

    def test_get_most_recent_message(self):
        thread_id = feedback_services.create_thread(
            'exploration', '0', None, 'subject 1', 'text 1')

        feedback_services.create_message(
            thread_id, None, 'open', 'subject 2', 'text 2')

        model1 = feedback_models.GeneralFeedbackMessageModel.get(
            thread_id, 0)

        self.assertEqual(model1.entity_type, 'exploration')

        message = (
            feedback_models.GeneralFeedbackMessageModel
            .get_most_recent_message(thread_id))

        self.assertEqual(message.thread_id, thread_id)
        self.assertEqual(message.entity_id, '0')
        self.assertEqual(message.entity_type, 'exploration')
        self.assertEqual(message.text, 'text 2')
        self.assertEqual(message.updated_subject, 'subject 2')

    def test_export_data_trivial(self):
        user_data = (
            feedback_models.GeneralFeedbackMessageModel
            .export_data('non_existent_user'))
        test_data = {}
        self.assertEqual(user_data, test_data)

    def test_export_data_nontrivial(self):
        # Setup test variables.
        test_export_thread_type = 'exploration'
        test_export_thread_id = 'export_thread_1'
        test_export_updated_status = 'open'
        test_export_updated_subject = 'export_subject_1'
        test_export_text = 'Export test text.'
        test_export_received_via_email = False

        self.signup('export_author_1@example.com', 'exportAuthor1')
        test_export_author_id = (
            self.get_user_id_from_email('export_author_1@example.com'))

        thread_id = feedback_services.create_thread(
            test_export_thread_type,
            test_export_thread_id,
            test_export_author_id,
            test_export_updated_subject,
            test_export_text
        )

        feedback_services.create_message(
            thread_id,
            test_export_author_id,
            test_export_updated_status,
            test_export_updated_subject,
            test_export_text
        )

        user_data = (
            feedback_models.GeneralFeedbackMessageModel
            .export_data(test_export_author_id))

        test_data = {
            thread_id + '.0': {
                'thread_id': thread_id,
                'message_id': 0,
                'updated_status': test_export_updated_status,
                'updated_subject': test_export_updated_subject,
                'text': test_export_text,
                'received_via_email': test_export_received_via_email
            },
            thread_id + '.1': {
                'thread_id': thread_id,
                'message_id': 1,
                'updated_status': test_export_updated_status,
                'updated_subject': test_export_updated_subject,
                'text': test_export_text,
                'received_via_email': test_export_received_via_email
            }
        }

        self.assertEqual(test_data, user_data)


class FeedbackThreadUserModelTest(test_utils.GenericTestBase):
    """Tests for the FeedbackThreadUserModel class."""
    USER_ID_A = 'user.id.a'
    USER_ID_B = 'user_id_b'
    THREAD_ID_A = 'exploration.exp_id.thread_id_a'
    THREAD_ID_B = 'exploration.exp_id.thread_id_b'
    THREAD_ID_C = 'exploration.exp_id.thread_id_c'
    MESSAGE_IDS_READ_IN_THREAD_A = [0, 1, 2]
    MESSAGE_IDS_READ_IN_THREAD_B = [3, 4]
    MESSAGE_IDS_READ_IN_THREAD_C = [5, 6, 7, 8, 9]

    def setUp(self):
        super(FeedbackThreadUserModelTest, self).setUp()
        model = feedback_models.GeneralFeedbackThreadUserModel.create(
            self.USER_ID_A, self.THREAD_ID_A)
        model.message_ids_read_by_user = self.MESSAGE_IDS_READ_IN_THREAD_A

        model = feedback_models.GeneralFeedbackThreadUserModel.create(
            self.USER_ID_A, self.THREAD_ID_B)
        model.message_ids_read_by_user = self.MESSAGE_IDS_READ_IN_THREAD_B

        model = feedback_models.GeneralFeedbackThreadUserModel.create(
            self.USER_ID_A, self.THREAD_ID_C)
        model.message_ids_read_by_user = self.MESSAGE_IDS_READ_IN_THREAD_C

    def test_get_deletion_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackThreadUserModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.DELETE)

    def test_has_reference_to_user_id(self):
        feedback_models.GeneralFeedbackThreadUserModel(
            id='id',
            thread_id='thread_id',
            user_id='user_id',
        ).put()
        self.assertTrue(
            feedback_models.GeneralFeedbackThreadUserModel
            .has_reference_to_user_id('user_id'))
        self.assertFalse(
            feedback_models.GeneralFeedbackThreadUserModel
            .has_reference_to_user_id('id_x'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            feedback_models.GeneralFeedbackThreadUserModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.COPY_AND_UPDATE_ONE_FIELD)

    def test_put_function(self):
        feedback_thread_model = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id',
            user_id='user_id',
            thread_id='exploration.exp_id.thread_id',
            message_ids_read_by_user=[])

        feedback_thread_model.put()

        last_updated = feedback_thread_model.last_updated

        # If we do not wish to update the last_updated time, we should set
        # the update_last_updated_time argument to False in the put function.
        feedback_thread_model.put(update_last_updated_time=False)
        self.assertEqual(feedback_thread_model.last_updated, last_updated)

        # If we do wish to change it however, we can simply use the put function
        # as the default value of update_last_updated_time is True.
        feedback_thread_model.put()
        self.assertNotEqual(feedback_thread_model.last_updated, last_updated)

    def test_create_new_object(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id')
        feedback_thread_user_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                'user_id', 'exploration.exp_id.thread_id'))

        self.assertEqual(
            feedback_thread_user_model.id,
            'user_id.exploration.exp_id.thread_id')
        self.assertEqual(feedback_thread_user_model.user_id, 'user_id')
        self.assertEqual(
            feedback_thread_user_model.thread_id,
            'exploration.exp_id.thread_id')
        self.assertEqual(
            feedback_thread_user_model.message_ids_read_by_user, [])

    def test_get_object(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id')
        expected_model = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id',
            user_id='user_id',
            thread_id='exploration.exp_id.thread_id',
            message_ids_read_by_user=[])

        actual_model = (
            feedback_models.GeneralFeedbackThreadUserModel.get(
                'user_id', 'exploration.exp_id.thread_id'))

        self.assertEqual(actual_model.id, expected_model.id)
        self.assertEqual(actual_model.user_id, expected_model.user_id)
        self.assertEqual(actual_model.thread_id, expected_model.thread_id)
        self.assertEqual(
            actual_model.message_ids_read_by_user,
            expected_model.message_ids_read_by_user)

    def test_get_multi(self):
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id_1')
        feedback_models.GeneralFeedbackThreadUserModel.create(
            'user_id', 'exploration.exp_id.thread_id_2')

        expected_model_1 = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id_1',
            user_id='user_id',
            thread_id='exploration.exp_id.thread_id_1',
            message_ids_read_by_user=[])
        expected_model_2 = feedback_models.GeneralFeedbackThreadUserModel(
            id='user_id.exploration.exp_id.thread_id_2',
            user_id='user_id',
            thread_id='exploration.exp_id.thread_id_2',
            message_ids_read_by_user=[])

        actual_models = (
            feedback_models.GeneralFeedbackThreadUserModel.get_multi(
                'user_id',
                ['exploration.exp_id.thread_id_1',
                 'exploration.exp_id.thread_id_2']))

        actual_model_1 = actual_models[0]
        actual_model_2 = actual_models[1]

        self.assertEqual(actual_model_1.id, expected_model_1.id)
        self.assertEqual(actual_model_1.user_id, expected_model_1.user_id)
        self.assertEqual(actual_model_1.thread_id, expected_model_1.thread_id)
        self.assertEqual(
            actual_model_1.message_ids_read_by_user,
            expected_model_1.message_ids_read_by_user)

        self.assertEqual(actual_model_2.id, expected_model_2.id)
        self.assertEqual(actual_model_2.user_id, expected_model_2.user_id)
        self.assertEqual(actual_model_2.thread_id, expected_model_2.thread_id)
        self.assertEqual(
            actual_model_2.message_ids_read_by_user,
            expected_model_2.message_ids_read_by_user)

    def test_export_data_general_case(self):
        """Ensure export_data returns well-formed data in general case."""
        user_data = feedback_models.GeneralFeedbackThreadUserModel.export_data(
            self.USER_ID_A)
        expected_data = {
            self.THREAD_ID_A: self.MESSAGE_IDS_READ_IN_THREAD_A,
            self.THREAD_ID_B: self.MESSAGE_IDS_READ_IN_THREAD_B,
            self.THREAD_ID_C: self.MESSAGE_IDS_READ_IN_THREAD_C
        }
        self.assertDictEqual(expected_data, user_data)

    def test_export_data_nonexistent_case(self):
        """Ensure export data returns empty dict when data is not found."""
        user_data = feedback_models.GeneralFeedbackThreadUserModel.export_data(
            self.USER_ID_B)
        self.assertEqual({}, user_data)


class FeedbackAnalyticsModelTests(test_utils.GenericTestBase):
    """Tests for the FeedbackAnalyticsModelTests class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            feedback_models.FeedbackAnalyticsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            feedback_models.FeedbackAnalyticsModel
            .has_reference_to_user_id('id_x'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            feedback_models.FeedbackAnalyticsModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)


class UnsentFeedbackEmailModelTest(test_utils.GenericTestBase):
    """Tests for FeedbackMessageEmailDataModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            feedback_models.UnsentFeedbackEmailModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP)

    def test_has_reference_to_user_id(self):
        feedback_models.UnsentFeedbackEmailModel(id='user_id').put()
        self.assertTrue(
            feedback_models.UnsentFeedbackEmailModel
            .has_reference_to_user_id('user_id'))
        self.assertFalse(
            feedback_models.UnsentFeedbackEmailModel
            .has_reference_to_user_id('id_x'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            feedback_models.UnsentFeedbackEmailModel
            .get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.COPY)

    def test_new_instances_stores_correct_data(self):
        user_id = 'A'
        message_reference_dict = {
            'exploration_id': 'ABC123',
            'thread_id': 'thread_id1',
            'message_id': 'message_id1'
        }
        email_instance = feedback_models.UnsentFeedbackEmailModel(
            id=user_id, feedback_message_references=[message_reference_dict])
        email_instance.put()

        retrieved_instance = (
            feedback_models.UnsentFeedbackEmailModel.get_by_id(id=user_id))

        self.assertEqual(
            retrieved_instance.feedback_message_references,
            [message_reference_dict])
        self.assertEqual(retrieved_instance.retries, 0)
