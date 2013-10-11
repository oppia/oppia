# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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
    'base_model', 'config', 'exploration', 'file', 'statistics', 'users')


class _Platform(object):
    @classmethod
    def import_models(cls):
        raise NotImplementedError


class _Django(_Platform):

    @classmethod
    def import_models(cls, model_names):

        returned_models = []
        for name in model_names:
            if name == NAMES.base_model:
                from core.storage.base_model import django_models as base_model
                returned_models.append(base_model)
            elif name == NAMES.config:
                from core.storage.config import django_models as config_model
                returned_models.append(config_model)
            elif name == NAMES.exploration:
                from core.storage.exploration import django_models as exp_model
                returned_models.append(exp_model)
            elif name == NAMES.file:
                from core.storage.file import django_models as file_model
                returned_models.append(file_model)
            elif name == NAMES.statistics:
                from core.storage.statistics import django_models as statistics_model
                returned_models.append(statistics_model)
            elif name == NAMES.users:
                from core.storage.users import django_models as user_prefs_model
                returned_models.append(user_prefs_model)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def import_transaction_services(cls):
        from core.platform.transactions import django_transaction_services
        return django_transaction_services

    @classmethod
    def import_user_services(cls):
        from core.platform.users import django_user_services
        return django_user_services

    @classmethod
    def import_memcache_services(cls):
        from core.platform.memcache import django_memcache_services
        return django_memcache_services

    NAME = 'django'


class _Gae(_Platform):
    @classmethod
    def import_models(cls, model_names):

        returned_models = []
        for name in model_names:
            if name == NAMES.base_model:
                from core.storage.base_model import gae_models as base_model
                returned_models.append(base_model)
            elif name == NAMES.config:
                from core.storage.config import gae_models as config_model
                returned_models.append(config_model)
            elif name == NAMES.exploration:
                from core.storage.exploration import gae_models as exp_model
                returned_models.append(exp_model)
            elif name == NAMES.file:
                from core.storage.file import gae_models as file_model
                returned_models.append(file_model)
            elif name == NAMES.statistics:
                from core.storage.statistics import gae_models as statistics_model
                returned_models.append(statistics_model)
            elif name == NAMES.users:
                from core.storage.users import gae_models as user_prefs_model
                returned_models.append(user_prefs_model)
            else:
                raise Exception('Invalid model name: %s' % name)

        return tuple(returned_models)

    @classmethod
    def import_transaction_services(cls):
        from core.platform.transactions import gae_transaction_services
        return gae_transaction_services

    @classmethod
    def import_user_services(cls):
        from core.platform.users import gae_user_services
        return gae_user_services

    @classmethod
    def import_memcache_services(cls):
        from core.platform.memcache import gae_memcache_services
        return gae_memcache_services

    NAME = 'gae'


class Registry(object):
    _PLATFORM_MAPPING = {
        _Django.NAME: _Django,
        _Gae.NAME: _Gae,
    }

    @classmethod
    def _get(cls):
        return cls._PLATFORM_MAPPING.get(feconf.PLATFORM)

    @classmethod
    def import_models(cls, model_names):
        return cls._get().import_models(model_names)

    @classmethod
    def import_user_services(cls):
        return cls._get().import_user_services()

    @classmethod
    def import_transaction_services(cls):
        return cls._get().import_transaction_services()

    @classmethod
    def import_memcache_services(cls):
        return cls._get().import_memcache_services()
