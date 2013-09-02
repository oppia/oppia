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

"""Domain objects for configuration properties."""

__author__ = 'Sean Lip'


from core.platform import models
(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


class ConfigProperty(object):
    """A property with a name and a default value."""

    ALLOWED_TYPES = frozenset([str, unicode])

    def __init__(self, name, value_type, description, default_value=None):

        if not value_type in self.ALLOWED_TYPES:
            raise Exception('Bad value type: %s' % value_type)

        try:
            value_type(default_value)
        except Exception:
            raise Exception('Cannot cast value of %s to %s (expected type %s)'
                            % (name, default_value, value_type))

        if name in Registry._config_registry:
            raise Exception('Property with name %s already exists' % name)

        self.name = name
        self.value_type = value_type
        self.description = description
        self.default_value = value_type(default_value)

        Registry._config_registry[self.name] = self

    @property
    def value(self):
        """Get the latest value from memcache, datastore, or use default."""

        memcached_items = memcache_services.get_multi([self.name])
        if self.name in memcached_items:
            return memcached_items[self.name]

        datastore_item = config_models.ConfigPropertyModel.get(
            self.name, strict=False)
        if datastore_item is not None:
            memcache_services.set_multi({
                datastore_item.id: datastore_item.value})
            return datastore_item.value

        return self.default_value


class Registry(object):
    """Registry of all configuration properties."""
    _config_registry = {}

    @classmethod
    def get_config_property(cls, name):
        return cls._config_registry.get(name)
