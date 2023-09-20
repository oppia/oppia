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

from __future__ import annotations

from core import schema_utils
from core.constants import constants
from core.domain import change_domain

from typing import (
    Any, Dict, List, Literal, Optional, Sequence, TypedDict, Union, overload
)

from core.domain import caching_services  # pylint: disable=invalid-import-from # isort:skip
from core.platform import models  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models([models.Names.CONFIG])

AllowedDefaultValueTypes = Union[
    str,
    bool,
    float,
    Dict[str, str],
    List[str],
    List[Dict[str, Sequence[str]]],
    List[Dict[str, str]]
]


class ConfigPropertySchemaDict(TypedDict):
    """Type representing the config property's schema dictionary."""

    # Here we use type Any because the general structure of schemas are like
    # {string : (string, dict, list[dict], variables defined in other modules)}.
    schema: Dict[str, Any]
    description: str
    value: AllowedDefaultValueTypes


CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'

LIST_OF_FEATURED_TRANSLATION_LANGUAGES_DICTS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_DICT,
        'properties': [{
            'name': 'language_code',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
                'validators': [{
                    'id': 'is_supported_audio_language_code',
                }]
            },
        }, {
            'name': 'explanation',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
            }
        }]
    }
}

SET_OF_STRINGS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_UNICODE,
    },
    'validators': [{
        'id': 'is_uniquified',
    }],
}

SET_OF_CLASSROOM_DICTS_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_DICT,
        'properties': [{
            'name': 'name',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
            }
        }, {
            'name': 'url_fragment',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
                'validators': [{
                    'id': 'is_url_fragment',
                }, {
                    'id': 'has_length_at_most',
                    'max_value': constants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
                }]
            },
        }, {
            'name': 'course_details',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
                'ui_config': {
                    'rows': 8,
                }
            }
        }, {
            'name': 'topic_list_intro',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE,
                'ui_config': {
                    'rows': 5,
                }
            }
        }, {
            'name': 'topic_ids',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_LIST,
                'items': {
                    'type': schema_utils.SCHEMA_TYPE_UNICODE,
                },
                'validators': [{
                    'id': 'is_uniquified',
                }]
            }
        }]
    }
}

BOOL_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_BOOL
}

FLOAT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_FLOAT
}

INT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_INT
}

POSITIVE_INT_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_CUSTOM,
    'obj_type': 'PositiveInt'
}


class ConfigPropertyChange(change_domain.BaseChange):
    """Domain object for changes made to a config property object.

    The allowed commands, together with the attributes:
        - 'change_property_value' (with new_value)
    """

    ALLOWED_COMMANDS = [{
        'name': CMD_CHANGE_PROPERTY_VALUE,
        'required_attribute_names': ['new_value'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class ChangePropertyValueCmd(ConfigPropertyChange):
    """Class representing the ConfigPropertyChange's
    CMD_CHANGE_PROPERTY_VALUE command.
    """

    new_value: str


class ConfigProperty:
    """A property with a name and a default value.

    NOTE TO DEVELOPERS: These config properties are deprecated. Do not reuse
    these names:
    - about_page_youtube_video_id.
    - admin_email_address.
    - admin_ids.
    - admin_usernames.
    - allow_yaml_file_upload.
    - always_ask_learners_for_answer_details.
    - banned_usernames.
    - banner_alt_text.
    - before_end_body_tag_hook.
    - before_end_head_tag_hook.
    - batch_index_for_mailchimp
    - carousel_slides_config.
    - checkpoints_feature_is_enabled.
    - classroom_page_is_accessible.
    - classroom_promos_are_enabled.
    - collection_editor_whitelist.
    - contact_email_address.
    - contribute_gallery_page_announcement.
    - contributor_dashboard_is_enabled.
    - contributor_dashboard_reviewer_emails_is_enabled.
    - default_twitter_share_message_editor.
    - disabled_explorations.
    - editor_page_announcement.
    - editor_prerequisites_agreement.
    - email_footer.
    - email_sender_name.
    - embedded_google_group_url.
    - enable_admin_notifications_for_reviewer_shortage.
    - featured_translation_languages.
    - full_site_url.
    - high_bounce_rate_task_minimum_exploration_starts.
    - high_bounce_rate_task_state_bounce_rate_creation_threshold.
    - high_bounce_rate_task_state_bounce_rate_obsoletion_threshold.
    - is_improvements_tab_enabled.
    - learner_groups_are_enabled.
    - list_of_default_tags_for_blog_post.
    - max_number_of_explorations_in_math_svgs_batch.
    - max_number_of_suggestions_per_reviewer.
    - max_number_of_svgs_in_math_svgs_batch.
    - max_number_of_tags_assigned_to_blog_post.
    - moderator_ids.
    - moderator_request_forum_url.
    - moderator_usernames.
    - notify_admins_suggestions_waiting_too_long_is_enabled.
    - promo_bar_enabled.
    - promo_bar_message.
    - publicize_exploration_email_html_body.
    - record_playthrough_probability.
    - sharing_options.
    - sharing_options_twitter_text.
    - show_translation_size.
    - sidebar_menu_additional_links.
    - signup_email_body_content.
    - signup_email_subject_content.
    - site_forum_url.
    - social_media_buttons.
    - splash_page_exploration_id.
    - splash_page_exploration_version.
    - splash_page_youtube_video_id.
    - ssl_challenge_responses.
    - unpublish_exploration_email_html_body.
    - vmid_shared_secret_key_mapping.
    - whitelisted_email_senders.
    - whitelisted_exploration_ids_for_playthroughs.
    """

    # Here we use type Any because the general structure of schemas are like
    # {string : (string, dict, list[dict], variables defined in other modules)}.
    # So, Any type has to be used in constructor for the type of schema.
    def __init__(
        self,
        name: str,
        schema: Dict[str, Any],
        description: str,
        default_value: AllowedDefaultValueTypes
    ) -> None:
        if Registry.get_config_property(name):
            raise Exception('Property with name %s already exists' % name)

        self._name = name
        self._schema = schema
        self._description = description
        self._default_value = self.normalize(default_value)

        Registry.init_config_property(self.name, self)

    @property
    def name(self) -> str:
        """Returns the name of the configuration property."""

        return self._name

    # Here we use type Any because this function returns general structured
    # schemas whose values can vary from int to complex Dicts.
    @property
    def schema(self) -> Dict[str, Any]:
        """Returns the schema of the configuration property."""

        return self._schema

    @property
    def description(self) -> str:
        """Returns the description of the configuration property."""

        return self._description

    @property
    def default_value(self) -> AllowedDefaultValueTypes:
        """Returns the default value of the configuration property."""

        return self._default_value

    # Here we use type Any because this function returns latest value of
    # configuration property from memcache, datastore, or default value.
    # so, if function returns datastore's value it should return Any.
    @property
    def value(self) -> Any:
        """Get the latest value from memcache, datastore, or use default."""

        memcached_items = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_CONFIG, None, [self.name])
        if self.name in memcached_items:
            return memcached_items[self.name]

        datastore_item = config_models.ConfigPropertyModel.get(
            self.name, strict=False)
        if datastore_item is not None:
            caching_services.set_multi(
                caching_services.CACHE_NAMESPACE_CONFIG, None,
                {
                    datastore_item.id: datastore_item.value
                })
            return datastore_item.value

        return self.default_value

    def set_value(
        self, committer_id: str, raw_value: Union[str, List[str]]
    ) -> None:
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
        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_CONFIG, None,
            {
                model_instance.id: model_instance.value
            })

    def normalize(
        self, value: AllowedDefaultValueTypes
    ) -> AllowedDefaultValueTypes:
        """Validates the given object using the schema and normalizes if
        necessary.

        Args:
            value: str. The value of the configuration property.

        Returns:
            instance. The normalized object.
        """
        email_validators = [{'id': 'does_not_contain_email'}]
        normalized_value: AllowedDefaultValueTypes = (
            schema_utils.normalize_against_schema(
                value, self._schema, global_validators=email_validators
            )
        )
        return normalized_value


class Registry:
    """Registry of all configuration properties."""

    # The keys of _config_registry are the property names, and the values are
    # ConfigProperty instances.
    _config_registry: Dict[str, ConfigProperty] = {}

    @classmethod
    def init_config_property(cls, name: str, instance: ConfigProperty) -> None:
        """Initializes _config_registry with keys as the property names and
        values as instances of the specified property.

        Args:
            name: str. The name of the configuration property.
            instance: *. The instance of the configuration property.
        """
        cls._config_registry[name] = instance

    @overload
    @classmethod
    def get_config_property(
        cls, name: str
    ) -> Optional[ConfigProperty]: ...

    @overload
    @classmethod
    def get_config_property(
        cls, name: str, *, strict: Literal[True]
    ) -> ConfigProperty: ...

    @overload
    @classmethod
    def get_config_property(
        cls, name: str, *, strict: Literal[False]
    ) -> Optional[ConfigProperty]: ...

    @classmethod
    def get_config_property(
        cls, name: str, strict: bool = False
    ) -> Optional[ConfigProperty]:
        """Returns the instance of the specified name of the configuration
        property.

        Args:
            name: str. The name of the configuration property.
            strict: bool. Whether to fail noisily if no config property exist.

        Returns:
            instance. The instance of the specified configuration property.

        Raises:
            Exception. No config property exist for the given property name.
        """
        config_property = cls._config_registry.get(name)
        if strict and config_property is None:
            raise Exception(
                'No config property exists for the given property name: %s'
                % name
            )
        return config_property

    @classmethod
    def get_config_property_schemas(cls) -> Dict[str, ConfigPropertySchemaDict]:
        """Return a dict of editable config property schemas.

        The keys of the dict are config property names. The values are dicts
        with the following keys: schema, description, value.
        """
        schemas_dict: Dict[str, ConfigPropertySchemaDict] = {}

        for (property_name, instance) in cls._config_registry.items():
            schemas_dict[property_name] = {
                'schema': instance.schema,
                'description': instance.description,
                'value': instance.value
            }

        return schemas_dict

    @classmethod
    def get_all_config_property_names(cls) -> List[str]:
        """Return a list of all the config property names.

        Returns:
            list. The list of all config property names.
        """
        return list(cls._config_registry)


# Add classroom name to SEARCH_DROPDOWN_CLASSROOMS in constants.ts file
# to add that classroom to learner group syllabus filter whenever a new
# classroom is added.
CLASSROOM_PAGES_DATA = ConfigProperty(
    'classroom_pages_data', SET_OF_CLASSROOM_DICTS_SCHEMA,
    'The details for each classroom page.', [{
        'name': 'math',
        'url_fragment': 'math',
        'topic_ids': [],
        'course_details': '',
        'topic_list_intro': ''
    }]
)
