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

from core.platform import models
from core.tests import test_utils
import feconf


class RegistryUnitTest(test_utils.GenericTestBase):
    """Tests the Registry class interface."""

    def setUp(self):
        super(RegistryUnitTest, self).setUp()
        self.registry_instance = models.Registry()

    def test_import_models_activity(self):
        """Tests import_models function with activity option."""
        from core.storage.activity import gae_models as activity_models
        expected_activity_models = (activity_models,)
        self.assertEqual(
            expected_activity_models,
            self.registry_instance.import_models([models.NAMES.activity]))

    def test_import_models_audit(self):
        """Tests import_models function with audit option."""
        from core.storage.audit import gae_models as audit_models
        expected_audit_models = (audit_models,)
        self.assertEqual(
            expected_audit_models,
            self.registry_instance.import_models([models.NAMES.audit]))

    def test_import_models_base_model(self):
        """Tests import_models function with base model option."""
        from core.storage.base_model import gae_models as base_models
        expected_base_models = (base_models,)
        self.assertEqual(
            expected_base_models,
            self.registry_instance.import_models([models.NAMES.base_model]))

    def test_import_models_classifier(self):
        """Tests import_models function with classifier option."""
        from core.storage.classifier import gae_models as classifier_data_models
        expected_classifier_models = (classifier_data_models,)
        self.assertEqual(
            expected_classifier_models,
            self.registry_instance.import_models([models.NAMES.classifier]))

    def test_import_models_collection(self):
        """Tests import_models function with collection option."""
        from core.storage.collection import gae_models as collection_models
        expected_collection_models = (collection_models,)
        self.assertEqual(
            expected_collection_models,
            self.registry_instance.import_models([models.NAMES.collection]))

    def test_import_models_config(self):
        """Tests import_models function with config option."""
        from core.storage.config import gae_models as config_models
        expected_config_models = (config_models,)
        self.assertEqual(
            expected_config_models,
            self.registry_instance.import_models([models.NAMES.config]))

    def test_import_models_email(self):
        """Tests import_models function with email option."""
        from core.storage.email import gae_models as email_models
        expected_email_models = (email_models,)
        self.assertEqual(
            expected_email_models,
            self.registry_instance.import_models([models.NAMES.email]))

    def test_import_models_exploration(self):
        """Tests import_models function with exploration option."""
        from core.storage.exploration import gae_models as exp_models
        expected_exploration_models = (exp_models,)
        self.assertEqual(
            expected_exploration_models,
            self.registry_instance.import_models([models.NAMES.exploration]))

    def test_import_models_feedback(self):
        """Tests import_models function with feedback option."""
        from core.storage.feedback import gae_models as feedback_models
        expected_feedback_models = (feedback_models,)
        self.assertEqual(
            expected_feedback_models,
            self.registry_instance.import_models([models.NAMES.feedback]))

    def test_import_models_file(self):
        """Tests import_models function with file option."""
        from core.storage.file import gae_models as file_models
        expected_file_models = (file_models,)
        self.assertEqual(
            expected_file_models,
            self.registry_instance.import_models([models.NAMES.file]))

    def test_import_models_job(self):
        """Tests import_models function with job option."""
        from core.storage.job import gae_models as job_models
        expected_job_models = (job_models,)
        self.assertEqual(
            expected_job_models,
            self.registry_instance.import_models([models.NAMES.job]))

    def test_import_models_question(self):
        """Tests import_models function with question option."""
        from core.storage.question import gae_models as question_models
        expected_question_models = (question_models,)
        self.assertEqual(
            expected_question_models,
            self.registry_instance.import_models([models.NAMES.question]))

    def test_import_models_recommendations(self):
        """Tests import_models function with recommendations option."""
        from core.storage.recommendations import gae_models as recommendations_models # pylint: disable=line-too-long
        expected_recommendations_models = (recommendations_models,)
        self.assertEqual(
            expected_recommendations_models,
            self.registry_instance.import_models(
                [models.NAMES.recommendations]))

    def test_import_models_skill(self):
        """Tests import_models function with skill option."""
        from core.storage.skill import gae_models as skill_models
        expected_skills_models = (skill_models,)
        self.assertEqual(
            expected_skills_models,
            self.registry_instance.import_models([models.NAMES.skill]))

    def test_import_models_statistics(self):
        """Tests import_models function with statistics option."""
        from core.storage.statistics import gae_models as statistics_models
        expected_statistics_models = (statistics_models,)
        self.assertEqual(
            expected_statistics_models,
            self.registry_instance.import_models([models.NAMES.statistics]))

    def test_import_models_story(self):
        """Tests import_models function with story option."""
        from core.storage.story import gae_models as story_models
        expected_story_models = (story_models,)
        self.assertEqual(
            expected_story_models,
            self.registry_instance.import_models([models.NAMES.story]))

    def test_import_models_suggestion(self):
        """Tests import_models function with suggestion option."""
        from core.storage.suggestion import gae_models as suggestion_models
        expected_suggestion_models = (suggestion_models,)
        self.assertEqual(
            expected_suggestion_models,
            self.registry_instance.import_models([models.NAMES.suggestion]))

    def test_import_models_topic(self):
        """Tests import_models function with topic option."""
        from core.storage.topic import gae_models as topic_models
        expected_topic_models = (topic_models,)
        self.assertEqual(
            expected_topic_models,
            self.registry_instance.import_models([models.NAMES.topic]))

    def test_import_models_user(self):
        """Tests import_models function with user option."""
        from core.storage.user import gae_models as user_models
        expected_user_models = (user_models,)
        self.assertEqual(
            expected_user_models,
            self.registry_instance.import_models([models.NAMES.user]))

    def test_import_models_invalid(self):
        """Tests import_models function with an invalid option."""
        with self.assertRaises(Exception):
            self.registry_instance.import_models([''])

    def test_import_current_user_services(self):
        """Tests import current user services function."""
        from core.platform.users import gae_current_user_services
        self.assertEqual(
            self.registry_instance.import_current_user_services(),
            gae_current_user_services)

    def test_import_datastore_services(self):
        """Tests import datastore services function."""
        from core.platform.datastore import gae_datastore_services
        self.assertEqual(
            self.registry_instance.import_datastore_services(),
            gae_datastore_services)

    def test_import_transaction_services(self):
        """Tests import transaction services function."""
        from core.platform.transactions import gae_transaction_services
        self.assertEqual(
            self.registry_instance.import_transaction_services(),
            gae_transaction_services)

    def test_import_app_identity_services(self):
        """Tests import app identity services function."""
        from core.platform.app_identity import gae_app_identity_services
        self.assertEqual(
            self.registry_instance.import_app_identity_services(),
            gae_app_identity_services)

    def test_import_gae_image_services(self):
        """Tests import gae image services function."""
        from core.platform.image import gae_image_services
        self.assertEqual(
            self.registry_instance.import_gae_image_services(),
            gae_image_services)

    def test_import_email_services_gae(self):
        """Tests import email services method for when email service provider is
        the default - GAE.
        """
        from core.platform.email import gae_email_services
        self.assertEqual(
            gae_email_services, self.registry_instance.import_email_services())

    def test_import_email_services_mailgun(self):
        """Tests import email services method for when email service provider is
        mailgun.
        """
        with self.swap(
            feconf, 'EMAIL_SERVICE_PROVIDER',
            feconf.EMAIL_SERVICE_PROVIDER_MAILGUN):
            from core.platform.email import mailgun_email_services
            self.assertEqual(
                mailgun_email_services,
                self.registry_instance.import_email_services())

    def test_import_email_services_invalid(self):
        """Tests import email services method for when email service provider is
        an invalid option.
        """
        with self.swap(
            feconf, 'EMAIL_SERVICE_PROVIDER',
            'invalid service provider'):
            with self.assertRaisesRegexp(
                Exception,
                'Invalid email service provider: invalid service provider'):
                self.registry_instance.import_email_services()

    def test_import_memcache_services(self):
        """Tests import memcache services function."""
        from core.platform.memcache import gae_memcache_services
        self.assertEqual(
            self.registry_instance.import_memcache_services(),
            gae_memcache_services)

    def test_import_taskqueue_services(self):
        """Tests import taskqueue services function."""
        from core.platform.taskqueue import gae_taskqueue_services
        self.assertEqual(
            self.registry_instance.import_taskqueue_services(),
            gae_taskqueue_services)

    def test_import_search_services(self):
        """Tests import search services function."""
        from core.platform.search import gae_search_services
        self.assertEqual(
            self.registry_instance.import_search_services(),
            gae_search_services)

    def test_import_models_not_implemented_has_not_implemented_error(self):
        """Tests NotImplementedError of Platform."""
        with self.assertRaises(NotImplementedError):
            models.Platform().import_models()
