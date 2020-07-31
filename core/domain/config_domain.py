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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import change_domain
from core.platform import models
import feconf
import python_utils
import schema_utils

(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()

CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'

LIST_OF_FEATURED_TRANSLATION_LANGUAGES_DICTS_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'dict',
        'properties': [{
            'name': 'language_code',
            'schema': {
                'type': 'unicode',
                'validators': [{
                    'id': 'is_supported_audio_language_code',
                }]
            },
        }, {
            'name': 'explanation',
            'schema': {
                'type': 'unicode'
            }
        }]
    }
}

SET_OF_STRINGS_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'unicode',
    },
    'validators': [{
        'id': 'is_uniquified',
    }],
}

SET_OF_CLASSROOM_DICTS_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'dict',
        'properties': [{
            'name': 'name',
            'schema': {
                'type': 'unicode'
            }
        }, {
            'name': 'topic_ids',
            'schema': {
                'type': 'list',
                'items': {
                    'type': 'unicode',
                },
                'validators': [{
                    'id': 'is_uniquified',
                }]
            }
        }]
    }
}

VMID_SHARED_SECRET_KEY_SCHEMA = {
    'type': 'list',
    'items': {
        'type': 'dict',
        'properties': [{
            'name': 'vm_id',
            'schema': {
                'type': 'unicode'
            }
        }, {
            'name': 'shared_secret_key',
            'schema': {
                'type': 'unicode'
            }
        }]
    }
}

BOOL_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_BOOL
}

UNICODE_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_UNICODE
}

FLOAT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_FLOAT
}

INT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_INT
}


class ConfigPropertyChange(change_domain.BaseChange):
    """Domain object for changes made to a config property object.

    The allowed commands, together with the attributes:
        - 'change_property_value' (with new_value)
    """

    ALLOWED_COMMANDS = [{
        'name': CMD_CHANGE_PROPERTY_VALUE,
        'required_attribute_names': ['new_value'],
        'optional_attribute_names': []
    }]


class ConfigProperty(python_utils.OBJECT):
    """A property with a name and a default value.

    NOTE TO DEVELOPERS: These config properties are deprecated. Do not reuse
    these names:
    - about_page_youtube_video_id.
    - admin_email_address.
    - admin_ids.
    - admin_usernames.
    - allow_yaml_file_upload.
    - banned_usernames.
    - banner_alt_text.
    - before_end_body_tag_hook.
    - before_end_head_tag_hook.
    - carousel_slides_config.
    - collection_editor_whitelist.
    - contact_email_address.
    - contribute_gallery_page_announcement.
    - default_twitter_share_message_editor.
    - disabled_explorations.
    - editor_page_announcement.
    - editor_prerequisites_agreement.
    - embedded_google_group_url.
    - full_site_url.
    - moderator_ids.
    - moderator_request_forum_url.
    - moderator_usernames.
    - publicize_exploration_email_html_body.
    - sharing_options.
    - sharing_options_twitter_text.
    - sidebar_menu_additional_links.
    - site_forum_url.
    - social_media_buttons.
    - splash_page_exploration_id.
    - splash_page_exploration_version.
    - splash_page_youtube_video_id.
    - ssl_challenge_responses.
    - whitelisted_email_senders.
    """

    def __init__(self, name, schema, description, default_value):
        if Registry.get_config_property(name):
            raise Exception('Property with name %s already exists' % name)

        self._name = name
        self._schema = schema
        self._description = description
        self._default_value = schema_utils.normalize_against_schema(
            default_value, self._schema)

        Registry.init_config_property(self.name, self)

    @property
    def name(self):
        """Returns the name of the configuration property."""

        return self._name

    @property
    def schema(self):
        """Returns the schema of the configuration property."""

        return self._schema

    @property
    def description(self):
        """Returns the description of the configuration property."""

        return self._description

    @property
    def default_value(self):
        """Returns the default value of the configuration property."""

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
        model_instance.commit(
            committer_id, [{
                'cmd': CMD_CHANGE_PROPERTY_VALUE,
                'new_value': value
            }])

        # Set value in memcache.
        memcache_services.set_multi({
            model_instance.id: model_instance.value})

    def normalize(self, value):
        """Validates the given object using the schema and normalizes if
        necessary.

        Args:
            value: str. The value of the configuration property.

        Returns:
            instance. The normalized object.
        """
        return schema_utils.normalize_against_schema(value, self._schema)


class Registry(python_utils.OBJECT):
    """Registry of all configuration properties."""

    # The keys of _config_registry are the property names, and the values are
    # ConfigProperty instances.
    _config_registry = {}

    @classmethod
    def init_config_property(cls, name, instance):
        """Initializes _config_registry with keys as the property names and
        values as instances of the specified property.

        Args:
            name: str. The name of the configuration property.
            instance: *. The instance of the configuration property.
        """
        cls._config_registry[name] = instance

    @classmethod
    def get_config_property(cls, name):
        """Returns the instance of the specified name of the configuration
        property.

        Args:
            name: str. The name of the configuration property.

        Returns:
            instance. The instance of the specified configuration property.
        """
        return cls._config_registry.get(name)

    @classmethod
    def get_config_property_schemas(cls):
        """Return a dict of editable config property schemas.

        The keys of the dict are config property names. The values are dicts
        with the following keys: schema, description, value.
        """
        schemas_dict = {}

        for (property_name, instance) in cls._config_registry.items():
            schemas_dict[property_name] = {
                'schema': instance.schema,
                'description': instance.description,
                'value': instance.value
            }

        return schemas_dict

    @classmethod
    def get_all_config_property_names(cls):
        """Return a list of all the config property names.

        Returns:
            list. The list of all config property names.
        """
        return list(cls._config_registry)


PROMO_BAR_ENABLED = ConfigProperty(
    'promo_bar_enabled', BOOL_SCHEMA,
    'Whether the promo bar should be enabled for all users', False)
PROMO_BAR_MESSAGE = ConfigProperty(
    'promo_bar_message', UNICODE_SCHEMA,
    'The message to show to all users if the promo bar is enabled', '')

VMID_SHARED_SECRET_KEY_MAPPING = ConfigProperty(
    'vmid_shared_secret_key_mapping', VMID_SHARED_SECRET_KEY_SCHEMA,
    'VMID and shared secret key corresponding to that VM',
    [{
        'vm_id': feconf.DEFAULT_VM_ID,
        'shared_secret_key': feconf.DEFAULT_VM_SHARED_SECRET
    }])

WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS = ConfigProperty(
    'whitelisted_exploration_ids_for_playthroughs',
    SET_OF_STRINGS_SCHEMA,
    'The set of exploration IDs for recording playthrough issues', [
        'umPkwp0L1M0-', 'MjZzEVOG47_1', '9trAQhj6uUC2', 'rfX8jNkPnA-1',
        '0FBWxCE5egOw', '670bU6d9JGBh', 'aHikhPlxYgOH', '-tMgcP1i_4au',
        'zW39GLG_BdN2', 'Xa3B_io-2WI5', '6Q6IyIDkjpYC', 'osw1m5Q3jK41'])

TOPIC_IDS_FOR_CLASSROOM_PAGES = ConfigProperty(
    'topic_ids_for_classroom_pages', SET_OF_CLASSROOM_DICTS_SCHEMA,
    'The set of topic IDs for each classroom page.', [{
        'name': 'math',
        'topic_ids': []
    }]
)

RECORD_PLAYTHROUGH_PROBABILITY = ConfigProperty(
    'record_playthrough_probability', FLOAT_SCHEMA,
    'The probability of recording playthroughs', 0.2)

IS_IMPROVEMENTS_TAB_ENABLED = ConfigProperty(
    'is_improvements_tab_enabled', BOOL_SCHEMA,
    'Exposes the Improvements Tab for creators in the exploration editor.',
    False)

ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS = ConfigProperty(
    'always_ask_learners_for_answer_details', BOOL_SCHEMA,
    'Always ask learners for answer details. For testing -- do not use',
    False)

CLASSROOM_PAGE_IS_SHOWN = ConfigProperty(
    'classroom_page_is_shown', BOOL_SCHEMA,
    'Show classroom components.', False)

FEATURED_TRANSLATION_LANGUAGES = ConfigProperty(
    'featured_translation_languages',
    LIST_OF_FEATURED_TRANSLATION_LANGUAGES_DICTS_SCHEMA,
    'Featured Translation Languages', []
)

HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD = ConfigProperty(
    'high_bounce_rate_task_state_bounce_rate_creation_threshold',
    FLOAT_SCHEMA,
    'The bounce-rate a state must exceed to create a new improvements task.',
    0.20)

HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD = ConfigProperty(
    'high_bounce_rate_task_state_bounce_rate_obsoletion_threshold',
    FLOAT_SCHEMA,
    'The bounce-rate a state must fall under to discard its improvement task.',
    0.20)

HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS = ConfigProperty(
    'high_bounce_rate_task_minimum_exploration_starts',
    INT_SCHEMA,
    'The minimum number of times an exploration is started before it can '
    'generate high bounce-rate improvements tasks.',
    100)

MAX_NUMBER_OF_SVGS_IN_MATH_SVGS_BATCH = ConfigProperty(
    'max_number_of_svgs_in_math_svgs_batch',
    INT_SCHEMA,
    'The maximum number of Math SVGs that can be send in a batch of math rich '
    'text svgs.',
    20)
