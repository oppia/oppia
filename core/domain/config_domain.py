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

"""Domain objects for configuration properties."""

__author__ = 'Sean Lip'


from core.domain import user_services
from core.platform import models
(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()
import schema_utils


COMPUTED_PROPERTY_PREFIX = 'computed:'

SET_OF_STRINGS_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'unicode',
    },
    'validators': [{
        'id': 'is_uniquified',
    }],
}


class ConfigProperty(object):
    """A property with a name and a default value.

    NOTE TO DEVELOPERS: These config properties are deprecated. Do not reuse
    these names:
    - admin_email_address
    - banner_alt_text
    - contribute_gallery_page_announcement
    - editor_page_announcement
    - editor_prerequisites_agreement
    - full_site_url
    - splash_page_exploration_id
    - splash_page_exploration_version
    """

    def refresh_default_value(self, default_value):
        pass

    def __init__(self, name, schema, description, default_value):
        if name in Registry._config_registry:
            raise Exception('Property with name %s already exists' % name)

        self._name = name
        self._schema = schema
        self._description = description
        self._default_value = schema_utils.normalize_against_schema(
            default_value, self._schema)

        Registry._config_registry[self.name] = self

    @property
    def name(self):
        return self._name

    @property
    def schema(self):
        return self._schema

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

    def normalize(self, value):
        return schema_utils.normalize_against_schema(value, self._schema)


class ComputedProperty(ConfigProperty):
    """A property whose default value is computed using a given function."""

    def refresh_default_value(self):
        memcache_services.delete_multi([self.name])
        self._default_value = self.fn(*self.args)

    def __init__(self, name, schema, description, fn, *args):
        self.fn = fn
        self.args = args

        default_value = self.fn(*self.args)
        super(ComputedProperty, self).__init__(
            '%s%s' % (COMPUTED_PROPERTY_PREFIX, name),
            schema, description, default_value)

    @property
    def value(self):
        """Compute the value on the fly."""
        self.refresh_default_value()
        return self.default_value


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
        with the following keys: schema, description, value.
        """
        schemas_dict = {}

        for (property_name, instance) in cls._config_registry.iteritems():
            if not property_name.startswith(COMPUTED_PROPERTY_PREFIX):
                schemas_dict[property_name] = {
                    'schema': instance.schema,
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


def update_admin_ids():
    """Refresh the list of admin user_ids based on the emails entered."""
    admin_emails_config = Registry.get_config_property(
        'admin_emails')
    if not admin_emails_config:
        return []

    admin_ids = []
    for email in admin_emails_config.value:
        user_id = user_services.get_user_id_from_email(email)
        if user_id is not None:
            admin_ids.append(user_id)
        else:
            raise Exception('Bad admin email: %s' % email)
    return admin_ids


def update_moderator_ids():
    """Refresh the list of moderator user_ids based on the emails entered."""
    moderator_emails_config = Registry.get_config_property(
        'moderator_emails')
    if not moderator_emails_config:
        return []

    moderator_ids = []
    for email in moderator_emails_config.value:
        user_id = user_services.get_user_id_from_email(email)
        if user_id is not None:
            moderator_ids.append(user_id)
        else:
            raise Exception('Bad moderator email: %s' % email)
    return moderator_ids


ADMIN_IDS = ComputedProperty(
    'admin_ids', SET_OF_STRINGS_SCHEMA, 'Admin ids', update_admin_ids)
MODERATOR_IDS = ComputedProperty(
    'moderator_ids', SET_OF_STRINGS_SCHEMA, 'Moderator ids',
    update_moderator_ids)

ADMIN_EMAILS = ConfigProperty(
    'admin_emails', SET_OF_STRINGS_SCHEMA, 'Email addresses of admins', [])
MODERATOR_EMAILS = ConfigProperty(
    'moderator_emails', SET_OF_STRINGS_SCHEMA, 'Email addresses of moderators',
    [])
BANNED_USERNAMES = ConfigProperty(
    'banned_usernames',
    SET_OF_STRINGS_SCHEMA,
    'Banned usernames (editing permissions for these users have been removed)',
    [])
