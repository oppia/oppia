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

"""Domain objects for configuration properties."""

from core.domain import user_services
from core.platform import models
import schema_utils

(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()

CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'

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
    - about_page_youtube_video_id
    - admin_email_address
    - allow_yaml_file_upload
    - banner_alt_text
    - before_end_body_tag_hook
    - carousel_slides_config
    - contact_email_address
    - contribute_gallery_page_announcement
    - disabled_explorations
    - editor_page_announcement
    - editor_prerequisites_agreement
    - embedded_google_group_url
    - full_site_url
    - moderator_request_forum_url
    - sharing_options
    - sharing_options_twitter_text
    - sidebar_menu_additional_links
    - site_forum_url
    - social_media_buttons
    - splash_page_exploration_id
    - splash_page_exploration_version
    - splash_page_youtube_video_id
    """

    def refresh_default_value(self, default_value):
        pass

    def __init__(self, name, schema, description, default_value,
                 post_set_hook=None, is_directly_settable=True):
        if Registry.get_config_property(name):
            raise Exception('Property with name %s already exists' % name)

        self._name = name
        self._schema = schema
        self._description = description
        self._default_value = schema_utils.normalize_against_schema(
            default_value, self._schema)
        self._post_set_hook = post_set_hook
        self._is_directly_settable = is_directly_settable

        Registry.init_config_property(self.name, self)

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
    def is_directly_settable(self):
        return self._is_directly_settable

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

    def set_value(self, committer_id, raw_value):
        """Sets the value of the property. In general, this should not be
        called directly -- use config_services.set_property() instead.
        """
        value = self.normalize(raw_value)

        # Set value in datastore.
        model_instance = config_models.ConfigPropertyModel.get(
            self.name, strict=False)
        if model_instance is None:
            model_instance = config_models.ConfigPropertyModel(
                id=self.name)
        model_instance.value = value
        model_instance.commit(committer_id, [{
            'cmd': CMD_CHANGE_PROPERTY_VALUE,
            'new_value': value
        }])

        # Set value in memcache.
        memcache_services.set_multi({
            model_instance.id: model_instance.value})

        if self._post_set_hook is not None:
            self._post_set_hook(committer_id, value)

    def normalize(self, value):
        return schema_utils.normalize_against_schema(value, self._schema)


class Registry(object):
    """Registry of all configuration properties."""

    # The keys of _config_registry are the property names, and the values are
    # ConfigProperty instances.
    _config_registry = {}

    @classmethod
    def init_config_property(cls, name, instance):
        cls._config_registry[name] = instance

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
            if instance.is_directly_settable:
                schemas_dict[property_name] = {
                    'schema': instance.schema,
                    'description': instance.description,
                    'value': instance.value
                }

        return schemas_dict


def update_admin_ids(committer_id, admin_usernames):
    """Refresh the list of admin user_ids based on the usernames entered."""
    admin_ids = []
    for username in admin_usernames:
        user_id = user_services.get_user_id_from_username(username)
        if user_id is not None:
            admin_ids.append(user_id)
        else:
            raise Exception('Bad admin username: %s' % username)

    Registry.get_config_property('admin_ids').set_value(
        committer_id, admin_ids)


def update_moderator_ids(committer_id, moderator_usernames):
    """Refresh the list of moderator user_ids based on the usernames
    entered.
    """
    moderator_ids = []
    for username in moderator_usernames:
        user_id = user_services.get_user_id_from_username(username)
        if user_id is not None:
            moderator_ids.append(user_id)
        else:
            raise Exception('Bad moderator username: %s' % username)

    Registry.get_config_property('moderator_ids').set_value(
        committer_id, moderator_ids)


ADMIN_IDS = ConfigProperty(
    'admin_ids', SET_OF_STRINGS_SCHEMA, 'Admin ids', [],
    is_directly_settable=False)
MODERATOR_IDS = ConfigProperty(
    'moderator_ids', SET_OF_STRINGS_SCHEMA, 'Moderator ids', [],
    is_directly_settable=False)

ADMIN_USERNAMES = ConfigProperty(
    'admin_usernames', SET_OF_STRINGS_SCHEMA, 'Usernames of admins', [],
    post_set_hook=update_admin_ids)
MODERATOR_USERNAMES = ConfigProperty(
    'moderator_usernames', SET_OF_STRINGS_SCHEMA, 'Usernames of moderators',
    [], post_set_hook=update_moderator_ids)

BANNED_USERNAMES = ConfigProperty(
    'banned_usernames',
    SET_OF_STRINGS_SCHEMA,
    'Banned usernames (editing permissions for these users have been removed)',
    [])

WHITELISTED_COLLECTION_EDITOR_USERNAMES = ConfigProperty(
    'collection_editor_whitelist', SET_OF_STRINGS_SCHEMA,
    'Names of users allowed to use the collection editor',
    [])

WHITELISTED_EMAIL_SENDERS = ConfigProperty(
    'whitelisted_email_senders', SET_OF_STRINGS_SCHEMA,
    'Names of users allowed to send emails via the query interface.', [])
