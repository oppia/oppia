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

__author__ = 'Sean Lip'

import feconf
import utils

# Valid model names.
NAMES = utils.create_enum(
    'base_model', 'collection', 'config', 'email', 'exploration', 'feedback',
    'file', 'job', 'recommendations', 'statistics', 'user')


class _Platform(object):
    @classmethod
    def import_models(cls):
        raise NotImplementedError


class _Gae(_Platform):
    @classmethod
    def import_models(cls, model_names):

        returned_models = []
        for name in model_names:
            if name == NAMES.base_model:
                from core.storage.base_model import gae_models as base_models
                returned_models.append(base_models)
            elif name == NAMES.collection:
                from core.storage.collection import gae_models as collection_models
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
                from core.storage.recommendations import gae_models as recommendations_models
                returned_models.append(recommendations_models)
            elif name == NAMES.statistics:
                from core.storage.statistics import gae_models as statistics_models
                returned_models.append(statistics_models)
            elif name == NAMES.user:
                from core.storage.user import gae_models as user_models
                returned_models.append(user_models)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def import_transaction_services(cls):
        from core.platform.transactions import gae_transaction_services
        return gae_transaction_services

    @classmethod
    def import_current_user_services(cls):
        from core.platform.users import gae_current_user_services
        return gae_current_user_services

    @classmethod
    def import_email_services(cls):
        from core.platform.email import gae_email_services
        return gae_email_services

    @classmethod
    def import_memcache_services(cls):
        from core.platform.memcache import gae_memcache_services
        return gae_memcache_services

    @classmethod
    def import_taskqueue_services(cls):
        from core.platform.taskqueue import gae_taskqueue_services
        return gae_taskqueue_services

    @classmethod
    def import_search_services(cls):
        from core.platform.search import gae_search_services
        return gae_search_services

    NAME = 'gae'


class Registry(object):
    _PLATFORM_MAPPING = {
        _Gae.NAME: _Gae,
    }

    @classmethod
    def _get(cls):
        return cls._PLATFORM_MAPPING.get(feconf.PLATFORM)

    @classmethod
    def import_models(cls, model_names):
        return cls._get().import_models(model_names)

    @classmethod
    def import_current_user_services(cls):
        return cls._get().import_current_user_services()

    @classmethod
    def import_transaction_services(cls):
        return cls._get().import_transaction_services()

    @classmethod
    def import_email_services(cls):
        return cls._get().import_email_services()

    @classmethod
    def import_memcache_services(cls):
        return cls._get().import_memcache_services()

    @classmethod
    def import_taskqueue_services(cls):
        return cls._get().import_taskqueue_services()

    @classmethod
    def import_search_services(cls):
        return cls._get().import_search_services()
