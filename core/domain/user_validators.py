# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Validators for user models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import base_model_validators
from core.domain import exp_domain
from core.domain import learner_progress_services
from core.domain import rights_manager
from core.domain import user_domain
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
import feconf
import utils

(
    base_models, collection_models, email_models,
    exp_models, feedback_models, question_models,
    skill_models, story_models, suggestion_models,
    topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.email,
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.suggestion,
    models.NAMES.topic, models.NAMES.user
])


class UserSettingsModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserSettingsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_settings(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        # Note that some users have an associated UserContributionsModel.
        # However, this only applies for users who have made contributions,
        # and not for all users, so we don't check for it here.
        return []

    @classmethod
    def _validate_time_fields_of_user_actions(cls, item):
        """Validates that value for time fields for user actions is
        less than the current time when the job is run.

        Args:
            item: datastore_services.Model. UserSettingsModel to validate.
        """
        time_fields = {
            'last agreed to terms': item.last_agreed_to_terms,
            'last started state editor tutorial': (
                item.last_started_state_editor_tutorial),
            'last started state translation tutorial': (
                item.last_started_state_translation_tutorial),
            'last logged in': item.last_logged_in,
            'last edited an exploration': item.last_edited_an_exploration,
            'last created an exploration': item.last_created_an_exploration
        }
        current_time = datetime.datetime.utcnow()
        for time_field_name, time_field_value in time_fields.items():
            if time_field_value is not None and time_field_value > current_time:
                cls._add_error(
                    '%s check' % time_field_name,
                    'Entity id %s: Value for %s: %s is greater than the '
                    'time when job was run' % (
                        item.id, time_field_name, time_field_value))

        current_msec = utils.get_current_time_in_millisecs()
        if item.first_contribution_msec is not None and (
                item.first_contribution_msec > current_msec):
            cls._add_error(
                'first contribution check',
                'Entity id %s: Value for first contribution msec: %s is '
                'greater than the time when job was run' % (
                    item.id, item.first_contribution_msec))

    @classmethod
    def _validate_that_profile_users_have_role_of_learner(cls, item):
        """Validates that the profile users have learner role.

        Args:
            item: datastore_services.Model. UserSettingsModel to validate.
        """
        user_auth_details = user_services.get_auth_details_by_user_id(item.id)

        if user_auth_details.is_full_user():
            return

        if item.role != feconf.ROLE_ID_LEARNER:
            cls._add_error(
                'profile user role check',
                'Entity id %s: A profile user should have learner role, '
                'found %s' % (item.id, item.role))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_time_fields_of_user_actions,
            cls._validate_that_profile_users_have_role_of_learner]


class CompletedActivitiesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating CompletedActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                item.story_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'learnt_topic_ids', topic_models.TopicModel,
                item.learnt_topic_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'IncompleteActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_incomplete_exp_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_incomplete_collection_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'story_ids',
            item.story_ids,
            'story_ids',
            learner_progress_services.get_all_incomplete_story_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'learnt_topic_ids',
            item.learnt_topic_ids,
            'partially_learnt_topic_ids',
            learner_progress_services.get_all_partially_learnt_topic_ids(
                item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class IncompleteActivitiesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating IncompleteActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel,
                item.story_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'partially_learnt_topic_ids', topic_models.TopicModel,
                item.partially_learnt_topic_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'CompletedActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_completed_exp_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_completed_collection_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'story_ids',
            item.story_ids,
            'story_ids',
            learner_progress_services.get_all_completed_story_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'partially_learnt_topic_ids',
            item.partially_learnt_topic_ids,
            'learnt_topic_ids',
            learner_progress_services.get_all_learnt_topic_ids(item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class ExpUserLastPlaythroughModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating ExpUserLastPlaythroughModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.exploration_id])]

    @classmethod
    def _validate_exp_id_is_marked_as_incomplete(cls, item):
        """Validates that exploration id for model is marked as
        incomplete.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
        """
        if item.exploration_id not in (
                learner_progress_services.get_all_incomplete_exp_ids(
                    item.user_id)):
            cls._add_error(
                'incomplete exp %s' % (
                    base_model_validators.ERROR_CATEGORY_ID_CHECK),
                'Entity id %s: Exploration id %s for entity is not marked '
                'as incomplete' % (item.id, item.exploration_id))

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validates that last played exp version is less than or equal to
        for version of the exploration.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.last_played_exp_version > exploration_model.version:
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_VERSION_CHECK,
                    'Entity id %s: last played exp version %s is greater than '
                    'current version %s of exploration with id %s' % (
                        item.id, item.last_played_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _validate_state_name(
            cls, item, field_name_to_external_model_references):
        """Validates that state name is a valid state in the exploration
        corresponding to the entity.

        Args:
            item: datastore_services.Model. ExpUserLastPlaythroughModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.last_played_state_name not in (
                    exploration_model.states.keys()):
                cls._add_error(
                    base_model_validators.ERROR_CATEGORY_STATE_NAME_CHECK,
                    'Entity id %s: last played state name %s is not present '
                    'in exploration states %s for exploration id %s' % (
                        item.id, item.last_played_state_name,
                        list(exploration_model.states.keys()),
                        exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_exp_id_is_marked_as_incomplete]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_exp_version,
            cls._validate_state_name
        ]


class LearnerPlaylistModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating LearnerPlaylistModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids)]

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, item):
        return [(
            'CompletedActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_completed_exp_ids(item.id)
        ), (
            'CompletedActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_completed_collection_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'exploration_ids',
            item.exploration_ids,
            'exploration_ids',
            learner_progress_services.get_all_incomplete_exp_ids(item.id)
        ), (
            'IncompleteActivitiesModel',
            'collection_ids',
            item.collection_ids,
            'collection_ids',
            learner_progress_services.get_all_incomplete_collection_ids(item.id)
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_common_properties_do_not_match]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public
        ]


class UserContributionsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_contributions(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'created_exploration_ids', exp_models.ExplorationModel,
                item.created_exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'edited_exploration_ids', exp_models.ExplorationModel,
                item.edited_exploration_ids)]


class UserEmailPreferencesModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserEmailPreferencesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]


class UserSubscriptionsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids',
                exp_models.ExplorationModel,
                item.exploration_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                item.collection_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'general_feedback_thread_ids',
                feedback_models.GeneralFeedbackThreadModel,
                item.general_feedback_thread_ids),
            base_model_validators.UserSettingsModelFetcherDetails(
                'creator_ids', item.creator_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'subscriber_ids', user_models.UserSubscribersModel,
                item.creator_ids),
            base_model_validators.UserSettingsModelFetcherDetails(
                'id', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

    @classmethod
    def _validate_last_checked(cls, item):
        """Validates that last checked time field is less than the time
        when job was run.

        Args:
            item: datastore_services.Model. UserSubscriptionsModel to validate.
        """
        current_time = datetime.datetime.utcnow()
        if item.last_checked is not None and item.last_checked > current_time:
            cls._add_error(
                'last checked check',
                'Entity id %s: last checked %s is greater than '
                'the time when job was run' % (
                    item.id, item.last_checked))

    @classmethod
    def _validate_user_id_in_subscriber_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in list of
        subscriber ids of the creators the user has subscribed to.

        Args:
            item: datastore_services.Model. UserSubscriptionsModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        subscriber_model_references = (
            field_name_to_external_model_references['subscriber_ids'])

        for subscriber_model_reference in subscriber_model_references:
            subscriber_model = subscriber_model_reference.model_instance
            if subscriber_model is None or subscriber_model.deleted:
                model_class = subscriber_model_reference.model_class
                model_id = subscriber_model_reference.model_id
                cls._add_error(
                    'subscriber_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field subscriber_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in subscriber_model.subscriber_ids:
                cls._add_error(
                    'subscriber %s' % (
                        base_model_validators.ERROR_CATEGORY_ID_CHECK),
                    'Entity id %s: User id is not present in subscriber ids of '
                    'creator with id %s to whom the user has subscribed' % (
                        item.id, subscriber_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_last_checked]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_subscriber_ids]


class UserSubscribersModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSubscribersModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'subscriber_ids', item.subscriber_ids,
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'subscription_ids', user_models.UserSubscriptionsModel,
                item.subscriber_ids)]

    @classmethod
    def _validate_user_id_not_in_subscriber_ids(cls, item):
        """Validates that user id is not present in list of
        subscribers of user.

        Args:
            item: datastore_services.Model. UserSubscribersModel to validate.
        """
        if item.id in item.subscriber_ids:
            cls._add_error(
                'subscriber %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: User id is present in subscriber ids '
                'for user' % item.id)

    @classmethod
    def _validate_user_id_in_creator_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in list of
        creator ids to which the subscribers of user have
        subscribed.

        Args:
            item: datastore_services.Model. UserSubscribersModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        subscription_model_references = (
            field_name_to_external_model_references['subscription_ids'])

        for subscription_model_reference in subscription_model_references:
            subscription_model = subscription_model_reference.model_instance
            if subscription_model is None or subscription_model.deleted:
                model_class = subscription_model_reference.model_class
                model_id = subscription_model_reference.model_id
                cls._add_error(
                    'subscription_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field subscription_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in subscription_model.creator_ids:
                cls._add_error(
                    'subscription creator %s' % (
                        base_model_validators.ERROR_CATEGORY_ID_CHECK),
                    'Entity id %s: User id is not present in creator ids to '
                    'which the subscriber of user with id %s has subscribed' % (
                        item.id, subscription_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_id_not_in_subscriber_ids]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_creator_ids]


class UserRecentChangesBatchModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserRecentChangesBatchModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

    @classmethod
    def _validate_job_queued_msec(cls, item):
        """Validates that job queued msec is less than the time
        when job was run.

        Args:
            item: datastore_services.Model. UserRecentChangesBatchModel to
                validate.
        """
        current_msec = utils.get_current_time_in_millisecs()
        if item.job_queued_msec > current_msec:
            cls._add_error(
                'job queued msec check',
                'Entity id %s: job queued msec %s is greater than '
                'the time when job was run' % (
                    item.id, item.job_queued_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_job_queued_msec]


class UserStatsModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserStatsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

    @classmethod
    def _validate_schema_version(cls, item):
        """Validates that schema version is less than current version.

        Args:
            item: datastore_services.Model. UserStatsModel to validate.
        """
        if item.schema_version > feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            cls._add_error(
                'schema %s' % (
                    base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                'Entity id %s: schema version %s is greater than '
                'current version %s' % (
                    item.id, item.schema_version,
                    feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION))

    @classmethod
    def _validate_weekly_creator_stats_list(cls, item):
        """Validates that each item weekly_creator_stats_list is keyed
        by a datetime field and value as a dict with keys: num_ratings,
        average_ratings, total_plays. Values for these keys should be
        integers.

        Args:
            item: datastore_services.Model. UserStatsModel to validate.
        """
        current_time_str = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        for stat in item.weekly_creator_stats_list:
            for key, value in stat.items():
                allowed_properties = [
                    'average_ratings', 'num_ratings', 'total_plays']
                try:
                    datetime.datetime.strptime(
                        key, feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
                    assert key <= current_time_str
                    assert isinstance(value, dict)
                    assert sorted(value.keys()) == allowed_properties
                    for property_name in allowed_properties:
                        assert isinstance(value[property_name], int)
                except Exception:
                    cls._add_error(
                        'weekly creator stats list',
                        'Entity id %s: Invalid stats dict: %s' % (
                            item.id, stat))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_schema_version,
            cls._validate_weekly_creator_stats_list]


class ExplorationUserDataModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating ExplorationUserDataModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                [item.exploration_id])]

    @classmethod
    def _validate_draft_change_list(cls, item):
        """Validates that commands in draft change list follow
        the schema of ExplorationChange domain object.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.draft_change_list is None:
            return
        for change_dict in item.draft_change_list:
            try:
                exp_domain.ExplorationChange(change_dict)
            except Exception as e:
                cls._add_error(
                    'draft change list check',
                    'Entity id %s: Invalid change dict %s due to error %s' % (
                        item.id, change_dict, e))

    @classmethod
    def _validate_rating(cls, item):
        """Validates that rating is in the interval [1, 5].

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.rating is not None and (item.rating < 1 or item.rating > 5):
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATINGS_CHECK,
                'Entity id %s: Expected rating to be in range [1, 5], '
                'received %s' % (item.id, item.rating))

    @classmethod
    def _validate_rated_on(cls, item):
        """Validates that rated on is less than the time when job
        was run.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.rating is not None and not item.rated_on:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rating %s exists but rated on is None' % (
                    item.id, item.rating))
        current_time = datetime.datetime.utcnow()
        if item.rated_on is not None and item.rated_on > current_time:
            cls._add_error(
                base_model_validators.ERROR_CATEGORY_RATED_ON_CHECK,
                'Entity id %s: rated on %s is greater than the time '
                'when job was run' % (item.id, item.rated_on))

    @classmethod
    def _validate_draft_change_list_last_updated(cls, item):
        """Validates that draft change list last updated is less than
        the time when job was run.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
        """
        if item.draft_change_list and not item.draft_change_list_last_updated:
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list %s exists but '
                'draft change list last updated is None' % (
                    item.id, item.draft_change_list))
        current_time = datetime.datetime.utcnow()
        if item.draft_change_list_last_updated is not None and (
                item.draft_change_list_last_updated > current_time):
            cls._add_error(
                'draft change list %s' % (
                    base_model_validators.ERROR_CATEGORY_LAST_UPDATED_CHECK),
                'Entity id %s: draft change list last updated %s is '
                'greater than the time when job was run' % (
                    item.id, item.draft_change_list_last_updated))

    @classmethod
    def _validate_exp_version(
            cls, item, field_name_to_external_model_references):
        """Validates that draft change exp version is less than version
        of the exploration corresponding to the model.

        Args:
            item: datastore_services.Model. ExplorationUserDataModel to
                validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        exploration_model_references = (
            field_name_to_external_model_references['exploration_ids'])

        for exploration_model_reference in exploration_model_references:
            exploration_model = exploration_model_reference.model_instance
            if exploration_model is None or exploration_model.deleted:
                model_class = exploration_model_reference.model_class
                model_id = exploration_model_reference.model_id
                cls._add_error(
                    'exploration_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field exploration_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.draft_change_list_exp_version > exploration_model.version:
                cls._add_error(
                    'exp %s' % (
                        base_model_validators.ERROR_CATEGORY_VERSION_CHECK),
                    'Entity id %s: draft change list exp version %s is '
                    'greater than version %s of corresponding exploration '
                    'with id %s' % (
                        item.id, item.draft_change_list_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_draft_change_list,
            cls._validate_rating,
            cls._validate_rated_on,
            cls._validate_draft_change_list_last_updated]

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_exp_version]


class CollectionProgressModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating CollectionProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.collection_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'collection_ids', collection_models.CollectionModel,
                [item.collection_id]),
            base_model_validators.ExternalModelFetcherDetails(
                'exploration_ids', exp_models.ExplorationModel,
                item.completed_explorations),
            base_model_validators.ExternalModelFetcherDetails(
                'completed_activities_ids',
                user_models.CompletedActivitiesModel, [item.user_id])]

    @classmethod
    def _validate_completed_exploration(
            cls, item, field_name_to_external_model_references):
        """Validates that completed exploration ids belong to
        the collection and are present in CompletedActivitiesModel
        for the user.

        Args:
            item: datastore_services.Model. CollectionProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        completed_exp_ids = item.completed_explorations
        completed_activities_model_references = (
            field_name_to_external_model_references['completed_activities_ids'])

        for completed_activities_model_reference in (
                completed_activities_model_references):
            completed_activities_model = (
                completed_activities_model_reference.model_instance)
            if completed_activities_model is None or (
                    completed_activities_model.deleted):
                model_class = completed_activities_model_reference.model_class
                model_id = completed_activities_model_reference.model_id
                cls._add_error(
                    'completed_activities_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field completed_activities_ids '
                    'having value %s, expected model %s with id %s but it '
                    'doesn\'t exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            missing_exp_ids = [
                exp_id
                for exp_id in completed_exp_ids if exp_id not in (
                    completed_activities_model.exploration_ids)]
            if missing_exp_ids:
                cls._add_error(
                    'completed exploration check',
                    'Entity id %s: Following completed exploration ids %s '
                    'are not present in CompletedActivitiesModel for the '
                    'user' % (item.id, missing_exp_ids))

        collection_model_references = (
            field_name_to_external_model_references['collection_ids'])

        for collection_model_reference in collection_model_references:
            collection_model = collection_model_reference.model_instance
            if collection_model is None or collection_model.deleted:
                model_class = collection_model_reference.model_class
                model_id = collection_model_reference.model_id
                cls._add_error(
                    'collection_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field collection_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            collection_node_ids = [
                node['exploration_id'] for node in (
                    collection_model.collection_contents['nodes'])]
            invalid_exp_ids = [
                exp_id
                for exp_id in completed_exp_ids if exp_id not in (
                    collection_node_ids)]
            if invalid_exp_ids:
                cls._add_error(
                    'completed exploration check',
                    'Entity id %s: Following completed exploration ids %s do '
                    'not belong to the collection with id %s corresponding '
                    'to the entity' % (
                        item.id, invalid_exp_ids, collection_model.id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public,
            cls._validate_completed_exploration
        ]


class StoryProgressModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating StoryProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.story_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'story_ids', story_models.StoryModel, [item.story_id])]

    @classmethod
    def _validate_story_is_public(
            cls, item, field_name_to_external_model_references):
        """Validates that story is public.

        Args:
            item: datastore_services.Model. StoryProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            topic_id = story_model.corresponding_topic_id
            if topic_id:
                topic = topic_models.TopicModel.get_by_id(topic_id)
                all_story_references = (
                    topic.canonical_story_references +
                    topic.additional_story_references)
                story_is_published = False
                for reference in all_story_references:
                    if reference['story_id'] == story_model.id:
                        story_is_published = reference['story_is_published']
                if not story_is_published:
                    cls._add_error(
                        'public story check',
                        'Entity id %s: Story with id %s corresponding to '
                        'entity is private' % (item.id, story_model.id))

    @classmethod
    def _validate_completed_nodes(
            cls, item, field_name_to_external_model_references):
        """Validates that completed nodes belong to the story.

        Args:
            item: datastore_services.Model. StoryProgressModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        completed_activity_model = user_models.CompletedActivitiesModel.get(
            item.user_id)
        story_model_references = (
            field_name_to_external_model_references['story_ids'])

        for story_model_reference in story_model_references:
            story_model = story_model_reference.model_instance
            if story_model is None or story_model.deleted:
                model_class = story_model_reference.model_class
                model_id = story_model_reference.model_id
                cls._add_error(
                    'story_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field story_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            story_node_ids = [
                node['id'] for node in story_model.story_contents['nodes']]
            invalid_node_ids = [
                node_id
                for node_id in item.completed_node_ids if node_id not in (
                    story_node_ids)]
            if invalid_node_ids:
                cls._add_error(
                    'completed node check',
                    'Entity id %s: Following completed node ids %s do '
                    'not belong to the story with id %s corresponding '
                    'to the entity' % (
                        item.id, invalid_node_ids, story_model.id))

            # Checks that the explorations corresponding to completed nodes
            # exist, are marked as completed in CompletedActivitiesModel
            # and are public.
            private_exp_ids = []
            missing_exp_ids = []
            unmarked_exp_ids = []
            completed_exp_ids = []
            for node in story_model.story_contents['nodes']:
                if node['id'] in item.completed_node_ids:
                    completed_exp_ids.append(node['exploration_id'])
                    if node['exploration_id'] not in (
                            completed_activity_model.exploration_ids):
                        unmarked_exp_ids.append(node['exploration_id'])
                    if rights_manager.is_exploration_private(
                            node['exploration_id']):
                        private_exp_ids.append(node['exploration_id'])

            exp_model_list = exp_models.ExplorationModel.get_multi(
                completed_exp_ids)
            for index, exp_model in enumerate(exp_model_list):
                if exp_model is None or exp_model.deleted:
                    missing_exp_ids.append(completed_exp_ids[index])

            error_msg = ''
            if private_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are private %s. ' % (
                        private_exp_ids))
            if missing_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are missing %s. ' % (
                        missing_exp_ids))
            if unmarked_exp_ids:
                error_msg = error_msg + (
                    'Following exploration ids are not marked in '
                    'CompletedActivitiesModel %s.' % unmarked_exp_ids)

            if error_msg:
                cls._add_error(
                    'explorations in completed node check',
                    'Entity id %s: %s' % (item.id, error_msg))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [
            cls._validate_story_is_public,
            cls._validate_completed_nodes]


class UserQueryModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating UserQueryModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', (
                    item.user_ids + [item.submitter_id]),
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'sent_email_model_ids', email_models.BulkEmailModel,
                [item.sent_email_model_id])]

    @classmethod
    def _validate_sender_and_recipient_ids(
            cls, item, field_name_to_external_model_references):
        """Validates that sender id of BulkEmailModel matches the
        submitter id of query and all recipient ids are present in
        user ids who satisfy the query. It is not necessary that
        all user ids are present in recipient ids since email
        is only sent to a limited maximum of qualified users.
        It also checks that a UserBulkEmailsModel exists for each
        of the recipients.

        Args:
            item: datastore_services.Model. UserQueryModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        email_model_references = (
            field_name_to_external_model_references['sent_email_model_ids'])

        for email_model_reference in email_model_references:
            email_model = email_model_reference.model_instance
            if email_model is None or email_model.deleted:
                model_class = email_model_reference.model_class
                model_id = email_model_reference.model_id
                cls._add_error(
                    'sent_email_model_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field sent_email_model_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            extra_recipient_ids = [
                user_id
                for user_id in email_model.recipient_ids if user_id not in (
                    item.user_ids)]
            if extra_recipient_ids:
                cls._add_error(
                    'recipient check',
                    'Entity id %s: Email model %s for query has following '
                    'extra recipients %s which are not qualified as per '
                    'the query'
                    % (item.id, email_model.id, extra_recipient_ids))
            if email_model.sender_id != item.submitter_id:
                cls._add_error(
                    'sender check',
                    'Entity id %s: Sender id %s in email model with id %s '
                    'does not match submitter id %s of query' % (
                        item.id, email_model.sender_id,
                        email_model.id, item.submitter_id))

            recipient_user_ids = [
                recipient_id
                for recipient_id in email_model.recipient_ids if (
                    recipient_id in item.user_ids)]
            user_bulk_emails_model_list = (
                user_models.UserBulkEmailsModel.get_multi(
                    recipient_user_ids))
            for index, user_bulk_emails_model in enumerate(
                    user_bulk_emails_model_list):
                if user_bulk_emails_model is None or (
                        user_bulk_emails_model.deleted):
                    cls._add_error(
                        'user bulk %s' % (
                            base_model_validators.ERROR_CATEGORY_EMAIL_CHECK),
                        'Entity id %s: UserBulkEmails model is missing for '
                        'recipient with id %s' % (
                            item.id, recipient_user_ids[index]))

    @classmethod
    def _validate_old_models_marked_deleted(cls, item):
        """Validate that there are no models that were last updated more than
        four weeks ago, these models should be deleted.

        Args:
            item: UserQueryModel. UserQueryModel to validate.
        """
        date_four_weeks_ago = (
            datetime.datetime.utcnow() -
            feconf.PERIOD_TO_MARK_MODELS_AS_DELETED)
        if item.last_updated < date_four_weeks_ago:
            cls._add_error(
                'entity %s' % base_model_validators.ERROR_CATEGORY_STALE_CHECK,
                'Entity id %s: Model older than 4 weeks' % item.id
            )

    @classmethod
    def _validate_archived_models_marked_deleted(cls, item):
        """Validate that there are no models that were last updated more than
        four weeks ago, these models should be deleted.

        Args:
            item: UserQueryModel. UserQueryModel to validate.
        """
        if item.query_status == feconf.USER_QUERY_STATUS_ARCHIVED:
            cls._add_error(
                'entity %s' % base_model_validators.ERROR_CATEGORY_STALE_CHECK,
                'Entity id %s: Archived model not marked as deleted' % item.id
            )

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_sender_and_recipient_ids]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_old_models_marked_deleted,
            cls._validate_archived_models_marked_deleted
        ]


class UserBulkEmailsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserBulkEmailsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'sent_email_model_ids', email_models.BulkEmailModel,
                item.sent_email_model_ids)]

    @classmethod
    def _validate_user_id_in_recipient_id_for_emails(
            cls, item, field_name_to_external_model_references):
        """Validates that user id is present in recipient ids
        for bulk email model.

        Args:
            item: datastore_services.Model. UserBulkEmailsModel to validate.
            field_name_to_external_model_references:
                dict(str, (list(base_model_validators.ExternalModelReference))).
                A dict keyed by field name. The field name represents
                a unique identifier provided by the storage
                model to which the external model is associated. Each value
                contains a list of ExternalModelReference objects corresponding
                to the field_name. For examples, all the external Exploration
                Models corresponding to a storage model can be associated
                with the field name 'exp_ids'. This dict is used for
                validation of External Model properties linked to the
                storage model.
        """
        email_model_references = (
            field_name_to_external_model_references['sent_email_model_ids'])

        for email_model_reference in email_model_references:
            email_model = email_model_reference.model_instance
            if email_model is None or email_model.deleted:
                model_class = email_model_reference.model_class
                model_id = email_model_reference.model_id
                cls._add_error(
                    'sent_email_model_ids %s' % (
                        base_model_validators.ERROR_CATEGORY_FIELD_CHECK),
                    'Entity id %s: based on field sent_email_model_ids having'
                    ' value %s, expected model %s with id %s but it doesn\'t'
                    ' exist' % (
                        item.id, model_id, model_class.__name__, model_id))
                continue
            if item.id not in email_model.recipient_ids:
                cls._add_error(
                    'recipient check',
                    'Entity id %s: user id is not present in recipient ids '
                    'of BulkEmailModel with id %s' % (item.id, email_model.id))

    @classmethod
    def _get_external_instance_custom_validation_functions(cls):
        return [cls._validate_user_id_in_recipient_id_for_emails]


class UserSkillMasteryModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserSkillMasteryModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False),
            base_model_validators.ExternalModelFetcherDetails(
                'skill_ids', skill_models.SkillModel, [item.skill_id])]

    @classmethod
    def _validate_skill_mastery(cls, item):
        """Validates that skill mastery is in range [0.0, 1.0].

        Args:
            item: datastore_services.Model. UserSkillMasteryModel to validate.
        """
        if item.degree_of_mastery < 0 or item.degree_of_mastery > 1:
            cls._add_error(
                'skill mastery check',
                'Entity id %s: Expected degree of mastery to be in '
                'range [0.0, 1.0], received %s' % (
                    item.id, item.degree_of_mastery))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_skill_mastery]


class UserContributionProficiencyModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionProficiencyModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.score_category, item.user_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.user_id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]

    @classmethod
    def _validate_score(cls, item):
        """Validates that score is non-negative.

        Args:
            item: datastore_services.Model. UserContributionProficiencyModel to
                validate.
        """
        if item.score < 0:
            cls._add_error(
                'score check',
                'Entity id %s: Expected score to be non-negative, '
                'received %s' % (item.id, item.score))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_score]


class UserContributionRightsModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating UserContributionRightsModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_domain.UserContributionRights(
            item.id, item.can_review_translation_for_language_codes,
            item.can_review_voiceover_for_language_codes,
            item.can_review_questions,
            item.can_submit_questions)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_settings_ids', [item.id],
                may_contain_system_ids=False,
                may_contain_pseudonymous_ids=False)]


class PendingDeletionRequestModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating PendingDeletionRequestModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_user_settings_are_marked_deleted(cls, item):
        """Validates that explorations for model are marked as deleted.

        Args:
            item: PendingDeletionRequestModel. Pending deletion request model
                to validate.
        """
        user_model = user_models.UserSettingsModel.get_by_id(item.id)
        if user_model is None or not user_model.deleted:
            cls._add_error(
                'deleted user settings',
                'Entity id %s: User settings model is not marked as deleted'
                % (item.id))

    @classmethod
    def _validate_activity_mapping_contains_only_allowed_keys(cls, item):
        """Validates that pseudonymizable_entity_mappings keys are only from
        the core.platform.models.NAMES enum.

        Args:
            item: PendingDeletionRequestModel. Pending deletion request model
                to validate.
        """
        incorrect_keys = []
        allowed_keys = [
            name.value for name in models.MODULES_WITH_PSEUDONYMIZABLE_CLASSES]
        for module_name in item.pseudonymizable_entity_mappings.keys():
            if module_name not in allowed_keys:
                incorrect_keys.append(module_name)

        if incorrect_keys:
            cls._add_error(
                'correct pseudonymizable_entity_mappings check',
                'Entity id %s: pseudonymizable_entity_mappings '
                'contains keys %s that are not allowed' % (
                    item.id, incorrect_keys))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_user_settings_are_marked_deleted,
            cls._validate_activity_mapping_contains_only_allowed_keys]


class DeletedUserModelValidator(base_model_validators.BaseUserModelValidator):
    """Class for validating DeletedUserModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []

    @classmethod
    def _validate_user_is_properly_deleted(cls, item):
        """Validates that user settings do not exist for the deleted user ID.

        Args:
            item: DeletedUserModel. Pending deletion request model to validate.
        """

        if not wipeout_service.verify_user_deleted(
                item.id, include_delete_at_end_models=True):
            cls._add_error(
                'user properly deleted',
                'Entity id %s: The deletion verification fails' % (item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_is_properly_deleted]


class PseudonymizedUserModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating PseudonymizedUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^pid_[a-z]{32}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_user_settings_with_same_id_not_exist(cls, item):
        """Validates that the UserSettingsModel with the same ID as this model
        does not exist.

        Args:
            item: PseudonymizedUserModel. PseudonymizedUserModel to validate.
        """
        user_model = user_models.UserSettingsModel.get_by_id(item.id)
        if user_model is not None:
            cls.errors['deleted user settings'].append(
                'Entity id %s: User settings model exists' % (item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_settings_with_same_id_not_exist]


class DeletedUsernameModelValidator(
        base_model_validators.BaseUserModelValidator):
    """Class for validating DeletedUsernameModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.
        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: datastore_services.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[a-zA-Z0-9]{1,32}$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return []
