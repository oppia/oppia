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
    'activity', 'base_model', 'classifier', 'collection', 'config', 'email',
    'exploration', 'feedback', 'file', 'job', 'recommendations', 'statistics',
    'user')


class _Platform(object):
    @classmethod
    def import_models(cls):
        raise NotImplementedError


class _Gae(_Platform):
    """Google App Engine Model.
    Super model of the Registry Model and implements all the 
    methods of Registry.
    """
    @classmethod
    def import_models(cls, model_names):
        """Imports and returns the storage models listed in model_names.

        Args:
            model_names: list(str). List of storage model names.

        Returns:
            tuple(returned_models): Tuple of Storage models.

        Raises:
            Exception: Invalid model name
        """
        returned_models = []
        for name in model_names:
            if name == NAMES.activity:
                from core.storage.activity import gae_models as activity_models
                returned_models.append(activity_models)
            elif name == NAMES.base_model:
                from core.storage.base_model import gae_models as base_models
                returned_models.append(base_models)
            elif name == NAMES.classifier:
                from core.storage.classifier import gae_models as classifier_models # pylint: disable=line-too-long
                returned_models.append(classifier_models)
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
            elif name == NAMES.recommendations:
                from core.storage.recommendations import gae_models as recommendations_models # pylint: disable=line-too-long
                returned_models.append(recommendations_models)
            elif name == NAMES.statistics:
                from core.storage.statistics import gae_models as statistics_models # pylint: disable=line-too-long
                returned_models.append(statistics_models)
            elif name == NAMES.user:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def import_transaction_services(cls):
        """Importing gae_transaction_services

        Returns:
            Module gae_transation_services from core.platform.transactions
        """
        from core.platform.transactions import gae_transaction_services
        return gae_transaction_services

    @classmethod
    def import_current_user_services(cls):
        """Importing the current user services

        Returns:
            Module gae_current_user_services from core.platform.users
        """
        from core.platform.users import gae_current_user_services
        return gae_current_user_services

    @classmethod
    def import_app_identity_services(cls):
        """Importing the required app identity services

        Returns:
            Module gae_identity_services from core.platform.app_identity
        """
        from core.platform.app_identity import gae_app_identity_services
        return gae_app_identity_services

    @classmethod
    def import_email_services(cls):
        """Importing the correct email services module according to 
        the feconf values

        Returns:
            Module gae_email_services from core.platform.email / 
            Module mailgun_email_services from core.platform.email

        Raises:
            Exception: Invalid email service 
            provider 'feconf.EMAIL_SERVICE_PROVIDER'
        """
        if feconf.EMAIL_SERVICE_PROVIDER == feconf.EMAIL_SERVICE_PROVIDER_GAE:
            from core.platform.email import gae_email_services
            return gae_email_services
        elif (feconf.EMAIL_SERVICE_PROVIDER == feconf.EMAIL_SERVICE_PROVIDER_MAILGUN):  # pylint: disable=line-too-long
            from core.platform.email import mailgun_email_services
            return mailgun_email_services
        else:
            raise Exception(
                ('Invalid email service provider: %s'
                 % feconf.EMAIL_SERVICE_PROVIDER))

    @classmethod
    def import_memcache_services(cls):
        """Importing the required memcache services

        Returns:
            Module gae_memcache_services from core.platform.memcache
        """
        from core.platform.memcache import gae_memcache_services
        return gae_memcache_services

    @classmethod
    def import_taskqueue_services(cls):
        """Importing the required task queue services

        Returns:
            Module gae_taskqueue_services from core.platform.taskqueue
        """
        from core.platform.taskqueue import gae_taskqueue_services
        return gae_taskqueue_services

    @classmethod
    def import_search_services(cls):
        """Importing the required search services

        Returns:
            Module gae_search_services from core.platform.search
        """
        from core.platform.search import gae_search_services
        return gae_search_services

    NAME = 'gae'


class Registry(object):
    """Model through which _Gae_ model's methods are accessed.
    This is the model accessed by all submodules

    """
    
    #mapping methods of this model to the methods of _Gae_ model
    _PLATFORM_MAPPING = {
        _Gae.NAME: _Gae,
    }

    @classmethod
    def _get(cls):
        """Accessor method through which super class's methods can be accessed

        Returns: corresponding method of the super class
        """
        return cls._PLATFORM_MAPPING.get(feconf.PLATFORM)

    @classmethod
    def import_models(cls, model_names):
        """Importing the required storage models.

        Args:
            model_names: list(str). List of storage models

        Returns:
            import_models() of _Gae_ model
        """
        return cls._get().import_models(model_names)

    @classmethod
    def import_current_user_services(cls):
        """Imports and returns platform-specific current_user_services

        Returns:
            import_current_user_services() of _Gae_ model
        """
        return cls._get().import_current_user_services()

    @classmethod
    def import_transaction_services(cls):
        """Importing the required transaction services

        Returns:
            import_transaction_services() of _Gae_ model
        """
        return cls._get().import_transaction_services()

    @classmethod
    def import_app_identity_services(cls):
        """Importing the required app identity services

        Returns:
            import_app_identity_services() of _Gae_ model
        """
        return cls._get().import_app_identity_services()

    @classmethod
    def import_email_services(cls):
        """Importing the required email services

        Returns:
            import_email_services() of _Gae_ model
        """
        return cls._get().import_email_services()

    @classmethod
    def import_memcache_services(cls):
        """Importing the required memcache services

        Returns:
            import_memcache_services() of _Gae_ model
        """
        return cls._get().import_memcache_services()

    @classmethod
    def import_taskqueue_services(cls):
        """Importing the required taskqueue services

        Returns:
            import_taskqueue_services() of _Gae_ model
        """
        return cls._get().import_taskqueue_services()

    @classmethod
    def import_search_services(cls):
        """Importing the required search services

        Returns:
            import_search_services() of _Gae_ model
        """
        return cls._get().import_search_services()
