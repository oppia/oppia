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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import inspect

from constants import constants
import feconf
import python_utils

# Valid model names.
NAMES = python_utils.create_enum(
    'activity', 'app_feedback_report', 'audit', 'base_model', 'beam_job',
    'blog', 'classifier', 'collection', 'config', 'email', 'exploration',
    'feedback', 'improvements', 'job', 'opportunity', 'question',
    'recommendations', 'skill', 'statistics', 'activity', 'audit', 'auth',
    'base_model', 'classifier', 'collection', 'config', 'email', 'exploration',
    'feedback', 'improvements', 'job', 'opportunity', 'question',
    'recommendations', 'skill', 'statistics', 'story', 'subtopic', 'suggestion',
    'topic', 'translation', 'user')

# Types of deletion policies. The pragma comment is needed because Enums are
# evaluated as classes in Python and they should use PascalCase, but using
# UPPER_CASE seems more appropriate here.
MODULES_WITH_PSEUDONYMIZABLE_CLASSES = (  # pylint: disable=invalid-name
    NAMES.app_feedback_report, NAMES.blog, NAMES.collection, NAMES.config,
    NAMES.exploration, NAMES.feedback, NAMES.question, NAMES.skill, NAMES.story,
    NAMES.subtopic, NAMES.suggestion, NAMES.topic)

GAE_PLATFORM = 'gae'


class Platform(python_utils.OBJECT):
    """A base class for platform-specific imports related to GAE."""

    @classmethod
    def import_models(cls):
        """An abstract method that should be implemented on inherited
        classes.

        Raises:
            NotImplementedError. The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError(
            'import_models() method is not overwritten in derived classes')


class _Gae(Platform):
    """Provides platform-specific imports related to
    GAE (Google App Engine).
    """

    @classmethod
    def import_models(cls, model_names):
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(NAMES). List of storage module names.

        Returns:
            tuple(module). Tuple of storage modules.

        Raises:
            Exception. Invalid model name.
        """
        returned_models = []
        for name in model_names:
            if name == NAMES.activity:
                from core.storage.activity import gae_models as activity_models
                returned_models.append(activity_models)
            elif name == NAMES.app_feedback_report:
                from core.storage.app_feedback_report import gae_models as app_feedback_report_models # pylint: disable=line-too-long
                returned_models.append(app_feedback_report_models)
            elif name == NAMES.audit:
                from core.storage.audit import gae_models as audit_models
                returned_models.append(audit_models)
            elif name == NAMES.auth:
                from core.storage.auth import gae_models as auth_models
                returned_models.append(auth_models)
            elif name == NAMES.base_model:
                from core.storage.base_model import gae_models as base_models
                returned_models.append(base_models)
            elif name == NAMES.beam_job:
                from core.storage.beam_job import gae_models as beam_job_models
                returned_models.append(beam_job_models)
            elif name == NAMES.blog:
                from core.storage.blog import gae_models as blog_models # pylint: disable=line-too-long
                returned_models.append(blog_models)
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
            elif name == NAMES.improvements:
                from core.storage.improvements import gae_models as improvements_models # pylint: disable=line-too-long
                returned_models.append(improvements_models)
            elif name == NAMES.job:
                from core.storage.job import gae_models as job_models
                returned_models.append(job_models)
            elif name == NAMES.opportunity:
                from core.storage.opportunity import gae_models as opportunity_models # pylint: disable=line-too-long
                returned_models.append(opportunity_models)
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
            elif name == NAMES.subtopic:
                from core.storage.subtopic import gae_models as subtopic_models # pylint: disable=line-too-long
                returned_models.append(subtopic_models)
            elif name == NAMES.suggestion:
                from core.storage.suggestion import gae_models as suggestion_models # pylint: disable=line-too-long
                returned_models.append(suggestion_models)
            elif name == NAMES.topic:
                from core.storage.topic import gae_models as topic_models
                returned_models.append(topic_models)
            elif name == NAMES.translation:
                from core.storage.translation import gae_models as translation_models # pylint: disable=line-too-long
                returned_models.append(translation_models)
            elif name == NAMES.user:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def get_storage_model_classes(cls, model_names):
        """Get the storage model classes that are in the modules listed in
        model_names.

        Args:
            model_names: list(str). List of storage module names.

        Returns:
            list(class). The corresponding storage-layer model classes.
        """

        model_classes = []
        for module in cls.import_models(model_names):
            for member_name, member_obj in inspect.getmembers(module):
                if inspect.isclass(member_obj):
                    clazz = getattr(module, member_name)
                    all_base_classes = [
                        base_class.__name__ for base_class in inspect.getmro(
                            clazz)]
                    if 'Model' in all_base_classes:
                        model_classes.append(clazz)
        return model_classes

    @classmethod
    def get_all_storage_model_classes(cls):
        """Get all model classes that are saved in the storage, NOT model
        classes that are just inherited from (BaseModel,
        BaseCommitLogEntryModel, etc.).

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        model_names = [name for name in NAMES if name != NAMES.base_model]
        return cls.get_storage_model_classes(model_names)

    @classmethod
    def import_auth_services(cls):
        """Imports and returns firebase_auth_services module.

        Returns:
            module. The firebase_auth_services module.
        """
        from core.platform.auth import firebase_auth_services
        return firebase_auth_services

    @classmethod
    def import_transaction_services(cls):
        """Imports and returns gae_transaction_services module.

        Returns:
            module. The gae_transaction_services module.
        """
        from core.platform.transactions import gae_transaction_services
        return gae_transaction_services

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
    def import_email_services(cls):
        """Imports and returns the email services module specified in feconf.py.
        If in DEV_MODE, uses the dev mode version of email services.

        Returns:
            module. The email_services module to use, based on the feconf.py
            setting and DEV_MODE setting.

        Raises:
            Exception. The value of feconf.EMAIL_SERVICE_PROVIDER does not
                correspond to a valid email_services module.
        """
        if constants.DEV_MODE:
            from core.platform.email import dev_mode_email_services
            return dev_mode_email_services
        elif (
                feconf.EMAIL_SERVICE_PROVIDER ==
                feconf.EMAIL_SERVICE_PROVIDER_MAILGUN):
            from core.platform.email import mailgun_email_services
            return mailgun_email_services
        else:
            raise Exception(
                'Invalid email service provider: %s' % (
                    feconf.EMAIL_SERVICE_PROVIDER))

    @classmethod
    def import_cache_services(cls):
        """Imports and returns a cache_services module from core.platform.cache.

        Returns:
            module. The core.platform.cache services module.
        """
        from core.platform.cache import redis_cache_services
        return redis_cache_services

    @classmethod
    def import_taskqueue_services(cls):
        """Imports and returns a taskqueue_services module from
        core.platform.taskqueue.

        Returns:
            module. The core.platform.taskqueue services module.
        """
        if constants.EMULATOR_MODE:
            from core.platform.taskqueue import dev_mode_taskqueue_services
            return dev_mode_taskqueue_services
        else:
            from core.platform.taskqueue import cloud_taskqueue_services
            return cloud_taskqueue_services

    @classmethod
    def import_search_services(cls):
        """Imports and returns gae_search_services module.

        Returns:
            module. The gae_search_services module.
        """
        from core.platform.search import elastic_search_services
        return elastic_search_services

    @classmethod
    def import_cloud_translate_services(cls):
        """Imports and returns cloud_translate_services module.

        Returns:
            module. The cloud_translate_services module.
        """
        if constants.EMULATOR_MODE:
            from core.platform.cloud_translate import (
                dev_mode_cloud_translate_services)
            return dev_mode_cloud_translate_services
        else:
            from core.platform.cloud_translate import cloud_translate_services
            return cloud_translate_services

    NAME = 'gae'


class Registry(python_utils.OBJECT):
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
            class. The corresponding platform-specific interface class.
        """
        return cls._PLATFORM_MAPPING.get(GAE_PLATFORM)

    @classmethod
    def import_models(cls, model_names):
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(NAMES). List of storage modules.

        Returns:
            list(module). The corresponding storage-layer modules.
        """
        return cls._get().import_models(model_names)

    @classmethod
    def get_storage_model_classes(cls, model_names):
        """Get the storage model classes that are in the modules listed in
        model_names.

        Args:
            model_names: list(str). List of storage module names.

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        return cls._get().get_storage_model_classes(model_names)

    @classmethod
    def get_all_storage_model_classes(cls):
        """Get all model classes that are saved in the storage, NOT model
        classes that are just inherited from (BaseModel,
        BaseCommitLogEntryModel, etc.).

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        return cls._get().get_all_storage_model_classes()

    @classmethod
    def import_auth_services(cls):
        """Imports and returns auth_services module.

        Returns:
            module. The auth_services module.
        """
        return cls._get().import_auth_services()

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
    def import_email_services(cls):
        """Imports and returns email_services module.

        Returns:
            module. The email_services module.
        """
        return cls._get().import_email_services()

    @classmethod
    def import_cache_services(cls):
        """Imports and returns the platform cache_services module.

        Returns:
            module. The platform cache_services module.
        """
        return cls._get().import_cache_services()

    @classmethod
    def import_taskqueue_services(cls):
        """Imports and returns taskqueue_services module.

        Returns:
            module. The taskqueue_services module.
        """
        return cls._get().import_taskqueue_services()

    @classmethod
    def import_cloud_translate_services(cls):
        """Imports and returns cloud_translate_services module.

        Returns:
            module. The cloud_translate_services module.
        """
        return cls._get().import_cloud_translate_services()

    @classmethod
    def import_search_services(cls):
        """Imports and returns search_services module.

        Returns:
            module. The search_services module.
        """
        return cls._get().import_search_services()
