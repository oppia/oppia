"""Interface for storage model switching."""
from __future__ import annotations
import enum
import inspect
from types import ModuleType  
from core import feconf
from core.constants import constants
from typing import List, Tuple, Type
MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models  
class NAMES(enum.Enum): 
    """Enum for valid model names."""
    activity = 'activity' 
    AppFeedbackReport = 'app_feedback_report' 
    audit = 'audit' 
    BaseModel = 'base_model' 
    BeamJob = 'beam_job' 
    blog = 'blog' 
    classifier = 'classifier' 
    collection = 'collection' 
    config = 'config' 
    email = 'email' 
    exploration = 'exploration' 
    feedback = 'feedback' 
    improvements = 'improvements' 
    job = 'job' 
    opportunity = 'opportunity' 
    question = 'question' 
    recommendations = 'recommendations' 
    skill = 'skill' 
    statistics = 'statistics' 
    auth = 'auth' 
    story = 'story' 
    subtopic = 'subtopic' 
    suggestion = 'suggestion' 
    topic = 'topic' 
    translation = 'translation' 
    user = 'user' 
MODULES_WITH_PSEUDONYMIZABLE_CLASSES = (  
    NAMES.AppFeedbackReport, NAMES.blog, NAMES.collection, NAMES.config,
    NAMES.exploration, NAMES.feedback, NAMES.question, NAMES.skill, NAMES.story,
    NAMES.subtopic, NAMES.suggestion, NAMES.topic
)
GAE_PLATFORM = 'gae'
class Platform:
    """A base class for platform-specific imports related to GAE."""
    @classmethod
    def import_models(
            cls, unused_model_names: List[NAMES]
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
    @classmethod
    def import_models(cls, model_names: List[NAMES]) -> Tuple[ModuleType, ...]:
        """Imports and returns the storage modules listed in model_names.
        Args:
            model_names: list(NAMES). List of storage module names.
        Returns:
            tuple(module). Tuple of storage modules.
        Raises:
            Exception. Invalid model name.
        """
        returned_models: List[ModuleType] = []
        for name in model_names:
            if name == NAMES.activity:
                from core.storage.activity import gae_models as activity_models
                returned_models.append(activity_models)
            elif name == NAMES.AppFeedbackReport:
                from core.storage.app_feedback_report import (
                    gae_models as app_feedback_report_models)
                returned_models.append(app_feedback_report_models)
            elif name == NAMES.audit:
                from core.storage.audit import gae_models as audit_models
                returned_models.append(audit_models)
            elif name == NAMES.auth:
                from core.storage.auth import gae_models as auth_models
                returned_models.append(auth_models)
            elif name == NAMES.BaseModel:
                from core.storage.base_model import gae_models as base_model
                returned_models.append(base_model)
            elif name == NAMES.BeamJob:
                from core.storage.beam_job import gae_models as beam_job_models
                returned_models.append(beam_job_models)
            elif name == NAMES.blog:
                from core.storage.blog import gae_models as blog_models
                returned_models.append(blog_models)
            elif name == NAMES.classifier:
                from core.storage.classifier import (
                    gae_models as classifier_models)
                returned_models.append(classifier_models)
            elif name == NAMES.collection:
                from core.storage.collection import (
                    gae_models as collection_models)
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
                from core.storage.improvements import (
                    gae_models as improvements_models)
                returned_models.append(improvements_models)
            elif name == NAMES.job:
                from core.storage.job import gae_models as job_models
                returned_models.append(job_models)
            elif name == NAMES.opportunity:
                from core.storage.opportunity import (
                    gae_models as opportunity_models)
                returned_models.append(opportunity_models)
            elif name == NAMES.question:
                from core.storage.question import gae_models as question_models
                returned_models.append(question_models)
            elif name == NAMES.recommendations:
                from core.storage.recommendations import (
                    gae_models as recommendations_models)
                returned_models.append(recommendations_models)
            elif name == NAMES.skill:
                from core.storage.skill import gae_models as skill_models
                returned_models.append(skill_models)
            elif name == NAMES.statistics:
                from core.storage.statistics import (
                    gae_models as statistics_models)
                returned_models.append(statistics_models)
            elif name == NAMES.story:
                from core.storage.story import gae_models as story_models
                returned_models.append(story_models)
            elif name == NAMES.subtopic:
                from core.storage.subtopic import gae_models as subtopic_models
                returned_models.append(subtopic_models)
            elif name == NAMES.suggestion:
                from core.storage.suggestion import (
                    gae_models as suggestion_models)
                returned_models.append(suggestion_models)
            elif name == NAMES.topic:
                from core.storage.topic import gae_models as topic_models
                returned_models.append(topic_models)
            elif name == NAMES.translation:
                from core.storage.translation import (
                    gae_models as translation_models)
                returned_models.append(translation_models)
            elif name == NAMES.user:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            else:
                raise Exception('Invalid model name: %s' % name)
        return tuple(returned_models)
    @classmethod
    def get_storage_model_classes(
            cls, model_names: List[NAMES]
    ) -> List[base_models.BaseModel]:
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
    def get_all_storage_model_classes(cls) -> List[base_models.BaseModel]:
        """Get all model classes that are saved in the storage, NOT model
        classes that are just inherited from (BaseModel,
        BaseCommitLogEntryModel, etc.).
        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        model_names = [name for name in NAMES if name != NAMES.BaseModel]
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
    NAME = 'gae'
class Registry:
    """Platform-agnostic interface for retrieving platform-specific
    modules.
    """
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
    def import_models(cls, model_names: List[NAMES]) -> Tuple[ModuleType, ...]:
        """Imports and returns the storage modules listed in model_names.
        Args:
            model_names: list(NAMES). List of storage modules.
        Returns:
            tuple(module). The corresponding storage-layer modules.
        """
        return cls._get().import_models(model_names)
    @classmethod
    def get_storage_model_classes(
            cls, model_names: List[NAMES]
    ) -> List[base_models.BaseModel]:
        """Get the storage model classes that are in the modules listed in
        model_names.
        Args:
            model_names: list(str). List of storage module names.
        Returns:
            list(class). The corresponding storage-layer model classes.
        """
        return cls._get().get_storage_model_classes(model_names)
    @classmethod
    def get_all_storage_model_classes(cls) -> List[base_models.BaseModel]:
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
