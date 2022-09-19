# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests interface for storage model switching."""

from __future__ import annotations

import re
import sys
from types import ModuleType  # pylint: disable=import-only-modules

from core import feconf
from core.constants import constants
from core.platform import models
from core.tests import test_utils

from typing import cast


class RegistryUnitTest(test_utils.TestBase):
    """Tests the Registry class interface."""

    def setUp(self) -> None:
        super().setUp()
        self.registry_instance = models.Registry()

    def test_import_models_activity(self) -> None:
        """Tests import_models function with activity option."""
        from core.storage.activity import gae_models as activity_models
        expected_activity_models = (activity_models,)
        self.assertEqual(
            expected_activity_models,
            self.registry_instance.import_models([models.Names.ACTIVITY]))

    def test_import_models_audit(self) -> None:
        """Tests import_models function with audit option."""
        from core.storage.audit import gae_models as audit_models
        expected_audit_models = (audit_models,)
        self.assertEqual(
            expected_audit_models,
            self.registry_instance.import_models([models.Names.AUDIT]))

    def test_import_models_auth_model(self) -> None:
        """Tests import_models function with auth option."""
        from core.storage.auth import gae_models as auth_models
        expected_auth_models = (auth_models,)
        self.assertEqual(
            expected_auth_models,
            self.registry_instance.import_models([models.Names.AUTH]))

    def test_import_models_base_model(self) -> None:
        """Tests import_models function with base model option."""
        from core.storage.base_model import gae_models as base_models
        expected_base_models = (base_models,)
        self.assertEqual(
            expected_base_models,
            self.registry_instance.import_models([models.Names.BASE_MODEL]))

    def test_import_models_blog_model(self) -> None:
        """Tests import_models function with blog post model option."""
        from core.storage.blog import gae_models as blog_models
        expected_blog_models = (blog_models,)
        self.assertEqual(
            expected_blog_models,
            self.registry_instance.import_models([models.Names.BLOG]))

    def test_import_models_beam_job_model(self) -> None:
        """Tests import_models function with base model option."""
        from core.storage.beam_job import gae_models as beam_job_models
        expected_beam_job_models = (beam_job_models,)
        self.assertEqual(
            expected_beam_job_models,
            self.registry_instance.import_models([models.Names.BEAM_JOB]))

    def test_import_models_classifier(self) -> None:
        """Tests import_models function with classifier option."""
        from core.storage.classifier import gae_models as classifier_data_models
        expected_classifier_models = (classifier_data_models,)
        self.assertEqual(
            expected_classifier_models,
            self.registry_instance.import_models([models.Names.CLASSIFIER]))

    def test_import_models_collection(self) -> None:
        """Tests import_models function with collection option."""
        from core.storage.collection import gae_models as collection_models
        expected_collection_models = (collection_models,)
        self.assertEqual(
            expected_collection_models,
            self.registry_instance.import_models([models.Names.COLLECTION]))

    def test_import_models_config(self) -> None:
        """Tests import_models function with config option."""
        from core.storage.config import gae_models as config_models
        expected_config_models = (config_models,)
        self.assertEqual(
            expected_config_models,
            self.registry_instance.import_models([models.Names.CONFIG]))

    def test_import_models_email(self) -> None:
        """Tests import_models function with email option."""
        from core.storage.email import gae_models as email_models
        expected_email_models = (email_models,)
        self.assertEqual(
            expected_email_models,
            self.registry_instance.import_models([models.Names.EMAIL]))

    def test_import_models_exploration(self) -> None:
        """Tests import_models function with exploration option."""
        from core.storage.exploration import gae_models as exp_models
        expected_exploration_models = (exp_models,)
        self.assertEqual(
            expected_exploration_models,
            self.registry_instance.import_models([models.Names.EXPLORATION]))

    def test_import_models_feedback(self) -> None:
        """Tests import_models function with feedback option."""
        from core.storage.feedback import gae_models as feedback_models
        expected_feedback_models = (feedback_models,)
        self.assertEqual(
            expected_feedback_models,
            self.registry_instance.import_models([models.Names.FEEDBACK]))

    def test_import_models_learner_group(self) -> None:
        """Tests import_models function with learner group option."""
        from core.storage.learner_group import (
            gae_models as learner_group_models)
        expected_learner_group_models = (learner_group_models,)
        self.assertEqual(
            expected_learner_group_models,
            self.registry_instance.import_models([models.Names.LEARNER_GROUP]))

    def test_import_models_job(self) -> None:
        """Tests import_models function with job option."""
        from core.storage.job import gae_models as job_models
        expected_job_models = (job_models,)
        self.assertEqual(
            expected_job_models,
            self.registry_instance.import_models([models.Names.JOB]))

    def test_import_models_question(self) -> None:
        """Tests import_models function with question option."""
        from core.storage.question import gae_models as question_models
        expected_question_models = (question_models,)
        self.assertEqual(
            expected_question_models,
            self.registry_instance.import_models([models.Names.QUESTION]))

    def test_import_models_recommendations(self) -> None:
        """Tests import_models function with recommendations option."""
        from core.storage.recommendations import gae_models
        expected_recommendations_models = (gae_models,)
        self.assertEqual(
            expected_recommendations_models,
            self.registry_instance.import_models(
                [models.Names.RECOMMENDATIONS]))

    def test_import_models_skill(self) -> None:
        """Tests import_models function with skill option."""
        from core.storage.skill import gae_models as skill_models
        expected_skills_models = (skill_models,)
        self.assertEqual(
            expected_skills_models,
            self.registry_instance.import_models([models.Names.SKILL]))

    def test_import_models_statistics(self) -> None:
        """Tests import_models function with statistics option."""
        from core.storage.statistics import gae_models as statistics_models
        expected_statistics_models = (statistics_models,)
        self.assertEqual(
            expected_statistics_models,
            self.registry_instance.import_models([models.Names.STATISTICS]))

    def test_import_models_story(self) -> None:
        """Tests import_models function with story option."""
        from core.storage.story import gae_models as story_models
        expected_story_models = (story_models,)
        self.assertEqual(
            expected_story_models,
            self.registry_instance.import_models([models.Names.STORY]))

    def test_import_models_suggestion(self) -> None:
        """Tests import_models function with suggestion option."""
        from core.storage.suggestion import gae_models as suggestion_models
        expected_suggestion_models = (suggestion_models,)
        self.assertEqual(
            expected_suggestion_models,
            self.registry_instance.import_models([models.Names.SUGGESTION]))

    def test_import_models_topic(self) -> None:
        """Tests import_models function with topic option."""
        from core.storage.topic import gae_models as topic_models
        expected_topic_models = (topic_models,)
        self.assertEqual(
            expected_topic_models,
            self.registry_instance.import_models([models.Names.TOPIC]))

    def test_import_models_user(self) -> None:
        """Tests import_models function with user option."""
        from core.storage.user import gae_models as user_models
        expected_user_models = (user_models,)
        self.assertEqual(
            expected_user_models,
            self.registry_instance.import_models([models.Names.USER]))

    def test_import_models_invalid(self) -> None:
        """Tests import_models function with an invalid option."""
        with self.assertRaisesRegex(Exception, 'Invalid model name: '):
            # Here we use MyPy ignore because list item 0 is a string.
            # expected type class names. This is done to test the function
            # with invalid model names.
            self.registry_instance.import_models(['']) # type: ignore[list-item]

    def test_get_storage_model_classes(self) -> None:
        """Tests get_all_storage_model_classes."""
        from core.storage.user import gae_models as user_models
        classes = self.registry_instance.get_storage_model_classes(
            [models.Names.USER])
        self.assertIn(user_models.UserSettingsModel, classes)
        self.assertIn(user_models.CompletedActivitiesModel, classes)
        self.assertIn(user_models.IncompleteActivitiesModel, classes)
        self.assertIn(user_models.ExpUserLastPlaythroughModel, classes)
        self.assertIn(user_models.LearnerGoalsModel, classes)
        self.assertIn(user_models.LearnerPlaylistModel, classes)
        self.assertIn(user_models.UserContributionsModel, classes)
        self.assertIn(user_models.UserEmailPreferencesModel, classes)
        self.assertIn(user_models.UserSubscriptionsModel, classes)

    def test_get_all_storage_model_classes(self) -> None:
        """Tests get_all_storage_model_classes."""
        from core.storage.base_model import gae_models as base_models
        from core.storage.exploration import gae_models as exp_models
        from core.storage.user import gae_models as user_models
        classes = self.registry_instance.get_all_storage_model_classes()
        self.assertIn(exp_models.ExplorationModel, classes)
        self.assertIn(exp_models.ExplorationSnapshotContentModel, classes)
        self.assertIn(exp_models.ExplorationSnapshotMetadataModel, classes)
        self.assertIn(user_models.UserSettingsModel, classes)
        self.assertIn(user_models.CompletedActivitiesModel, classes)
        self.assertNotIn(base_models.BaseModel, classes)
        self.assertNotIn(base_models.BaseCommitLogEntryModel, classes)
        self.assertNotIn(base_models.VersionedModel, classes)
        self.assertNotIn(base_models.BaseSnapshotMetadataModel, classes)
        self.assertNotIn(base_models.BaseSnapshotContentModel, classes)

    def test_import_datastore_services(self) -> None:
        """Tests import datastore services function."""
        from core.platform.datastore import cloud_datastore_services
        self.assertEqual(
            self.registry_instance.import_datastore_services(),
            cloud_datastore_services)

    def test_errors_in_datastore_services_functions(self) -> None:
        """Tests datastore services functions errors."""
        from core.platform.datastore import cloud_datastore_services
        with self.assertRaisesRegex(
            Exception, 'Model names should not be duplicated in input list.'):
            cloud_datastore_services.fetch_multiple_entities_by_ids_and_models(
                [('SampleModel', ['id_1', 'id_2']),
                 ('SampleModel', ['id_3', 'id_4'])]
            )

    def test_import_transaction_services(self) -> None:
        """Tests import transaction services function."""
        from core.platform.transactions import cloud_transaction_services
        self.assertEqual(
            self.registry_instance.import_transaction_services(),
            cloud_transaction_services)

    def test_import_auth_services(self) -> None:
        """Tests import auth services function."""
        from core.platform.auth import firebase_auth_services
        self.assertIs(
            self.registry_instance.import_auth_services(),
            firebase_auth_services)

    def test_import_app_identity_services(self) -> None:
        """Tests import app identity services function."""
        from core.platform.app_identity import gae_app_identity_services
        self.assertEqual(
            self.registry_instance.import_app_identity_services(),
            gae_app_identity_services)

    def test_import_email_services_mailgun(self) -> None:
        """Tests import email services method for when email service provider is
        mailgun.
        """
        with self.swap(
            feconf, 'EMAIL_SERVICE_PROVIDER',
            feconf.EMAIL_SERVICE_PROVIDER_MAILGUN), (
                self.swap(constants, 'DEV_MODE', False)):
            from core.platform.email import mailgun_email_services
            self.assertEqual(
                mailgun_email_services,
                self.registry_instance.import_email_services())

    def test_import_email_services_invalid(self) -> None:
        """Tests import email services method for when email service provider is
        an invalid option.
        """
        with self.swap(
            feconf, 'EMAIL_SERVICE_PROVIDER',
            'invalid service provider'), (
                self.swap(constants, 'DEV_MODE', False)):
            with self.assertRaisesRegex(
                Exception,
                'Invalid email service provider: invalid service provider'
            ):
                self.registry_instance.import_email_services()

    def test_import_bulk_email_services_mailchimp(self) -> None:
        """Tests import email services method for when email service provider is
        mailchimp.
        """
        with self.swap(
            feconf, 'BULK_EMAIL_SERVICE_PROVIDER',
            feconf.BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP), (
                self.swap(constants, 'EMULATOR_MODE', False)):
            from core.platform.bulk_email import mailchimp_bulk_email_services
            self.assertEqual(
                mailchimp_bulk_email_services,
                self.registry_instance.import_bulk_email_services())

    def test_import_bulk_email_services_invalid(self) -> None:
        """Tests import email services method for when email service provider is
        an invalid option.
        """
        with self.swap(
            feconf, 'BULK_EMAIL_SERVICE_PROVIDER',
            'invalid service provider'), (
                self.swap(constants, 'EMULATOR_MODE', False)):
            with self.assertRaisesRegex(
                Exception,
                'Invalid bulk email service provider: invalid service '
                'provider'):
                self.registry_instance.import_bulk_email_services()

    def test_import_cache_services(self) -> None:
        """Tests import cache services function."""
        from core.platform.cache import redis_cache_services
        self.assertEqual(
            self.registry_instance.import_cache_services(),
            redis_cache_services)

    def test_import_taskqueue_services(self) -> None:
        """Tests import taskqueue services function."""

        class MockCloudTaskqueue():
            pass

        with self.swap(constants, 'EMULATOR_MODE', False):
            # Here we use cast because sys.modules can only accept ModuleTypes
            # but for testing purposes here we are providing MockCloudTaskqueue
            # which is of class type. So because of this MyPy throws an error.
            # Thus to avoid the error, we used cast here.
            sys.modules['core.platform.taskqueue.cloud_taskqueue_services'] = (
                cast(ModuleType, MockCloudTaskqueue)
            )
            self.assertEqual(
                self.registry_instance.import_taskqueue_services(),
                MockCloudTaskqueue)
        from core.platform.taskqueue import dev_mode_taskqueue_services
        self.assertEqual(
            self.registry_instance.import_taskqueue_services(),
            dev_mode_taskqueue_services)

    def test_import_cloud_translate_services(self) -> None:
        """Tests import cloud translate services function."""
        with self.swap(constants, 'EMULATOR_MODE', False):
            from core.platform.translate import cloud_translate_services
            self.assertEqual(
                self.registry_instance.import_translate_services(),
                cloud_translate_services)

        from core.platform.translate import dev_mode_translate_services
        self.assertEqual(
            self.registry_instance.import_translate_services(),
            dev_mode_translate_services)

    def test_import_search_services(self) -> None:
        """Tests import search services function."""
        from core.platform.search import elastic_search_services
        self.assertEqual(
            self.registry_instance.import_search_services(),
            elastic_search_services)

    def test_import_storage_services(self) -> None:
        """Tests import storage services function."""

        class MockCloudStorage():
            pass

        with self.swap(constants, 'EMULATOR_MODE', False):
            # Here we use cast because sys.modules can only accept ModuleTypes
            # but for testing purposes here we are providing MockCloudStorage
            # which is of class type. So because of this MyPy throws an error.
            # Thus to avoid the error, we used cast here.
            # Mock Cloud Storage since importing it fails in emulator env.
            sys.modules['core.platform.storage.cloud_storage_services'] = (
                cast(ModuleType, MockCloudStorage)
            )
            self.assertEqual(
                self.registry_instance.import_storage_services(),
                MockCloudStorage)

        from core.platform.storage import dev_mode_storage_services
        self.assertEqual(
            self.registry_instance.import_storage_services(),
            dev_mode_storage_services)

    def test_import_models_not_implemented_has_not_implemented_error(
            self
    ) -> None:
        """Tests NotImplementedError of Platform."""
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape(
                'import_models() method is not overwritten in '
                'derived classes')):
            models.Platform().import_models([models.Names.BASE_MODEL])
