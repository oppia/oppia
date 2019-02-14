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

"""Interface for storage model switching."""

import feconf
import utils

# Valid model names.
NAMES = utils.create_enum(
    'activity', 'audit', 'base_model', 'classifier', 'collection', 'config',
    'email', 'exploration', 'feedback', 'file', 'job', 'question',
    'recommendations', 'skill', 'statistics', 'story', 'suggestion', 'topic',
    'user')

GAE_PLATFORM = 'gae'


class Platform(object):
    """A base class for platform-specific imports related to GAE."""

    @classmethod
    def import_models(cls):
        """An abstract method that should be implemented on inherited
        classes.

        Raises:
            NotImplementedError: The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError


class _Gae(Platform):
    """Provides platform-specific imports related to
    GAE (Google App Engine).
    """

    @classmethod
    def import_models(cls, model_names):
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(str). List of storage module names.

        Returns:
            tuple(module): Tuple of storage modules.

        Raises:
            Exception: Invalid model name.
        """
        returned_models = []
        for name in model_names:
            if name == NAMES.activity:
                from core.storage.activity import gae_models as activity_models
                returned_models.append(activity_models)
            elif name == NAMES.audit:
                from core.storage.audit import gae_models as audit_models
                returned_models.append(audit_models)
            elif name == NAMES.base_model:
                from core.storage.base_model import gae_models as base_models
                returned_models.append(base_models)
            elif name == NAMES.classifier:
                from core.storage.classifier import gae_models as classifier_data_models # pylint: disable=line-too-long
                returned_models.append(classifier_data_models)
            elif name == NAMES.collection:
                from core.storage.collection import gae_models as collection_models # pylint: disable=line-too-long
                returned_models.append(collection_models)
            elif name == NAMES.config:
                from core.storage.config import gae_models as config_models
                returned_models.append(config_models)
            elif name == NAMES.email:
                from core.storage.email import gae_models as email_models
                returned_models.append(email_models)
            elif name == NAMES.exploration:
                from core.storage.exploration import gae_models as exp_models
                returned_models.append(exp_models)
            elif name == NAMES.feedback:
                from core.storage.feedback import gae_models as feedback_models
                returned_models.append(feedback_models)
            elif name == NAMES.file:
                from core.storage.file import gae_models as file_models
                returned_models.append(file_models)
            elif name == NAMES.job:
                from core.storage.job import gae_models as job_models
                returned_models.append(job_models)
            elif name == NAMES.question:
                from core.storage.question import gae_models as question_models
                returned_models.append(question_models)
            elif name == NAMES.recommendations:
                from core.storage.recommendations import gae_models as recommendations_models # pylint: disable=line-too-long
                returned_models.append(recommendations_models)
            elif name == NAMES.skill:
                from core.storage.skill import gae_models as skill_models
                returned_models.append(skill_models)
            elif name == NAMES.statistics:
                from core.storage.statistics import gae_models as statistics_models # pylint: disable=line-too-long
                returned_models.append(statistics_models)
            elif name == NAMES.story:
                from core.storage.story import gae_models as story_models
                returned_models.append(story_models)
            elif name == NAMES.suggestion:
                from core.storage.suggestion import gae_models as suggestion_models # pylint: disable=line-too-long
                returned_models.append(suggestion_models)
            elif name == NAMES.topic:
                from core.storage.topic import gae_models as topic_models
                returned_models.append(topic_models)
            elif name == NAMES.user:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def import_transaction_services(cls):
        """Imports and returns gae_transaction_services module.

        Returns:
            module. The gae_transaction_services module.
        """
        from core.platform.transactions import gae_transaction_services
        return gae_transaction_services

    @classmethod
    def import_current_user_services(cls):
        """Imports and returns gae_current_user_services module.

        Returns:
            module. The gae_current_user_services module.
        """
        from core.platform.users import gae_current_user_services
        return gae_current_user_services

    @classmethod
    def import_datastore_services(cls):
        """Imports and returns gae_datastore_services module.

        Returns:
            module. The gae_datastore_services module.
        """
        from core.platform.datastore import gae_datastore_services
        return gae_datastore_services

    @classmethod
    def import_app_identity_services(cls):
        """Imports and returns gae_app_identity_services module.

        Returns:
            module. The gae_app_identity_services module.
        """
        from core.platform.app_identity import gae_app_identity_services
        return gae_app_identity_services

    @classmethod
    def import_gae_image_services(cls):
        """Imports and returns gae_image_services module.

        Returns:
            module. The gae_image_services module.
        """
        from core.platform.image import gae_image_services
        return gae_image_services

    @classmethod
    def import_email_services(cls):
        """Imports and returns the email services module specified in feconf.py.

        Returns:
            module. The email_services module to use, based on the feconf.py
            setting.

        Raises:
            Exception: feconf.EMAIL_SERVICE_PROVIDER does not correspond
            to a valid email_services module.
        """
        if feconf.EMAIL_SERVICE_PROVIDER == feconf.EMAIL_SERVICE_PROVIDER_GAE:
            from core.platform.email import gae_email_services
            return gae_email_services
        elif (feconf.EMAIL_SERVICE_PROVIDER ==
              feconf.EMAIL_SERVICE_PROVIDER_MAILGUN):
            from core.platform.email import mailgun_email_services
            return mailgun_email_services
        else:
            raise Exception(
                ('Invalid email service provider: %s'
                 % feconf.EMAIL_SERVICE_PROVIDER))

    @classmethod
    def import_memcache_services(cls):
        """Imports and returns gae_memcache_services.

        Returns:
            module. The gae_memcache_services module.
        """
        from core.platform.memcache import gae_memcache_services
        return gae_memcache_services

    @classmethod
    def import_taskqueue_services(cls):
        """Imports and returns gae_taskqueue_services module.

        Returns:
            module. The gae_taskqueue_services module.
        """
        from core.platform.taskqueue import gae_taskqueue_services
        return gae_taskqueue_services

    @classmethod
    def import_search_services(cls):
        """Imports and returns gae_search_services module.

        Returns:
            module. The gae_search_services module.
        """
        from core.platform.search import gae_search_services
        return gae_search_services

    NAME = 'gae'


class Registry(object):
    """Platform-agnostic interface for retrieving platform-specific
    modules.
    """

    # Maps platform names to the corresponding module registry classes.
    _PLATFORM_MAPPING = {
        _Gae.NAME: _Gae,
    }

    @classmethod
    def _get(cls):
        """Returns the appropriate interface class for platform-specific
        imports.

        Returns:
            class: The corresponding platform-specific interface class.
        """
        return cls._PLATFORM_MAPPING.get(GAE_PLATFORM)

    @classmethod
    def import_models(cls, model_names):
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(str). List of storage module names.

        Returns:
            list(module). The corresponding storage-layer modules.
        """
        return cls._get().import_models(model_names)

    @classmethod
    def import_current_user_services(cls):
        """Imports and returns current_user_services module.

        Returns:
            module. The current_user_services module.
        """
        return cls._get().import_current_user_services()

    @classmethod
    def import_datastore_services(cls):
        """Imports and returns datastore_services module.

        Returns:
            module. The datastore_services module.
        """
        return cls._get().import_datastore_services()

    @classmethod
    def import_transaction_services(cls):
        """Imports and returns transaction_services module.

        Returns:
            module. The transaction_services module.
        """
        return cls._get().import_transaction_services()

    @classmethod
    def import_app_identity_services(cls):
        """Imports and returns app_identity_services module.

        Returns:
            module. The app_identity_services module.
        """
        return cls._get().import_app_identity_services()

    @classmethod
    def import_gae_image_services(cls):
        """Imports and returns gae_image_services module.

        Returns:
            module. The gae_image_services module.
        """
        return cls._get().import_gae_image_services()

    @classmethod
    def import_email_services(cls):
        """Imports and returns email_services module.

        Returns:
            module. The email_services module.
        """
        return cls._get().import_email_services()

    @classmethod
    def import_memcache_services(cls):
        """Imports and returns memcache_services module.

        Returns:
            module. The memcache_services module.
        """
        return cls._get().import_memcache_services()

    @classmethod
    def import_taskqueue_services(cls):
        """Imports and returns taskqueue_services module.

        Returns:
            module. The taskqueue_services module.
        """
        return cls._get().import_taskqueue_services()

    @classmethod
    def import_search_services(cls):
        """Imports and returns search_services module.

        Returns:
            module. The search_services module.
        """
        return cls._get().import_search_services()
