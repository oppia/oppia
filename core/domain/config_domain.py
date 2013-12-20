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


from core.domain import obj_services
from core.platform import models
(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


COMPUTED_PROPERTY_PREFIX = 'computed:'


class ConfigProperty(object):
    """A property with a name and a default value."""

    ALLOWED_TYPES = frozenset(['UnicodeString', 'Html'])

    def refresh_default_value(self, default_value):
        pass

    def __init__(self, name, obj_type, description, default_value=None):
        if not obj_type in self.ALLOWED_TYPES:
            raise Exception('Bad config property obj_type: %s' % obj_type)

        if name in Registry._config_registry:
            raise Exception('Property with name %s already exists' % name)

        self._name = name
        self._obj_type = obj_type
        self._description = description
        self._default_value = obj_services.Registry.get_object_class_by_type(
            self.obj_type).normalize(default_value)

        Registry._config_registry[self.name] = self

    @property
    def name(self):
        return self._name

    @property
    def obj_type(self):
        return self._obj_type

    @property
    def description(self):
        return self._description

    @property
    def default_value(self):
        return self._default_value

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


class ComputedProperty(ConfigProperty):
    """A property whose default value is computed using a given function."""

    def refresh_default_value(self):
        memcache_services.delete_multi([self.name])
        self._default_value = self.fn(*self.args)

    def __init__(self, name, obj_type, description, fn, *args):
        self.fn = fn
        self.args = args

        default_value = self.fn(*self.args)
        super(ComputedProperty, self).__init__(
            '%s%s' % (COMPUTED_PROPERTY_PREFIX, name),
            obj_type, description, default_value)


class Registry(object):
    """Registry of all configuration properties."""

    # The keys of _config_registry are the property names, and the values are
    # ConfigProperty instances.
    _config_registry = {}

    @classmethod
    def get_config_property(cls, name):
        return cls._config_registry.get(name)

    @classmethod
    def get_config_property_schemas(cls):
        """Return a dict of editable config property schemas.

        The keys of the dict are config property names. The values are dicts
        with the following keys: obj_type, description, value.
        """
        schemas_dict = {}

        for (property_name, instance) in cls._config_registry.iteritems():
            if not property_name.startswith(COMPUTED_PROPERTY_PREFIX):
                schemas_dict[property_name] = {
                    'obj_type': instance.obj_type,
                    'description': instance.description,
                    'value': instance.value
                }

        return schemas_dict

    @classmethod
    def get_computed_property_names(cls):
        """Return a list of computed property names."""
        computed_properties = {}

        for (property_name, instance) in cls._config_registry.iteritems():
            if property_name.startswith(COMPUTED_PROPERTY_PREFIX):
                computed_properties[property_name] = {
                    'description': instance.description
                }

        return computed_properties
