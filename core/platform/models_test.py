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


class PlatformUnitTest(test_utils.GenericTestBase):
    """Tests platform base class."""

    def test_import_models(self):
        """Tests import_models function and that it raises
        NotImplementedError.
        """
        platform_obj = models._Platform()
        with self.assertRaises(NotImplementedError):
            platform_obj.import_models()


class GaeUnitTest(test_utils.GenericTestBase):
    """Tests Google App Engine imports."""

    def setUp(self):
        super(GaeUnitTest, self).setUp()

        self.gae_platform = models._Gae()

    def test_import_models_activity(self):
        """Tests import_models function with activity option."""
        from core.storage.activity import gae_models as activity_models
        expected_activity_model = []
        expected_activity_model.append(activity_models)
        self.assertEqual(
            tuple(expected_activity_model),
            self.gae_platform.import_models([models.NAMES.activity]))

    def test_import_models_audit(self):
        """Tests import_models function with audit option."""
        from core.storage.audit import gae_models as audit_models
        expected_audit_model = [audit_models]
        self.assertEqual(
            tuple(expected_audit_model),
            self.gae_platform.import_models([models.NAMES.audit]))

    def test_import_models_base_model(self):
        """Tests import_models function with base model option."""
        from core.storage.base_model import gae_models as base_models
        expected_base_models = []
        expected_base_models.append(base_models)
        self.assertEqual(
            tuple(expected_base_models),
            self.gae_platform.import_models([models.NAMES.base_model]))

    def test_import_models_classifier(self):
        """Tests import_models function with classifier option."""
        from core.storage.classifier import gae_models as classifier_data_models # pylint: disable=line-too-long
        expected_classifier_models = []
        expected_classifier_models.append(classifier_data_models)
        self.assertEqual(
            tuple(expected_classifier_models),
            self.gae_platform.import_models([models.NAMES.classifier]))

    def test_import_models_collection(self):
        """Tests import_models function with collection option."""
        from core.storage.collection import gae_models as collection_models # pylint: disable=line-too-long
        expected_collection_models = []
        expected_collection_models.append(collection_models)
        self.assertEqual(
            tuple(expected_collection_models),
            self.gae_platform.import_models([models.NAMES.collection]))

    def test_import_models_config(self):
        """Tests import_models function with config option."""
        from core.storage.config import gae_models as config_models
        expected_config_models = []
        expected_config_models.append(config_models)
        self.assertEqual(
            tuple(expected_config_models),
            self.gae_platform.import_models([models.NAMES.config]))

    def test_import_models_email(self):
        """Tests import_models function with email option."""
        from core.storage.email import gae_models as email_models
        expected_email_models = []
        expected_email_models.append(email_models)
        self.assertEqual(
            tuple(expected_email_models),
            self.gae_platform.import_models([models.NAMES.email]))

    def test_import_models_exploration(self):
        """Tests import_models function with exploration option."""
        from core.storage.exploration import gae_models as exp_models
        expected_exploration_models = []
        expected_exploration_models.append(exp_models)
        self.assertEqual(
            tuple(expected_exploration_models),
            self.gae_platform.import_models([models.NAMES.exploration]))

    def test_import_models_feedback(self):
        """Tests import_models function with feedback option."""
        from core.storage.feedback import gae_models as feedback_models
        expected_feedback_models = []
        expected_feedback_models.append(feedback_models)
        self.assertEqual(
            tuple(expected_feedback_models),
            self.gae_platform.import_models([models.NAMES.feedback]))

    def test_import_models_file(self):
        """Tests import_models function with file option."""
        from core.storage.file import gae_models as file_models
        expected_file_models = []
        expected_file_models.append(file_models)
        self.assertEqual(
            tuple(expected_file_models),
            self.gae_platform.import_models([models.NAMES.file]))

    def test_import_models_job(self):
        """Tests import_models function with job option."""
        from core.storage.job import gae_models as job_models
        expected_job_models = []
        expected_job_models.append(job_models)
        self.assertEqual(
            tuple(expected_job_models),
            self.gae_platform.import_models([models.NAMES.job]))

    def test_import_models_question(self):
        """Tests import_models function with question option."""
        from core.storage.question import gae_models as question_models
        expected_question_models = []
        expected_question_models.append(question_models)
        self.assertEqual(
            tuple(expected_question_models),
            self.gae_platform.import_models([models.NAMES.question]))

    def test_import_models_recommendations(self):
        """Tests import_models function with recommendations option."""
        from core.storage.recommendations import gae_models as recommendations_models # pylint: disable=line-too-long
        expected_recommendations_models = []
        expected_recommendations_models.append(recommendations_models)
        self.assertEqual(
            tuple(expected_recommendations_models),
            self.gae_platform.import_models([models.NAMES.recommendations]))

    def test_import_models_skill(self):
        """Tests import_models function with skill option."""
        from core.storage.skill import gae_models as skill_models
        expected_skills_models = [skill_models]
        self.assertEqual(
            tuple(expected_skills_models),
            self.gae_platform.import_models([models.NAMES.skill]))

    def test_import_models_statistics(self):
        """Tests import_models function with statistics option."""
        from core.storage.statistics import gae_models as statistics_models # pylint: disable=line-too-long
        expected_statistics_models = []
        expected_statistics_models.append(statistics_models)
        self.assertEqual(
            tuple(expected_statistics_models),
            self.gae_platform.import_models([models.NAMES.statistics]))

    def test_import_models_story(self):
        """Tests import_models function with story option."""
        from core.storage.story import gae_models as story_models
        expected_story_models = []
        expected_story_models.append(story_models)
        self.assertEqual(
            tuple(expected_story_models),
            self.gae_platform.import_models([models.NAMES.story]))

    def test_import_models_suggestion(self):
        """Tests import_models function with suggestion option."""
        from core.storage.suggestion import gae_models as suggestion_models
        expected_suggestion_models = []
        expected_suggestion_models.append(suggestion_models)
        self.assertEqual(
            tuple(expected_suggestion_models),
            self.gae_platform.import_models([models.NAMES.suggestion]))

    def test_import_models_topic(self):
        """Tests import_models function with topic option."""
        from core.storage.topic import gae_models as topic_models
        expected_topic_models = []
        expected_topic_models.append(topic_models)
        self.assertEqual(
            tuple(expected_topic_models),
            self.gae_platform.import_models([models.NAMES.topic]))

    def test_import_models_user(self):
        """Tests import_models function with user option."""
        from core.storage.user import gae_models as user_models
        expected_user_models = []
        expected_user_models.append(user_models)
        self.assertEqual(
            tuple(expected_user_models),
            self.gae_platform.import_models([models.NAMES.user]))

    def test_import_models_invalid(self):
        """Tests import_models function with an invalid option."""
        with self.assertRaises(Exception):
            self.gae_platform.import_models([''])

    def test_import_transaction_services(self):
        """Tests import transaction services method."""
        from core.platform.transactions import gae_transaction_services as transaction_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_transaction_services(),
            transaction_services)

    def test_import_current_user_services(self):
        """Tests import current user services method."""
        from core.platform.users import gae_current_user_services as current_user_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_current_user_services(),
            current_user_services)

    def test_import_datastore_services(self):
        """Tests import datastore services method."""
        from core.platform.datastore import gae_datastore_services as datastore_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_datastore_services(), datastore_services)

    def test_import_app_identity_services(self):
        """Tests import app identity services method."""
        from core.platform.app_identity import gae_app_identity_services as identity_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_app_identity_services(), identity_services)

    def test_import_gae_image_services(self):
        """Tests import GAE image services method."""
        from core.platform.image import gae_image_services as image_services
        self.assertEqual(
            self.gae_platform.import_gae_image_services(), image_services)

    def test_import_email_services_gae(self):
        """Tests import email services method for when email service provider is
        the default - GAE.
        """
        from core.platform.email import gae_email_services as gae_email_serv
        self.assertEqual(
            gae_email_serv, self.gae_platform.import_email_services())

    def test_import_email_services_mailgun(self):
        """Tests import email services method for when email service provider is
        mailgun.
        """
        feconf.EMAIL_SERVICE_PROVIDER = feconf.EMAIL_SERVICE_PROVIDER_MAILGUN
        from core.platform.email import mailgun_email_services as mailgun_serv
        self.assertEqual(
            mailgun_serv, self.gae_platform.import_email_services())

    def test_import_email_services_invalid(self):
        """Tests import email services method for when email service provider is
        an invalid option.
        """
        feconf.EMAIL_SERVICE_PROVIDER = 'invalid service provider'
        with self.assertRaisesRegexp(
            Exception,
            'Invalid email service provider: invalid service provider'):
            self.gae_platform.import_email_services()

    def test_import_memcache_services(self):
        """Tests import memcache services method."""
        from core.platform.memcache import gae_memcache_services as memcache_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_memcache_services(),
            memcache_services)

    def test_import_taskqueue_services(self):
        """Tests import taskqueue services method."""
        from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services # pylint: disable=line-too-long
        self.assertEqual(
            self.gae_platform.import_taskqueue_services(),
            taskqueue_services)

    def test_import_search_services(self):
        """Tests import search services method."""
        from core.platform.search import gae_search_services as search_services
        self.assertEqual(
            self.gae_platform.import_search_services(),
            search_services)


class RegistryUnitTest(test_utils.GenericTestBase):
    """Tests the Registry class interface."""

    def setUp(self):
        super(RegistryUnitTest, self).setUp()
        self.registry_instance = models.Registry()

    def test_get_method(self):
        """Tests get method."""
        self.assertEqual(models._Gae, self.registry_instance._get())

    def test_import_models(self):
        """Tests import models function."""
        from core.storage.activity import gae_models as activity_models
        expected_activity_model = [activity_models]
        self.assertEqual(
            tuple(expected_activity_model),
            self.registry_instance.import_models([models.NAMES.activity]))

    def test_import_current_user_services(self):
        """Tests import current user services function."""
        from core.platform.users import gae_current_user_services as current_user_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_current_user_services(),
            current_user_services)

    def test_import_datastore_services(self):
        """Tests import datastore services function."""
        from core.platform.datastore import gae_datastore_services as datastore_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_datastore_services(),
            datastore_services)

    def test_import_transaction_services(self):
        """Tests import transaction services function."""
        from core.platform.transactions import gae_transaction_services as transaction_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_transaction_services(),
            transaction_services)

    def test_import_app_identity_services(self):
        """Tests import app identity services function."""
        from core.platform.app_identity import gae_app_identity_services as identity_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_app_identity_services(),
            identity_services)

    def test_import_gae_image_services(self):
        """Tests import gae image services function."""
        from core.platform.image import gae_image_services as image_services
        self.assertEqual(
            self.registry_instance.import_gae_image_services(),
            image_services)

    def test_import_email_services(self):
        """Tests import email services function."""
        feconf.EMAIL_SERVICE_PROVIDER = feconf.EMAIL_SERVICE_PROVIDER_GAE
        from core.platform.email import gae_email_services as gae_email_serv
        self.assertEqual(
            gae_email_serv,
            self.registry_instance.import_email_services())

    def test_import_memcache_services(self):
        """Tests import memcache services function."""
        from core.platform.memcache import gae_memcache_services as memcache_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_memcache_services(),
            memcache_services)

    def test_import_taskqueue_services(self):
        """Tests import taskqueue services function."""
        from core.platform.taskqueue import gae_taskqueue_services as taskqueue_services  # pylint: disable=line-too-long
        self.assertEqual(
            self.registry_instance.import_taskqueue_services(),
            taskqueue_services)

    def test_import_search_services(self):
        """Tests import search services function."""
        from core.platform.search import gae_search_services as search_services
        self.assertEqual(
            self.registry_instance.import_search_services(),
            search_services)
