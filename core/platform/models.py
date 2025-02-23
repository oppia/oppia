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

from __future__ import annotations

import inspect
from types import ModuleType  # pylint: disable=import-only-modules

from core import feconf
from core.constants import constants

from typing import List, Tuple, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models

# Constant for valid model names.
Names = feconf.ValidModelNames

# Types of deletion policies. The pragma comment is needed because Enums are
# evaluated as classes in Python and they should use PascalCase, but using
# UPPER_CASE seems more appropriate here.


MODULES_WITH_PSEUDONYMIZABLE_CLASSES = (  # pylint: disable=invalid-name
    Names.APP_FEEDBACK_REPORT, Names.BLOG, Names.COLLECTION, Names.CONFIG,
    Names.EXPLORATION, Names.FEEDBACK, Names.QUESTION, Names.SKILL, Names.STORY,
    Names.SUBTOPIC, Names.SUGGESTION, Names.TOPIC
)

GAE_PLATFORM = 'gae'


class Platform:
    """A base class for platform-specific imports related to GAE."""

    @classmethod
    def import_models(
            cls, unused_model_names: List[Names]
    ) -> Tuple[ModuleType, ...]:
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

    # We have ignored [override] here because the signature of this method
    # doesn't match with BaseModel.delete_multi().
    # https://mypy.readthedocs.io/en/stable/error_code_list.html#check-validity-of-overrides-override
    @classmethod
    def import_models(cls, model_names: List[Names]) -> Tuple[ModuleType, ...]:
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(Names). List of storage module names.

        Returns:
            tuple(module). Tuple of storage modules.

        Raises:
            Exception. Invalid model name.
        """
        returned_models: List[ModuleType] = []
        # There are a lot of ignore[no-redef] used here, since we import
        # gae_models from different folders multiple times. It is fine to use it
        # here since when we import modules using this function, we need to add
        # separate imports for mypy anyway.
        for name in model_names:
            if name == Names.ACTIVITY:
                from core.storage.activity import gae_models as activity_models
                returned_models.append(activity_models)
            elif name == Names.APP_FEEDBACK_REPORT:
                from core.storage.app_feedback_report import (
                    gae_models as app_feedback_report_models)
                returned_models.append(app_feedback_report_models)
            elif name == Names.AUDIT:
                from core.storage.audit import gae_models as audit_models
                returned_models.append(audit_models)
            elif name == Names.AUTH:
                from core.storage.auth import gae_models as auth_models
                returned_models.append(auth_models)
            elif name == Names.BASE_MODEL:
                from core.storage.base_model import gae_models as base_model
                returned_models.append(base_model)
            elif name == Names.BEAM_JOB:
                from core.storage.beam_job import gae_models as beam_job_models
                returned_models.append(beam_job_models)
            elif name == Names.BLOG:
                from core.storage.blog import gae_models as blog_models
                returned_models.append(blog_models)
            elif name == Names.BLOG_STATISTICS:
                from core.storage.blog_statistics import (
                    gae_models as blog_stats_models)
                returned_models.append(blog_stats_models)
            elif name == Names.CLASSROOM:
                from core.storage.classroom import (
                    gae_models as classroom_models)
                returned_models.append(classroom_models)
            elif name == Names.COLLECTION:
                from core.storage.collection import (
                    gae_models as collection_models)
                returned_models.append(collection_models)
            elif name == Names.CONFIG:
                from core.storage.config import gae_models as config_models
                returned_models.append(config_models)
            elif name == Names.EMAIL:
                from core.storage.email import gae_models as email_models
                returned_models.append(email_models)
            elif name == Names.EXPLORATION:
                from core.storage.exploration import gae_models as exp_models
                returned_models.append(exp_models)
            elif name == Names.FEEDBACK:
                from core.storage.feedback import gae_models as feedback_models
                returned_models.append(feedback_models)
            elif name == Names.IMPROVEMENTS:
                from core.storage.improvements import (
                    gae_models as improvements_models)
                returned_models.append(improvements_models)
            elif name == Names.JOB:
                from core.storage.job import gae_models as job_models
                returned_models.append(job_models)
            elif name == Names.LEARNER_GROUP:
                from core.storage.learner_group import (
                    gae_models as learner_group_models)
                returned_models.append(learner_group_models)
            elif name == Names.OPPORTUNITY:
                from core.storage.opportunity import (
                    gae_models as opportunity_models)
                returned_models.append(opportunity_models)
            elif name == Names.QUESTION:
                from core.storage.question import gae_models as question_models
                returned_models.append(question_models)
            elif name == Names.RECOMMENDATIONS:
                from core.storage.recommendations import (
                    gae_models as recommendations_models)
                returned_models.append(recommendations_models)
            elif name == Names.SKILL:
                from core.storage.skill import gae_models as skill_models
                returned_models.append(skill_models)
            elif name == Names.STATISTICS:
                from core.storage.statistics import (
                    gae_models as statistics_models)
                returned_models.append(statistics_models)
            elif name == Names.STORY:
                from core.storage.story import gae_models as story_models
                returned_models.append(story_models)
            elif name == Names.SUBTOPIC:
                from core.storage.subtopic import gae_models as subtopic_models
                returned_models.append(subtopic_models)
            elif name == Names.SUGGESTION:
                from core.storage.suggestion import (
                    gae_models as suggestion_models)
                returned_models.append(suggestion_models)
            elif name == Names.TOPIC:
                from core.storage.topic import gae_models as topic_models
                returned_models.append(topic_models)
            elif name == Names.TRANSLATION:
                from core.storage.translation import (
                    gae_models as translation_models)
                returned_models.append(translation_models)
            elif name == Names.USER:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            elif name == Names.VOICEOVER:
                from core.storage.voiceover import (
                    gae_models as voiceover_models)
                returned_models.append(voiceover_models)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def get_storage_model_classes(
        cls, model_names: List[Names]
    ) -> List[Type[base_models.BaseModel]]:
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
    def get_all_storage_model_classes(cls) -> List[Type[base_models.BaseModel]]:
        """Get all model classes that are saved in the storage, NOT model
        classes that are just inherited from (BaseModel,
        BaseCommitLogEntryModel, etc.).

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        model_names = [name for name in Names if name != Names.BASE_MODEL]
        return cls.get_storage_model_classes(model_names)

    @classmethod
    def import_auth_services(cls) -> ModuleType:
        """Imports and returns firebase_auth_services module.

        Returns:
            module. The firebase_auth_services module.
        """
        from core.platform.auth import firebase_auth_services
        return firebase_auth_services

    @classmethod
    def import_transaction_services(cls) -> ModuleType:
        """Imports and returns gae_transaction_services module.

        Returns:
            module. The gae_transaction_services module.
        """
        from core.platform.transactions import cloud_transaction_services
        return cloud_transaction_services

    @classmethod
    def import_datastore_services(cls) -> ModuleType:
        """Imports and returns gae_datastore_services module.

        Returns:
            module. The gae_datastore_services module.
        """
        from core.platform.datastore import cloud_datastore_services
        return cloud_datastore_services

    @classmethod
    def import_app_identity_services(cls) -> ModuleType:
        """Imports and returns gae_app_identity_services module.

        Returns:
            module. The gae_app_identity_services module.
        """
        from core.platform.app_identity import gae_app_identity_services
        return gae_app_identity_services

    @classmethod
    def import_azure_speech_synthesis_services(cls) -> ModuleType:
        """Imports and returns azure_speech_synthesis_services module.

        Returns:
            module. The azure_speech_synthesis_services module.
        """
        if constants.DEV_MODE:
            from core.platform.azure_speech_synthesis import (
                dev_mode_azure_speech_synthesis_services)
            return dev_mode_azure_speech_synthesis_services
        from core.platform.azure_speech_synthesis import (
            azure_speech_synthesis_services)
        return azure_speech_synthesis_services

    @classmethod
    def import_email_services(cls) -> ModuleType:
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
    def import_bulk_email_services(cls) -> ModuleType:
        """Imports and returns the bulk email services module specified in
        feconf.py. If in DEV_MODE, uses the dev mode version of email services.

        Returns:
            module. The email_services module to use, based on the feconf.py
            setting and DEV_MODE setting.

        Raises:
            Exception. The value of feconf.BULK_EMAIL_SERVICE_PROVIDER does not
                correspond to a valid email_services module.
        """
        if constants.EMULATOR_MODE:
            from core.platform.bulk_email import dev_mode_bulk_email_services
            return dev_mode_bulk_email_services
        elif (
                feconf.BULK_EMAIL_SERVICE_PROVIDER ==
                feconf.BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP):
            from core.platform.bulk_email import mailchimp_bulk_email_services
            return mailchimp_bulk_email_services
        else:
            raise Exception(
                'Invalid bulk email service provider: %s' % (
                    feconf.BULK_EMAIL_SERVICE_PROVIDER))

    @classmethod
    def import_cache_services(cls) -> ModuleType:
        """Imports and returns a cache_services module from core.platform.cache.

        Returns:
            module. The core.platform.cache services module.
        """
        from core.platform.cache import redis_cache_services
        return redis_cache_services

    @classmethod
    def import_taskqueue_services(cls) -> ModuleType:
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
    def import_search_services(cls) -> ModuleType:
        """Imports and returns gae_search_services module.

        Returns:
            module. The gae_search_services module.
        """
        from core.platform.search import elastic_search_services
        return elastic_search_services

    @classmethod
    def import_translate_services(cls) -> ModuleType:
        """Imports and returns cloud_translate_services module.

        Returns:
            module. The cloud_translate_services module.
        """
        if constants.EMULATOR_MODE:
            from core.platform.translate import dev_mode_translate_services
            return dev_mode_translate_services
        else:
            from core.platform.translate import cloud_translate_services
            return cloud_translate_services

    @classmethod
    def import_storage_services(cls) -> ModuleType:
        """Imports and returns cloud_translate_services module.

        Returns:
            module. The cloud_translate_services module.
        """
        if constants.EMULATOR_MODE:
            from core.platform.storage import dev_mode_storage_services
            return dev_mode_storage_services
        else:
            from core.platform.storage import cloud_storage_services
            return cloud_storage_services

    @classmethod
    def import_secrets_services(cls) -> ModuleType:
        """Imports and returns cloud_secrets_services module.

        Returns:
            module. The cloud_secrets_services module.
        """
        if constants.DEV_MODE:
            from core.platform.secrets import dev_mode_secrets_services
            return dev_mode_secrets_services
        else:
            from core.platform.secrets import cloud_secrets_services
            return cloud_secrets_services

    NAME = 'gae'


class Registry:
    """Platform-agnostic interface for retrieving platform-specific
    modules.
    """

    # Maps platform names to the corresponding module registry classes.
    _PLATFORM_MAPPING = {
        _Gae.NAME: _Gae,
    }

    @classmethod
    def _get(cls) -> Type[_Gae]:
        """Returns the appropriate interface class for platform-specific
        imports.

        Returns:
            class. The corresponding platform-specific interface class.
        """
        klass = cls._PLATFORM_MAPPING.get(GAE_PLATFORM)
        # Ruling out the possibility of None for mypy type checking.
        assert klass is not None
        return klass

    @classmethod
    def import_models(cls, model_names: List[Names]) -> Tuple[ModuleType, ...]:
        """Imports and returns the storage modules listed in model_names.

        Args:
            model_names: list(Names). List of storage modules.

        Returns:
            tuple(module). The corresponding storage-layer modules.
        """
        return cls._get().import_models(model_names)

    @classmethod
    def get_storage_model_classes(
        cls, model_names: List[Names]
    ) -> List[Type[base_models.BaseModel]]:
        """Get the storage model classes that are in the modules listed in
        model_names.

        Args:
            model_names: list(str). List of storage module names.

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        return cls._get().get_storage_model_classes(model_names)

    @classmethod
    def get_all_storage_model_classes(cls) -> List[Type[base_models.BaseModel]]:
        """Get all model classes that are saved in the storage, NOT model
        classes that are just inherited from (BaseModel,
        BaseCommitLogEntryModel, etc.).

        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        return cls._get().get_all_storage_model_classes()

    @classmethod
    def import_auth_services(cls) -> ModuleType:
        """Imports and returns auth_services module.

        Returns:
            module. The auth_services module.
        """
        return cls._get().import_auth_services()

    @classmethod
    def import_datastore_services(cls) -> ModuleType:
        """Imports and returns datastore_services module.

        Returns:
            module. The datastore_services module.
        """
        return cls._get().import_datastore_services()

    @classmethod
    def import_transaction_services(cls) -> ModuleType:
        """Imports and returns transaction_services module.

        Returns:
            module. The transaction_services module.
        """
        return cls._get().import_transaction_services()

    @classmethod
    def import_app_identity_services(cls) -> ModuleType:
        """Imports and returns app_identity_services module.

        Returns:
            module. The app_identity_services module.
        """
        return cls._get().import_app_identity_services()

    @classmethod
    def import_azure_speech_synthesis_services(cls) -> ModuleType:
        """Imports and returns azure_speech_synthesis_services module.

        Returns:
            module. The azure_speech_synthesis_services module.
        """
        return cls._get().import_azure_speech_synthesis_services()

    @classmethod
    def import_email_services(cls) -> ModuleType:
        """Imports and returns email_services module.

        Returns:
            module. The email_services module.
        """
        return cls._get().import_email_services()

    @classmethod
    def import_bulk_email_services(cls) -> ModuleType:
        """Imports and returns bulk email_services module.

        Returns:
            module. The bulk email_services module.
        """
        return cls._get().import_bulk_email_services()

    @classmethod
    def import_cache_services(cls) -> ModuleType:
        """Imports and returns the platform cache_services module.

        Returns:
            module. The platform cache_services module.
        """
        return cls._get().import_cache_services()

    @classmethod
    def import_taskqueue_services(cls) -> ModuleType:
        """Imports and returns taskqueue_services module.

        Returns:
            module. The taskqueue_services module.
        """
        return cls._get().import_taskqueue_services()

    @classmethod
    def import_translate_services(cls) -> ModuleType:
        """Imports and returns cloud_translate_services module.

        Returns:
            module. The cloud_translate_services module.
        """
        return cls._get().import_translate_services()

    @classmethod
    def import_search_services(cls) -> ModuleType:
        """Imports and returns search_services module.

        Returns:
            module. The search_services module.
        """
        return cls._get().import_search_services()

    @classmethod
    def import_storage_services(cls) -> ModuleType:
        """Imports and returns storage_services module.

        Returns:
            module. The storage_services module.
        """
        return cls._get().import_storage_services()

    @classmethod
    def import_secrets_services(cls) -> ModuleType:
        """Imports and returns secrets_services module.

        Returns:
            module. The secrets_services module.
        """
        return cls._get().import_secrets_services()
