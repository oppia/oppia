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

from core import feconf
from core import schema_utils
from core.constants import constants
from core.domain import change_domain

from typing import Any, Dict, List, Optional, Sequence, TypedDict, Union

from core.domain import caching_services  # pylint: disable=invalid-import-from # isort:skip
from core.platform import models  # pylint: disable=invalid-import-from # isort:skip

# TODO(#14537): Refactor this file and remove imports marked
# with 'invalid-import-from'.


MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models
    from mypy_imports import suggestion_models

(config_models, suggestion_models,) = models.Registry.import_models(
    [models.Names.CONFIG, models.Names.SUGGESTION])

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

VMID_SHARED_SECRET_KEY_SCHEMA = {
    'type': schema_utils.SCHEMA_TYPE_LIST,
    'items': {
        'type': schema_utils.SCHEMA_TYPE_DICT,
        'properties': [{
            'name': 'vm_id',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
            }
        }, {
            'name': 'shared_secret_key',
            'schema': {
                'type': schema_utils.SCHEMA_TYPE_UNICODE
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
    - banned_usernames.
    - banner_alt_text.
    - before_end_body_tag_hook.
    - before_end_head_tag_hook.
    - carousel_slides_config.
    - classroom_page_is_accessible.
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

    @classmethod
    def get_config_property(cls, name: str) -> Optional[ConfigProperty]:
        """Returns the instance of the specified name of the configuration
        property.

        Args:
            name: str. The name of the configuration property.

        Returns:
            instance. The instance of the specified configuration property.
        """
        return cls._config_registry.get(name)

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

# TODO(#15682): Implement user checkpoints feature flag using feature-gating
# service.
CHECKPOINTS_FEATURE_IS_ENABLED = ConfigProperty(
    'checkpoints_feature_is_enabled', BOOL_SCHEMA,
    'Enable checkpoints feature.', False)

CLASSROOM_PROMOS_ARE_ENABLED = ConfigProperty(
    'classroom_promos_are_enabled', BOOL_SCHEMA,
    'Show classroom promos.', False)

LEARNER_GROUPS_ARE_ENABLED = ConfigProperty(
    'learner_groups_are_enabled', BOOL_SCHEMA,
    'Enable learner groups feature', False)

BATCH_INDEX_FOR_MAILCHIMP = ConfigProperty(
    'batch_index_for_mailchimp', INT_SCHEMA,
    'Index of batch to populate mailchimp database.', 0)

_FEATURED_TRANSLATION_LANGUAGES_DEFAULT_VALUE: List[str] = []

FEATURED_TRANSLATION_LANGUAGES = ConfigProperty(
    'featured_translation_languages',
    LIST_OF_FEATURED_TRANSLATION_LANGUAGES_DICTS_SCHEMA,
    'Featured Translation Languages',
    _FEATURED_TRANSLATION_LANGUAGES_DEFAULT_VALUE
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
    25)

MAX_NUMBER_OF_EXPLORATIONS_IN_MATH_SVGS_BATCH = ConfigProperty(
    'max_number_of_explorations_in_math_svgs_batch',
    INT_SCHEMA,
    'The maximum number of explorations that can be send in a batch of math '
    'rich text svgs.',
    2)

MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST = ConfigProperty(
    'max_number_of_tags_assigned_to_blog_post',
    POSITIVE_INT_SCHEMA,
    'The maximum number of tags that can be selected to categorize the blog'
    ' post',
    10
)

LIST_OF_DEFAULT_TAGS_FOR_BLOG_POST = ConfigProperty(
    'list_of_default_tags_for_blog_post',
    SET_OF_STRINGS_SCHEMA,
    'The list of tags available to a blog post editor for categorizing the blog'
    ' post.',
    ['News', 'International', 'Educators', 'Learners', 'Community',
     'Partnerships', 'Volunteer', 'Stories', 'Languages', 'New features',
     'New lessons', 'Software development', 'Content']
)

CONTRIBUTOR_DASHBOARD_IS_ENABLED = ConfigProperty(
    'contributor_dashboard_is_enabled', BOOL_SCHEMA,
    'Enable contributor dashboard page. The default value is true.', True)

CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED = ConfigProperty(
    'contributor_dashboard_reviewer_emails_is_enabled', BOOL_SCHEMA,
    (
        'Enable sending Contributor Dashboard reviewers email notifications '
        'about suggestions that need review. The default value is false.'
    ), False)

ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW = ConfigProperty(
    'notify_admins_suggestions_waiting_too_long_is_enabled', BOOL_SCHEMA,
    (
        'Enable sending admins email notifications if there are Contributor '
        'Dashboard suggestions that have been waiting for a review for more '
        'than %s days. The default value is false.' % (
            suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS)
    ), False)

ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE = ConfigProperty(
    'enable_admin_notifications_for_reviewer_shortage', BOOL_SCHEMA,
    (
        'Enable sending admins email notifications if Contributor Dashboard '
        'reviewers are needed in specific suggestion types. The default value '
        'is false.'
    ), False)

MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER = ConfigProperty(
    'max_number_of_suggestions_per_reviewer',
    INT_SCHEMA,
    'The maximum number of Contributor Dashboard suggestions per reviewer. If '
    'the number of suggestions per reviewer surpasses this maximum, for any '
    'given suggestion type on the dashboard, the admins are notified by email.',
    5)
