# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""One-off jobs for validating prod models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import datetime
import itertools
import re

from constants import constants
from core import jobs
from core.domain import activity_domain
from core.domain import classifier_domain
from core.domain import classifier_services
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import learner_progress_services
from core.domain import opportunity_services
from core.domain import question_domain
from core.domain import question_fetchers
from core.domain import question_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_fetchers
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import suggestion_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_domain
from core.domain import user_services
from core.domain import voiceover_services
from core.platform import models
import feconf
import python_utils
import utils

(
    activity_models, audit_models, base_models,
    classifier_models, collection_models,
    config_models, email_models, exp_models,
    feedback_models, improvements_models, job_models,
    opportunity_models, question_models,
    recommendations_models, skill_models,
    story_models, suggestion_models, topic_models,
    user_models,) = (
        models.Registry.import_models([
            models.NAMES.activity, models.NAMES.audit, models.NAMES.base_model,
            models.NAMES.classifier, models.NAMES.collection,
            models.NAMES.config, models.NAMES.email, models.NAMES.exploration,
            models.NAMES.feedback, models.NAMES.improvements, models.NAMES.job,
            models.NAMES.opportunity, models.NAMES.question,
            models.NAMES.recommendations, models.NAMES.skill,
            models.NAMES.story, models.NAMES.suggestion, models.NAMES.topic,
            models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()

ALLOWED_AUDIO_EXTENSIONS = list(feconf.ACCEPTED_AUDIO_EXTENSIONS.keys())
ALLOWED_IMAGE_EXTENSIONS = list(itertools.chain.from_iterable(
    iter(feconf.ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS.values())))
ASSETS_PATH_REGEX = '/exploration/[A-Za-z0-9-_]{1,12}/assets/'
IMAGE_PATH_REGEX = (
    '%simage/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_IMAGE_EXTENSIONS)))
AUDIO_PATH_REGEX = (
    '%saudio/[A-Za-z0-9-_]{1,}\\.(%s)' % (
        ASSETS_PATH_REGEX, ('|').join(ALLOWED_AUDIO_EXTENSIONS)))
USER_ID_REGEX = 'uid_[a-z]{32}'
ALL_CONTINUOUS_COMPUTATION_MANAGERS_CLASS_NAMES = [
    'FeedbackAnalyticsAggregator',
    'InteractionAnswerSummariesAggregator',
    'DashboardRecentUpdatesAggregator',
    'UserStatsAggregator']
TARGET_TYPE_TO_TARGET_MODEL = {
    suggestion_models.TARGET_TYPE_EXPLORATION: (
        exp_models.ExplorationModel),
    suggestion_models.TARGET_TYPE_QUESTION: (
        question_models.QuestionModel),
    suggestion_models.TARGET_TYPE_SKILL: (
        skill_models.SkillModel),
    suggestion_models.TARGET_TYPE_TOPIC: (
        topic_models.TopicModel)
}
VALID_SCORE_CATEGORIES_FOR_TYPE_CONTENT = [
    '%s\\.%s' % (
        suggestion_models.SCORE_TYPE_CONTENT, category) for category in (
            constants.ALL_CATEGORIES)]
VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION = [
    '%s\\.[A-Za-z0-9-_]{1,%s}' % (
        suggestion_models.SCORE_TYPE_QUESTION, base_models.ID_LENGTH)]
ALLOWED_SCORE_CATEGORIES = (
    VALID_SCORE_CATEGORIES_FOR_TYPE_CONTENT +
    VALID_SCORE_CATEGORIES_FOR_TYPE_QUESTION)


class BaseModelValidator(python_utils.OBJECT):
    """Base class for validating models."""

    # The dict to store errors found during audit of model.
    errors = collections.defaultdict(list)
    # external_instance_details is keyed by field name. Each value consists
    # of a list of (model class, external_key, external_model_instance)
    # tuples.
    external_instance_details = {}

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        """Returns a regex for model id.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            str. A regex pattern to be followed by the model id.
        """
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _validate_model_id(cls, item):
        """Checks whether the id of model matches the regex specified for
        the model.

        Args:
            item: ndb.Model. Entity to validate.
        """
        regex_string = cls._get_model_id_regex(item)
        if not re.compile(regex_string).match(item.id):
            cls.errors['model id check'].append((
                'Entity id %s: Entity id does not match regex pattern') % (
                    item.id))

    @classmethod
    def _get_model_domain_object_instance(cls, unused_item):
        """Returns a domain object instance created from the model.

        This method can be overridden by subclasses, if needed.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return None

    @classmethod
    def _validate_model_domain_object_instances(cls, item):
        """Checks that model instance passes the validation of the domain
        object for model.

        Args:
            item: ndb.Model. Entity to validate.
        """
        try:
            model_domain_object_instance = (
                cls._get_model_domain_object_instance(item))
            if model_domain_object_instance is None:
                # No domain object exists for this storage model class.
                return
            model_domain_object_instance.validate()
        except Exception as e:
            cls.errors['domain object check'].append((
                'Entity id %s: Entity fails domain validation with the '
                'error %s' % (item.id, e)))

    @classmethod
    def _get_external_id_relationships(cls, item):
        """Returns a mapping of external id to model class.

        This should be implemented by subclasses.

        Args:
            item: ndb.Model. Entity to validate.

        Returns:
            dict(str, (ndb.Model, list(str)). A dictionary whose keys are
            field names of the model to validate, and whose values are tuples
            that consist of the external model class and list of keys to fetch.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError

    @classmethod
    def _validate_external_id_relationships(cls, item):
        """Check whether the external id properties on the model correspond
        to valid instances.

        Args:
            item: ndb.Model. Entity to validate.
        """
        for field_name, model_class_model_id_model_tuples in (
                cls.external_instance_details.items()):
            for model_class, model_id, model in (
                    model_class_model_id_model_tuples):
                if model is None or model.deleted:
                    cls.errors['%s field check' % field_name].append((
                        'Entity id %s: based on field %s having'
                        ' value %s, expect model %s with id %s but it doesn\'t'
                        ' exist' % (
                            item.id, field_name, model_id,
                            model_class.__name__, model_id)))

    @classmethod
    def _fetch_external_instance_details(cls, item):
        """Fetch external models based on _get_external_id_relationships.

        This should be called before we call other _validate methods.

        Args:
            item: ndb.Model. Entity to validate.
        """
        multiple_models_keys_to_fetch = {}
        for field_name_debug, (model_class, keys_to_fetch) in (
                cls._get_external_id_relationships(item).items()):
            multiple_models_keys_to_fetch[field_name_debug] = (
                model_class, keys_to_fetch)
        fetched_model_instances = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                list(multiple_models_keys_to_fetch.values())))
        for (
                field_name, (model_class, field_values)), (
                    external_instance_details) in python_utils.ZIP(
                        iter(multiple_models_keys_to_fetch.items()),
                        fetched_model_instances):
            cls.external_instance_details[field_name] = (
                list(python_utils.ZIP(
                    [model_class] * len(field_values),
                    field_values, external_instance_details)))

    @classmethod
    def _validate_model_time_fields(cls, item):
        """Checks the following relation for the model:
        model.created_on <= model.last_updated <= current time.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.created_on > item.last_updated:
            cls.errors['time field relation check'].append((
                'Entity id %s: The created_on field has a value %s which is '
                'greater than the value %s of last_updated field'
                ) % (item.id, item.created_on, item.last_updated))

        current_datetime = datetime.datetime.utcnow()
        if item.last_updated > current_datetime:
            cls.errors['current time check'].append((
                'Entity id %s: The last_updated field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.last_updated))

    @classmethod
    def _get_custom_validation_functions(cls):
        """Returns the list of custom validation functions to run.

        This method can be overridden by subclasses, if needed.

        Each validation function should accept only a single arg, which is the
        model instance to validate.

        Returns:
            list(function). The list of custom validation functions to run.
        """
        return []

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        cls.errors.clear()
        cls.external_instance_details.clear()
        cls._fetch_external_instance_details(item)

        cls._validate_model_id(item)
        cls._validate_model_time_fields(item)
        cls._validate_model_domain_object_instances(item)
        cls._validate_external_id_relationships(item)

        for func in cls._get_custom_validation_functions():
            func(item)


class BaseSummaryModelValidator(BaseModelValidator):
    """Base class for validating summary models."""

    @classmethod
    def _get_external_model_properties(cls):
        """Returns a tuple of external models and properties.

        This should be implemented by subclasses.

        Returns:
            tuple(str, list(tuple), dict). A tuple with first element as
                external model name, second element as a tuple of
                cls.external_instance_details and the third element
                as a properties dict with key as property name in summary
                model and value as property name in external model.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError

    @classmethod
    def _validate_external_model_properties(cls, item):
        """Validate that properties of the model match the corresponding
        properties of the external model.

        Args:
            item: ndb.Model. BaseSummaryModel to validate.
        """

        for (
                external_model_name,
                external_model_class_model_id_model_tuples,
                external_model_properties_dict
            ) in cls._get_external_model_properties():

            for (_, _, external_model) in (
                    external_model_class_model_id_model_tuples):
                # The case for missing external model is ignored here
                # since errors for missing external model are already
                # checked and stored in _validate_external_id_relationships
                # function.
                if external_model is None or external_model.deleted:
                    continue
                for (property_name, external_model_property_name) in (
                        external_model_properties_dict.items()):
                    value_in_summary_model = getattr(item, property_name)
                    value_in_external_model = getattr(
                        external_model, external_model_property_name)

                    if value_in_summary_model != value_in_external_model:
                        cls.errors['%s field check' % property_name].append((
                            'Entity id %s: %s field in entity: %s does not '
                            'match corresponding %s %s field: %s') % (
                                item.id, property_name,
                                value_in_summary_model,
                                external_model_name,
                                external_model_property_name,
                                value_in_external_model))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSummaryModelValidator, cls).validate(item)

        cls._validate_external_model_properties(item)


class BaseSnapshotContentModelValidator(BaseModelValidator):
    """Base class for validating snapshot content models."""

    # The name of the model which is to be used in the error messages.
    # This can be overridden by subclasses, if needed.
    MODEL_NAME = 'snapshot content'

    # The name of the external model in lowercase which is used to obtain
    # the name of the key for the fetch of external model and the name
    # of the external model to be used in error messages.
    # For example, if external model is CollectionRights, then
    # EXTERNAL_MODEL_NAME = collection rights, key to fetch = collection_rights
    # Name of model to be used in error message = CollectionRights
    # This should be overridden by subclasses.
    EXTERNAL_MODEL_NAME = ''

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9-_]{1,%s}-\\d+$' % base_models.ID_LENGTH

    @classmethod
    def _validate_base_model_version_from_item_id(cls, item):
        """Validate that external model corresponding to item.id
        has a version greater than or equal to the version in item.id.

        Args:
            item: ndb.Model. BaseSnapshotContentModel to validate.
        """

        if cls.EXTERNAL_MODEL_NAME == '':
            raise Exception('External model name should be specified')

        external_model_name = cls.EXTERNAL_MODEL_NAME
        if item.id.startswith('rights'):
            external_model_name = external_model_name + ' rights'

        name_split_by_space = external_model_name.split(' ')
        key_to_fetch = ('_').join(name_split_by_space)
        capitalized_external_model_name = ('').join([
            val.capitalize() for val in name_split_by_space])

        external_model_class_model_id_model_tuples = (
            cls.external_instance_details['%s_ids' % key_to_fetch])

        version = item.id[item.id.rfind('-') + 1:]
        for (_, _, external_model) in (
                external_model_class_model_id_model_tuples):
            # The case for missing external model is ignored here
            # since errors for missing external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if external_model is None or external_model.deleted:
                continue
            if int(external_model.version) < int(version):
                cls.errors[
                    '%s model version check' % cls.EXTERNAL_MODEL_NAME].append((
                        'Entity id %s: %s model corresponding to '
                        'id %s has a version %s which is less than '
                        'the version %s in %s model id' % (
                            item.id, capitalized_external_model_name,
                            external_model.id, external_model.version, version,
                            cls.MODEL_NAME)))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSnapshotContentModelValidator, cls).validate(item)

        cls._validate_base_model_version_from_item_id(item)


class BaseSnapshotMetadataModelValidator(BaseSnapshotContentModelValidator):
    """Base class for validating snapshot metadata models."""

    MODEL_NAME = 'snapshot metadata'

    @classmethod
    def _validate_commit_type(cls, item):
        """Validates that commit type is valid.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.commit_type not in (
                base_models.VersionedModel.COMMIT_TYPE_CHOICES):
            cls.errors['commit type check'].append((
                'Entity id %s: Commit type %s is not allowed') % (
                    item.id, item.commit_type))

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        """Returns a Change domain class.

        This should be implemented by subclasses.

        Args:
            unused_item: ndb.Model. Entity to validate.

        Returns:
            change_domain.BaseChange. A domain object class for the
                changes made by commit commands of the model.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError

    @classmethod
    def _validate_commit_cmds_schema(cls, item):
        """Validates schema of commit commands in commit_cmds dict.

        Args:
            item: ndb.Model. Entity to validate.
        """
        change_domain_object = cls._get_change_domain_class(item)
        if change_domain_object is None:
            # This is for cases where id of the entity is invalid
            # and no commit command domain object is found for the entity.
            # For example, if a CollectionCommitLogEntryModel does
            # not have id starting with collection/rights, there is
            # no commit command domain object defined for this model.
            cls.errors['commit cmd check'].append(
                'Entity id %s: No commit command domain object defined '
                'for entity with commands: %s' % (item.id, item.commit_cmds))
            return
        for commit_cmd_dict in item.commit_cmds:
            if not commit_cmd_dict:
                continue
            try:
                change_domain_object(commit_cmd_dict)
            except Exception as e:
                cmd_name = commit_cmd_dict.get('cmd')
                cls.errors['commit cmd %s check' % cmd_name].append((
                    'Entity id %s: Commit command domain validation for '
                    'command: %s failed with error: %s') % (
                        item.id, commit_cmd_dict, e))

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseSnapshotMetadataModelValidator, cls).validate(item)

        cls._validate_commit_type(item)
        cls._validate_commit_cmds_schema(item)


class BaseCommitLogEntryModelValidator(BaseSnapshotMetadataModelValidator):
    """Base class for validating commit log entry models."""

    MODEL_NAME = 'commit log entry'

    @classmethod
    def _validate_post_commit_status(cls, item):
        """Validates that post_commit_status is either public or private.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.post_commit_status not in [
                feconf.POST_COMMIT_STATUS_PUBLIC,
                feconf.POST_COMMIT_STATUS_PRIVATE]:
            cls.errors['post commit status check'].append((
                'Entity id %s: Post commit status %s is invalid') % (
                    item.id, item.post_commit_status))

    @classmethod
    def _validate_post_commit_status_is_public(cls, item):
        """Validates that post_commit_status is only public.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.post_commit_status != feconf.POST_COMMIT_STATUS_PUBLIC:
            cls.errors['post commit status check'].append((
                'Entity id %s: Post commit status %s is invalid') % (
                    item.id, item.post_commit_status))

    @classmethod
    def _validate_post_commit_is_private(cls, item):
        """Validates that post_commit_is_private is true iff
        post_commit_status is private.

        Args:
            item: ndb.Model. Entity to validate.
        """
        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PRIVATE and (
                not item.post_commit_is_private):
            cls.errors['post commit is private check'].append((
                'Entity id %s: Post commit status is private but '
                'post_commit_is_private is False') % item.id)

        if item.post_commit_status == feconf.POST_COMMIT_STATUS_PUBLIC and (
                item.post_commit_is_private):
            cls.errors['post commit is private check'].append((
                'Entity id %s: Post commit status is public but '
                'post_commit_is_private is True') % item.id)

    @classmethod
    def validate(cls, item):
        """Run _fetch_external_instance_details and all _validate functions.

        Args:
            item: ndb.Model. Entity to validate.
        """
        super(BaseCommitLogEntryModelValidator, cls).validate(item)

        cls._validate_post_commit_status(item)

        if item.id.startswith('question') or item.id.startswith('skill'):
            cls._validate_post_commit_status_is_public(item)
        else:
            cls._validate_post_commit_is_private(item)


class BaseUserModelValidator(BaseModelValidator):
    """Class for validating BaseUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return r'^%s$' % USER_ID_REGEX

    @classmethod
    def _get_exp_ids(cls, unused_item):
        """Returns a list of exploration ids related to the user model.

        Args:
            unused_item: ndb.Model. BaseUserModel to validate.

        Returns:
            list(str). List of exploration ids related to the model.
        """
        return []

    @classmethod
    def _get_col_ids(cls, unused_item):
        """Returns a list of collection ids related to the user model.

        Args:
            unused_item: ndb.Model. BaseUserModel to validate.

        Returns:
            list(str). List of collection ids related to the model.
        """
        return []

    @classmethod
    def _validate_explorations_are_public(cls, item):
        """Validates that explorations for model are public.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        exp_ids = cls._get_exp_ids(item)
        private_exp_ids = [
            exp_id for exp_id in exp_ids if (
                rights_manager.is_exploration_private(exp_id))]
        if private_exp_ids:
            cls.errors['public exploration check'].append(
                'Entity id %s: Explorations with ids %s are private' % (
                    item.id, private_exp_ids))

    @classmethod
    def _validate_collections_are_public(cls, item):
        """Validates that collections for model are public.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        col_ids = cls._get_col_ids(item)
        private_col_ids = [
            col_id for col_id in col_ids if (
                rights_manager.is_collection_private(col_id))]
        if private_col_ids:
            cls.errors['public collection check'].append(
                'Entity id %s: Collections with ids %s are private' % (
                    item.id, private_col_ids))

    @classmethod
    def _get_common_properties_of_external_model_which_should_not_match(
            cls, unused_item):
        """Returns a list of common properties to dismatch. For example,
        the exploration ids present in a CompletedActivitiesModel
        should not be present in an IncompleteActivitiesModel. So,
        this function will return the following list for
        CompletedActivitiesModel:
        ['IncompleteActivitiesModel', 'exploration_ids', list of
        exploration_ids in completed activities, 'exploration_ids',
        list of exploration_ids in incomplete activities]

        This can be overridden by subclasses, if needed.

        Args:
            unused_item: ndb.Model. BaseUserModel to validate.

        Returns:
            list(tuple(str, str, list, str, list).
                A list of tuple which consists of External model name,
                property name in model, list of property value in model,
                property name in external model, list of property value
                in external model.
        """
        return []

    @classmethod
    def _validate_common_properties_do_not_match(cls, item):
        """Validates that properties common with an external model
        are different in item and external model.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        common_properties = (
            cls._get_common_properties_of_external_model_which_should_not_match(
                item))
        for property_details in common_properties:
            (
                external_model_name, property_name_in_model, value_in_model,
                property_name_in_external_model, value_in_external_model
            ) = property_details
            common_values = [
                value
                for value in value_in_model if value in (
                    value_in_external_model)]
            if common_values:
                cls.errors['%s match check' % property_name_in_model].append(
                    'Entity id %s: Common values for %s in entity and '
                    '%s in %s: %s' % (
                        item.id, property_name_in_model,
                        property_name_in_external_model, external_model_name,
                        common_values))


class ActivityReferencesModelValidator(BaseModelValidator):
    """Class for validating ActivityReferencesModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: featured.
        regex_string = '^(%s)$' % '|'.join(
            feconf.ALL_ACTIVITY_REFERENCE_LIST_TYPES)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        activity_references_list = []

        try:
            for reference in item.activity_references:
                activity_references_list.append(
                    activity_domain.ActivityReference(
                        reference['type'], reference['id']))
        except Exception as e:
            cls.errors['fetch properties'].append((
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s') % (item.id, e))
            return None

        return activity_domain.ActivityReferences(activity_references_list)

    @classmethod
    def _get_external_id_relationships(cls, item):
        exploration_ids = []
        collection_ids = []

        try:
            for reference in item.activity_references:
                if reference['type'] == constants.ACTIVITY_TYPE_EXPLORATION:
                    exploration_ids.append(reference['id'])
                elif reference['type'] == constants.ACTIVITY_TYPE_COLLECTION:
                    collection_ids.append(reference['id'])
        except Exception as e:
            cls.errors['fetch properties'].append((
                'Entity id %s: Entity properties cannot be fetched completely '
                'with the error %s') % (item.id, e))
            return {}

        return {
            'exploration_ids': (exp_models.ExplorationModel, exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, collection_ids),
        }


class RoleQueryAuditModelValidator(BaseModelValidator):
    """Class for validating RoleQueryAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [user_id].[timestamp_in_sec].[intent].[random_number]
        regex_string = '^%s\\.\\d+\\.%s\\.\\d+$' % (item.user_id, item.intent)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'user_ids': (user_models.UserSettingsModel, [item.user_id])}


class UsernameChangeAuditModelValidator(BaseModelValidator):
    """Class for validating UsernameChangeAuditModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [committer_id].[timestamp_in_sec]
        # committer_id refers to the user that is making the change.
        regex_string = '^%s\\.\\d+$' % item.committer_id
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'committer_ids': (
            user_models.UserSettingsModel, [item.committer_id])}


class ClassifierTrainingJobModelValidator(BaseModelValidator):
    """Class for validating ClassifierTrainingJobModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exp_id].[random_hash]
        regex_string = '^%s\\.[A-Za-z0-9-_]{1,%s}$' % (
            item.exp_id, base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return classifier_services.get_classifier_training_job_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'exploration_ids': (exp_models.ExplorationModel, [item.exp_id])}

    @classmethod
    def _validate_exp_version(cls, item):
        """Validate that exp version is less than or equal to the version
        of exploration corresponding to exp_id.

        Args:
            item: ndb.Model. ClassifierTrainingJobModel to validate.
        """
        exp_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exp_model) in (
                exp_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exp_model is None or exp_model.deleted:
                continue
            if item.exp_version > exp_model.version:
                cls.errors['exp version check'].append((
                    'Entity id %s: Exploration version %s in entity is greater '
                    'than the version %s of exploration corresponding to '
                    'exp_id %s') % (
                        item.id, item.exp_version, exp_model.version,
                        item.exp_id))

    @classmethod
    def _validate_state_name(cls, item):
        """Validate that state name is a valid state in the
        exploration corresponding to exp_id.

        Args:
            item: ndb.Model. ClassifierTrainingJobModel to validate.
        """
        exp_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exp_model) in (
                exp_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exp_model is None or exp_model.deleted:
                continue
            if item.state_name not in exp_model.states.keys():
                cls.errors['state name check'].append((
                    'Entity id %s: State name %s in entity is not present '
                    'in states of exploration corresponding to '
                    'exp_id %s') % (
                        item.id, item.state_name, item.exp_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_exp_version,
            cls._validate_state_name]


class TrainingJobExplorationMappingModelValidator(BaseModelValidator):
    """Class for validating TrainingJobExplorationMappingModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exp_id].[exp_version].[state_name]
        regex_string = '^%s\\.%s\\.%s$' % (
            item.exp_id, item.exp_version, item.state_name)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return classifier_domain.TrainingJobExplorationMapping(
            item.exp_id, item.exp_version, item.state_name, item.job_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {'exploration_ids': (exp_models.ExplorationModel, [item.exp_id])}

    @classmethod
    def _validate_exp_version(cls, item):
        """Validate that exp version is less than or equal to the version
        of exploration corresponding to exp_id.

        Args:
            item: ndb.Model. TrainingJobExplorationMappingModel to validate.
        """
        exp_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exp_model) in (
                exp_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exp_model is None or exp_model.deleted:
                continue
            if item.exp_version > exp_model.version:
                cls.errors['exp version check'].append((
                    'Entity id %s: Exploration version %s in entity is greater '
                    'than the version %s of exploration corresponding to '
                    'exp_id %s') % (
                        item.id, item.exp_version, exp_model.version,
                        item.exp_id))

    @classmethod
    def _validate_state_name(cls, item):
        """Validate that state name is a valid state in the
        exploration corresponding to exp_id.

        Args:
            item: ndb.Model. TrainingJobExplorationMappingbModel to validate.
        """
        exp_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exp_model) in (
                exp_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exp_model is None or exp_model.deleted:
                continue
            if item.state_name not in exp_model.states.keys():
                cls.errors['state name check'].append((
                    'Entity id %s: State name %s in entity is not present '
                    'in states of exploration corresponding to '
                    'exp_id %s') % (
                        item.id, item.state_name, item.exp_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_exp_version,
            cls._validate_state_name]


class CollectionModelValidator(BaseModelValidator):
    """Class for validating CollectionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'exploration_ids': (
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in item.collection_contents[
                    'nodes']]),
            'collection_commit_log_entry_ids': (
                collection_models.CollectionCommitLogEntryModel,
                ['collection-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'collection_summary_ids': (
                collection_models.CollectionSummaryModel, [item.id]),
            'collection_rights_ids': (
                collection_models.CollectionRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                collection_models.CollectionSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                collection_models.CollectionSnapshotContentModel,
                snapshot_model_ids),
            'all_users_model_ids': (
                collection_models.CollectionRightsAllUsersModel, [item.id])
        }


class CollectionSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return collection_domain.CollectionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class CollectionSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating CollectionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel,
                [item.id[:item.id.find('-')]]),
        }


class CollectionRightsModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'collection_ids': (
                collection_models.CollectionModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_ids': (
                collection_models.CollectionRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                collection_models.CollectionRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. CollectionRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class CollectionRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating CollectionRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_manager.CollectionRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_ids': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class CollectionRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating CollectionRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'collection rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_ids': (
                collection_models.CollectionRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class CollectionRightsAllUsersModelValidator(BaseModelValidator):
    """Class for validating CollectionRightsAllUsersModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_rights_ids': (
                collection_models.CollectionRightsModel, [item.id]),
            'all_user_ids': (
                user_models.UserSettingsModel, item.all_user_ids)
        }


class CollectionCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating CollectionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'collection'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [collection/rights]-[collection_id]-[collection_version].
        regex_string = '^(collection|rights)-%s-\\d+$' % (
            item.collection_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_manager.CollectionRightsChange
        elif item.id.startswith('collection'):
            return collection_domain.CollectionChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'collection_ids': (
                collection_models.CollectionModel, [item.collection_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['collection_rights_ids'] = (
                collection_models.CollectionRightsModel, [item.collection_id])
        return external_id_relationships


class CollectionSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating CollectionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return collection_services.get_collection_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'collection_ids': (
                collection_models.CollectionModel, [item.id]),
            'collection_rights_ids': (
                collection_models.CollectionRightsModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_ids': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            list(item.contributors_summary.keys()))
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'].append((
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s') % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_node_count(cls, item):
        """Validate that node_count of model is equal to number of nodes
        in CollectionModel.collection_contents.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        collection_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_ids'])

        for (_, _, collection_model) in (
                collection_model_class_model_id_model_tuples):
            # The case for missing collection external model is ignored here
            # since errors for missing collection external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if collection_model is None or collection_model.deleted:
                continue
            nodes = collection_model.collection_contents['nodes']
            if item.node_count != len(nodes):
                cls.errors['node count check'].append((
                    'Entity id %s: Node count: %s does not match the number of '
                    'nodes in collection_contents dict: %s') % (
                        item.id, item.node_count, nodes))

    @classmethod
    def _validate_ratings_is_empty(cls, item):
        """Validate that ratings for the entity is empty.

        Args:
            item: ndb.Model. CollectionSummaryModel to validate.
        """
        if item.ratings:
            cls.errors['ratings check'].append(
                'Entity id %s: Expected ratings for the entity to be '
                'empty but received %s' % (item.id, item.ratings))

    @classmethod
    def _get_external_model_properties(cls):
        collection_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_ids'])
        collection_rights_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_rights_ids'])

        collection_model_properties_dict = {
            'title': 'title',
            'category': 'category',
            'objective': 'objective',
            'language_code': 'language_code',
            'tags': 'tags',
            'collection_model_created_on': 'created_on',
            'collection_model_last_updated': 'last_updated'
        }

        collection_rights_model_properties_dict = {
            'status': 'status',
            'community_owned': 'community_owned',
            'owner_ids': 'owner_ids',
            'editor_ids': 'editor_ids',
            'viewer_ids': 'viewer_ids',
        }

        return [(
            'collection',
            collection_model_class_model_id_model_tuples,
            collection_model_properties_dict
        ), (
            'collection rights',
            collection_rights_model_class_model_id_model_tuples,
            collection_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_node_count,
            cls._validate_ratings_is_empty,
            cls._validate_contributors_summary,
            ]


class ExplorationOpportunitySummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating ExplorationOpportunitySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            opportunity_services.get_exploration_opportunity_summary_from_model(
                item))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id]),
            'topic_ids': (
                topic_models.TopicModel, [item.topic_id]),
            'story_ids': (
                story_models.StoryModel, [item.story_id])
        }

    @classmethod
    def _validate_translation_counts(cls, item):
        """Validate that translation_counts match the translations available in
        the exploration.

        Args:
            item: ndb.Model. ExplorationOpportunitySummaryModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model)
            exploration_translation_counts = (
                exploration.get_translation_counts())
            if exploration_translation_counts != item.translation_counts:
                cls.errors['translation counts check'].append((
                    'Entity id %s: Translation counts: %s does not match the '
                    'translation counts of external exploration model: %s') % (
                        item.id, item.translation_counts,
                        exploration_translation_counts))

    @classmethod
    def _validate_content_count(cls, item):
        """Validate that content_count of model is equal to the number of
        content available in the corresponding ExplorationModel.

        Args:
            item: ndb.Model. ExplorationOpportunitySummaryModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])

        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model)
            exploration_content_count = exploration.get_content_count()
            if exploration_content_count != item.content_count:
                cls.errors['content count check'].append((
                    'Entity id %s: Content count: %s does not match the '
                    'content count of external exploration model: %s') % (
                        item.id, item.content_count, exploration_content_count))

    @classmethod
    def _validate_chapter_title(cls, item):
        """Validate that chapter_title matches the title of the corresponding
        node of StoryModel.

        Args:
            item: ndb.Model. ExplorationOpportunitySummaryModel to validate.
        """
        story_model_class_model_id_model_tuples = (
            cls.external_instance_details['story_ids'])

        for (_, _, story_model) in story_model_class_model_id_model_tuples:
            # The case for missing story external model is ignored here
            # since errors for missing story external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if story_model is None or story_model.deleted:
                continue
            story = story_fetchers.get_story_from_model(story_model)
            corresponding_story_node = (
                story.story_contents.get_node_with_corresponding_exp_id(
                    item.id))

            if item.chapter_title != corresponding_story_node.title:
                cls.errors['chapter title check'].append((
                    'Entity id %s: Chapter title: %s does not match the '
                    'chapter title of external story model: %s') % (
                        item.id, item.chapter_title,
                        corresponding_story_node.title))

    @classmethod
    def _get_external_model_properties(cls):
        topic_model_class_model_id_model_tuples = (
            cls.external_instance_details['topic_ids'])
        story_model_class_model_id_model_tuples = (
            cls.external_instance_details['story_ids'])

        topic_model_properties_dict = {
            'topic_name': 'name'
        }

        story_model_properties_dict = {
            'story_title': 'title'
        }

        return [(
            'topic',
            topic_model_class_model_id_model_tuples,
            topic_model_properties_dict
        ), (
            'story',
            story_model_class_model_id_model_tuples,
            story_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_translation_counts,
            cls._validate_content_count,
            cls._validate_chapter_title
            ]


class SkillOpportunityModelValidator(BaseSummaryModelValidator):
    """Class for validating SkillOpportunityModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return (
            opportunity_services.get_skill_opportunity_from_model(item))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel, [item.id])
        }

    @classmethod
    def _validate_question_count(cls, item):
        """Validate that question_count matches the number of questions linked
        to the opportunity's skill.

        Args:
            item: ndb.Model. SkillOpportunityModel to validate.
        """
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        for (_, _, skill_model) in (
                skill_model_class_model_id_model_tuples):
            # The case for missing skill external model is ignored here
            # since errors for missing skill external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if skill_model is None or skill_model.deleted:
                continue
            skill = skill_services.get_skill_from_model(skill_model)
            question_skill_links = (
                question_services.get_question_skill_links_of_skill(
                    skill.id, skill.description))
            question_count = len(question_skill_links)
            if question_count != item.question_count:
                cls.errors['question_count check'].append((
                    'Entity id %s: question_count: %s does not match the '
                    'question_count of external skill model: %s') % (
                        item.id, item.question_count, question_count))

    @classmethod
    def _get_external_model_properties(cls):
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        skill_model_properties_dict = {
            'skill_description': 'description'
        }

        return [(
            'skill',
            skill_model_class_model_id_model_tuples,
            skill_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_question_count,
        ]


class ConfigPropertyModelValidator(BaseModelValidator):
    """Class for validating ConfigPropertyModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'snapshot_metadata_ids': (
                config_models.ConfigPropertySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                config_models.ConfigPropertySnapshotContentModel,
                snapshot_model_ids),
        }


class ConfigPropertySnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ConfigPropertySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*-\\d+$'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return config_domain.ConfigPropertyChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_ids': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ConfigPropertySnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ConfigPropertySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'config property'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^.*-\\d+$'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'config_property_ids': (
                config_models.ConfigPropertyModel,
                [item.id[:item.id.find('-')]]),
        }


class SentEmailModelValidator(BaseModelValidator):
    """Class for validating SentEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [intent].[random hash]
        regex_string = '^%s\\.\\.[A-Za-z0-9-_]{1,%s}$' % (
            item.intent, base_models.ID_LENGTH)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'recipient_id': (
                user_models.UserSettingsModel, [item.recipient_id]),
            'sender_id': (user_models.UserSettingsModel, [item.sender_id]),
        }

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: ndb.Model. SentEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'].append((
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime))

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: ndb.Model. SentEmailModel to validate.
        """
        sender_model_class_model_id_model_tuples = (
            cls.external_instance_details['sender_id'])

        for (_, _, sender_model) in (
                sender_model_class_model_id_model_tuples):
            # The case for missing sender external model is ignored here
            # since errors for missing sender external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if sender_model is not None and not sender_model.deleted and (
                    sender_model.email != item.sender_email):
                cls.errors['sender email check'].append((
                    'Entity id %s: Sender email %s in entity does not '
                    'match with email %s of user obtained through '
                    'sender id %s') % (
                        item.id, item.sender_email, sender_model.email,
                        item.sender_id))

    @classmethod
    def _validate_recipient_email(cls, item):
        """Validate that recipient email corresponds to email of user obtained
        by using the recipient_id.

        Args:
            item: ndb.Model. SentEmailModel to validate.
        """
        recipient_model_class_model_id_model_tuples = (
            cls.external_instance_details['recipient_id'])

        for (_, _, recipient_model) in (
                recipient_model_class_model_id_model_tuples):
            # The case for missing recipient external model is ignored here
            # since errors for missing recipient external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if recipient_model is not None and not recipient_model.deleted and (
                    recipient_model.email != item.recipient_email):
                cls.errors['recipient email check'].append((
                    'Entity id %s: Recipient email %s in entity does '
                    'not match with email %s of user obtained through '
                    'recipient id %s') % (
                        item.id, item.recipient_email,
                        recipient_model.email, item.recipient_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_sent_datetime,
            cls._validate_sender_email,
            cls._validate_recipient_email]


class BulkEmailModelValidator(BaseModelValidator):
    """Class for validating BulkEmailModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'recipient_id': (
                user_models.UserSettingsModel, item.recipient_ids),
            'sender_id': (user_models.UserSettingsModel, [item.sender_id]),
        }

    @classmethod
    def _validate_sent_datetime(cls, item):
        """Validate that sent_datetime of model is less than current time.

        Args:
            item: ndb.Model. BulkEmailModel to validate.
        """
        current_datetime = datetime.datetime.utcnow()
        if item.sent_datetime > current_datetime:
            cls.errors['sent datetime check'].append((
                'Entity id %s: The sent_datetime field has a value %s which is '
                'greater than the time when the job was run'
                ) % (item.id, item.sent_datetime))

    @classmethod
    def _validate_sender_email(cls, item):
        """Validate that sender email corresponds to email of user obtained
        by using the sender_id.

        Args:
            item: ndb.Model. BulkEmailModel to validate.
        """
        sender_model_class_model_id_model_tuples = (
            cls.external_instance_details['sender_id'])

        for (_, _, sender_model) in (
                sender_model_class_model_id_model_tuples):
            # The case for missing sender external model is ignored here
            # since errors for missing sender external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if sender_model is not None and not sender_model.deleted and (
                    sender_model.email != item.sender_email):
                cls.errors['sender email check'].append((
                    'Entity id %s: Sender email %s in entity does not '
                    'match with email %s of user obtained through '
                    'sender id %s') % (
                        item.id, item.sender_email, sender_model.email,
                        item.sender_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_sent_datetime,
            cls._validate_sender_email]


class GeneralFeedbackEmailReplyToIdModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackEmailReplyToIdModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return (
            '^%s\\.(%s)\\.[A-Za-z0-9-_]{1,%s}\\.'
            '[A-Za-z0-9=+/]{1,}') % (
                USER_ID_REGEX,
                ('|').join(suggestion_models.TARGET_TYPE_CHOICES),
                base_models.ID_LENGTH)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'item.id.user_id': (
                user_models.UserSettingsModel, [
                    item.id[:item.id.find('.')]]),
            'item.id.thread_id': (
                feedback_models.GeneralFeedbackThreadModel, [
                    item.id[item.id.find('.') + 1:]]),
        }

    @classmethod
    def _validate_reply_to_id_length(cls, item):
        """Validate that reply_to_id length is less than or equal to
        REPLY_TO_ID_LENGTH.

        Args:
            item: ndb.Model. GeneralFeedbackEmailReplyToIdModel to validate.
        """
        # The reply_to_id of model is created using utils.get_random_int
        # method by using a upper bound as email_models.REPLY_TO_ID_LENGTH.
        # So, the reply_to_id length should be less than or equal to
        # email_models.REPLY_TO_ID_LENGTH.
        if len(item.reply_to_id) > email_models.REPLY_TO_ID_LENGTH:
            cls.errors['reply_to_id length check'].append((
                'Entity id %s: reply_to_id %s should have length less than or '
                'equal to %s but instead has length %s' % (
                    item.id, item.reply_to_id, email_models.REPLY_TO_ID_LENGTH,
                    len(item.reply_to_id))))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_reply_to_id_length]


class ExplorationModelValidator(BaseModelValidator):
    """Class for validating ExplorationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_fetchers.get_exploration_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'exploration_commit_log_entry_ids': (
                exp_models.ExplorationCommitLogEntryModel,
                ['exploration-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'exp_summary_ids': (
                exp_models.ExpSummaryModel, [item.id]),
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                exp_models.ExplorationSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                exp_models.ExplorationSnapshotContentModel,
                snapshot_model_ids),
            'all_users_model_ids': (
                exp_models.ExplorationRightsAllUsersModel, [item.id])
        }


class ExplorationSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return exp_domain.ExplorationChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ExplorationSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ExplorationSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id[:item.id.find('-')]]),
        }


class ExplorationRightsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        cloned_from_exploration_id = []
        if item.cloned_from:
            cloned_from_exploration_id.append(item.cloned_from)
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id]),
            'cloned_from_exploration_ids': (
                exp_models.ExplorationModel,
                cloned_from_exploration_id),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'snapshot_metadata_ids': (
                exp_models.ExplorationRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                exp_models.ExplorationRightsSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. ExplorationRightsModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_first_published_msec]


class ExplorationRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating ExplorationRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return rights_manager.ExplorationRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class ExplorationRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating ExplorationRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'exploration rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class ExplorationRightsAllUsersModelValidator(BaseModelValidator):
    """Class for validating ExplorationRightsAllUsersModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel, [item.id]),
            'all_user_ids': (
                user_models.UserSettingsModel, item.all_user_ids)
        }


class ExplorationCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating ExplorationCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'exploration'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [exploration/rights]-[exploration_id]-[exploration-version].
        regex_string = '^(exploration|rights)-%s-\\d+$' % (
            item.exploration_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return rights_manager.ExplorationRightsChange
        elif item.id.startswith('exploration'):
            return exp_domain.ExplorationChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.exploration_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['exploration_rights_ids'] = (
                exp_models.ExplorationRightsModel, [item.exploration_id])
        return external_id_relationships


class ExpSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating ExpSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return exp_fetchers.get_exploration_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel, [item.id]),
            'exploration_rights_ids': (
                exp_models.ExplorationRightsModel, [item.id]),
            'owner_user_ids': (
                user_models.UserSettingsModel, item.owner_ids),
            'editor_user_ids': (
                user_models.UserSettingsModel, item.editor_ids),
            'viewer_user_ids': (
                user_models.UserSettingsModel, item.viewer_ids),
            'contributor_user_ids': (
                user_models.UserSettingsModel, item.contributor_ids)
        }

    @classmethod
    def _validate_contributors_summary(cls, item):
        """Validate that contributor ids match the contributor ids obtained
        from contributors summary.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        contributor_ids_from_contributors_summary = (
            list(item.contributors_summary.keys()))
        if sorted(item.contributor_ids) != sorted(
                contributor_ids_from_contributors_summary):
            cls.errors['contributors summary check'].append((
                'Entity id %s: Contributor ids: %s do not match the '
                'contributor ids obtained using contributors summary: %s') % (
                    item.id, sorted(item.contributor_ids),
                    sorted(contributor_ids_from_contributors_summary)))

    @classmethod
    def _validate_first_published_msec(cls, item):
        """Validate that first published time of model is less than current
        time.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        if not item.first_published_msec:
            return

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.first_published_msec > current_time_msec:
            cls.errors['first published msec check'].append((
                'Entity id %s: The first_published_msec field has a value %s '
                'which is greater than the time when the job was run'
                ) % (item.id, item.first_published_msec))

    @classmethod
    def _validate_exploration_model_last_updated(cls, item):
        """Validate that item.exploration_model_last_updated matches the
        time when a last commit was made by a human contributor.

        Args:
            item: ndb.Model. ExpSummaryModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            last_human_update_ms = exp_services.get_last_updated_by_human_ms(
                exploration_model.id)
            last_human_update_time = datetime.datetime.fromtimestamp(
                python_utils.divide(last_human_update_ms, 1000.0))
            if item.exploration_model_last_updated != last_human_update_time:
                cls.errors['exploration model last updated check'].append((
                    'Entity id %s: The exploration_model_last_updated '
                    'field: %s does not match the last time a commit was '
                    'made by a human contributor: %s') % (
                        item.id, item.exploration_model_last_updated,
                        last_human_update_time))

    @classmethod
    def _get_external_model_properties(cls):
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        exploration_rights_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_rights_ids'])

        exploration_model_properties_dict = {
            'title': 'title',
            'category': 'category',
            'objective': 'objective',
            'language_code': 'language_code',
            'tags': 'tags',
            'exploration_model_created_on': 'created_on',
        }

        exploration_rights_model_properties_dict = {
            'first_published_msec': 'first_published_msec',
            'status': 'status',
            'community_owned': 'community_owned',
            'owner_ids': 'owner_ids',
            'editor_ids': 'editor_ids',
            'viewer_ids': 'viewer_ids',
        }

        return [(
            'exploration',
            exploration_model_class_model_id_model_tuples,
            exploration_model_properties_dict
        ), (
            'exploration rights',
            exploration_rights_model_class_model_id_model_tuples,
            exploration_rights_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_first_published_msec,
            cls._validate_contributors_summary,
            cls._validate_exploration_model_last_updated]


class GeneralFeedbackThreadModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackThreadModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [ENTITY_TYPE].[ENTITY_ID].[GENERATED_STRING].
        regex_string = '%s\\.%s\\.[A-Za-z0-9=+/]{1,}$' % (
            item.entity_type, item.entity_id)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_instance_details = {
            'message_ids': (
                feedback_models.GeneralFeedbackMessageModel,
                ['%s.%s' % (item.id, i) for i in python_utils.RANGE(
                    item.message_count)])
        }
        if item.original_author_id:
            external_instance_details['author_ids'] = (
                user_models.UserSettingsModel, [item.original_author_id])
        if item.has_suggestion:
            external_instance_details['suggestion_ids'] = (
                suggestion_models.GeneralSuggestionModel, [item.id])
        if item.entity_type in TARGET_TYPE_TO_TARGET_MODEL:
            external_instance_details['%s_ids' % item.entity_type] = (
                TARGET_TYPE_TO_TARGET_MODEL[item.entity_type],
                [item.entity_id])
        return external_instance_details

    @classmethod
    def _validate_entity_type(cls, item):
        """Validate the entity type is valid.

        Args:
            item: ndb.Model. GeneralFeedbackThreadModel to validate.
        """
        if item.entity_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls.errors['entity type check'].append(
                'Entity id %s: Entity type %s is not allowed' % (
                    item.id, item.entity_type))

    @classmethod
    def _validate_has_suggestion(cls, item):
        """Validate that has_suggestion is False only if no suggestion
        with id same as thread id exists.

        Args:
            item: ndb.Model. GeneralFeedbackThreadModel to validate.
        """
        if not item.has_suggestion:
            suggestion_model = (
                suggestion_models.GeneralSuggestionModel.get_by_id(item.id))
            if suggestion_model is not None and not suggestion_model.deleted:
                cls.errors['has suggestion check'].append(
                    'Entity id %s: has suggestion for entity is false '
                    'but a suggestion exists with id same as entity id' % (
                        item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_entity_type,
            cls._validate_has_suggestion]


class GeneralFeedbackMessageModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackMessageModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [thread_id].[message_id]
        regex_string = '^%s\\.%s$' % (item.thread_id, item.message_id)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        author_ids = []
        if item.author_id:
            author_ids = [item.author_id]
        return {
            'author_ids': (user_models.UserSettingsModel, author_ids),
            'feedback_thread_ids': (
                feedback_models.GeneralFeedbackThreadModel, [item.thread_id])
        }

    @classmethod
    def _validate_message_id(cls, item):
        """Validate that message_id is less than the message count for
        feedback thread corresponding to the entity

        Args:
            item: ndb.Model. GeneralFeedbackMessageModel to validate.
        """
        feedback_thread_model_class_model_id_model_tuples = (
            cls.external_instance_details['feedback_thread_ids'])

        for (_, _, feedback_thread_model) in (
                feedback_thread_model_class_model_id_model_tuples):
            # The case for missing feedback external model is ignored here
            # since errors for missing feedback external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if feedback_thread_model is not None and not (
                    feedback_thread_model.deleted) and (
                        item.message_id >= feedback_thread_model.message_count):
                cls.errors['message id check'].append(
                    'Entity id %s: message id %s not less than total count '
                    'of messages %s in feedback thread model with id %s '
                    'corresponding to the entity' % (
                        item.id, item.message_id,
                        feedback_thread_model.message_count,
                        feedback_thread_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_message_id]


class GeneralFeedbackThreadUserModelValidator(BaseModelValidator):
    """Class for validating GeneralFeedbackThreadUserModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: [user_id].[thread_id]
        thread_id_string = '%s\\.[A-Za-z0-9-_]{1,%s}\\.[A-Za-z0-9-_=]{1,}' % (
            ('|').join(suggestion_models.TARGET_TYPE_CHOICES),
            base_models.ID_LENGTH)
        regex_string = '^%s\\.%s$' % (USER_ID_REGEX, thread_id_string)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        message_ids = []
        user_ids = []
        if '.' in item.id:
            index = item.id.find('.')
            user_ids = [item.id[:index]]
            message_ids = ['%s.%s' % (
                item.id[index + 1:], message_id) for message_id in (
                    item.message_ids_read_by_user)]
        return {
            'message_ids': (
                feedback_models.GeneralFeedbackMessageModel, message_ids),
            'user_ids': (user_models.UserSettingsModel, user_ids)
        }


class FeedbackAnalyticsModelValidator(BaseModelValidator):
    """Class for validating FeedbackAnalyticsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (exp_models.ExplorationModel, [item.id])
        }


class UnsentFeedbackEmailModelValidator(BaseModelValidator):
    """Class for validating UnsentFeedbackEmailModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^%s$' % USER_ID_REGEX

    @classmethod
    def _get_external_id_relationships(cls, item):
        message_ids = []
        for reference in item.feedback_message_references:
            try:
                message_ids.append('%s.%s' % (
                    reference['thread_id'], reference['message_id']))
            except Exception:
                cls.errors['feedback message reference check'].append(
                    'Entity id %s: Invalid feedback reference: %s' % (
                        item.id, reference))
        return {
            'user_ids': (user_models.UserSettingsModel, [item.id]),
            'message_ids': (
                feedback_models.GeneralFeedbackMessageModel, message_ids)
        }

    @classmethod
    def _validate_entity_type_and_entity_id_feedback_reference(cls, item):
        """Validate that entity_type and entity_type are same as corresponding
        values in thread_id of feedback_reference.

        Args:
            item: ndb.Model. UnsentFeedbackEmailModel to validate.
        """
        for reference in item.feedback_message_references:
            try:
                split_thread_id = reference['thread_id'].split('.')
                if split_thread_id[0] != reference['entity_type'] or (
                        split_thread_id[1] != reference['entity_id']):
                    cls.errors['feedback message reference check'].append(
                        'Entity id %s: Invalid feedback reference: %s' % (
                            item.id, reference))
            except Exception:
                cls.errors['feedback message reference check'].append(
                    'Entity id %s: Invalid feedback reference: %s' % (
                        item.id, reference))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_entity_type_and_entity_id_feedback_reference]


class JobModelValidator(BaseModelValidator):
    """Class for validating JobModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [job_type]-[current time]-[random int]
        regex_string = '^%s-\\d*-\\d*$' % item.job_type
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_time_fields(cls, item):
        """Validate the time fields in entity.

        Args:
            item: ndb.Model. JobModel to validate.
        """
        if item.time_started_msec and (
                item.time_queued_msec > item.time_started_msec):
            cls.errors['time queued check'].append(
                'Entity id %s: time queued %s is greater '
                'than time started %s' % (
                    item.id, item.time_queued_msec, item.time_started_msec))

        if item.time_finished_msec and (
                item.time_started_msec > item.time_finished_msec):
            cls.errors['time started check'].append(
                'Entity id %s: time started %s is greater '
                'than time finished %s' % (
                    item.id, item.time_started_msec, item.time_finished_msec))

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.time_finished_msec > current_time_msec:
            cls.errors['time finished check'].append(
                'Entity id %s: time finished %s is greater '
                'than the current time' % (
                    item.id, item.time_finished_msec))

    @classmethod
    def _validate_error(cls, item):
        """Validate error is not None only if status is not canceled
        or failed.

        Args:
            item: ndb.Model. JobModel to validate.
        """
        if item.error and item.status_code not in [
                job_models.STATUS_CODE_FAILED, job_models.STATUS_CODE_CANCELED]:
            cls.errors['error check'].append(
                'Entity id %s: error: %s for job is not empty but '
                'job status is %s' % (item.id, item.error, item.status_code))

        if not item.error and item.status_code in [
                job_models.STATUS_CODE_FAILED, job_models.STATUS_CODE_CANCELED]:
            cls.errors['error check'].append(
                'Entity id %s: error for job is empty but '
                'job status is %s' % (item.id, item.status_code))


    @classmethod
    def _validate_output(cls, item):
        """Validate output for entity is present only if status is
        completed.

        Args:
            item: ndb.Model. JobModel to validate.
        """
        if item.output and item.status_code != job_models.STATUS_CODE_COMPLETED:
            cls.errors['output check'].append(
                'Entity id %s: output: %s for job is not empty but '
                'job status is %s' % (item.id, item.output, item.status_code))

        if item.output is None and (
                item.status_code == job_models.STATUS_CODE_COMPLETED):
            cls.errors['output check'].append(
                'Entity id %s: output for job is empty but '
                'job status is %s' % (item.id, item.status_code))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_time_fields,
            cls._validate_error,
            cls._validate_output]


class ContinuousComputationModelValidator(BaseModelValidator):
    """Class for validating ContinuousComputationModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: Name of continuous computation manager class.
        regex_string = '^(%s)$' % ('|').join(
            ALL_CONTINUOUS_COMPUTATION_MANAGERS_CLASS_NAMES)
        return regex_string

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_time_fields(cls, item):
        """Validate the time fields in entity.

        Args:
            item: ndb.Model. ContinuousComputationModel to validate.
        """
        if item.last_started_msec > item.last_finished_msec and (
                item.last_started_msec > item.last_stopped_msec):
            cls.errors['last started check'].append(
                'Entity id %s: last started %s is greater '
                'than both last finished %s and last stopped %s' % (
                    item.id, item.last_started_msec, item.last_finished_msec,
                    item.last_stopped_msec))

        current_time_msec = utils.get_current_time_in_millisecs()
        if item.last_finished_msec > current_time_msec:
            cls.errors['last finished check'].append(
                'Entity id %s: last finished %s is greater '
                'than the current time' % (
                    item.id, item.last_finished_msec))

        if item.last_stopped_msec > current_time_msec:
            cls.errors['last stopped check'].append(
                'Entity id %s: last stopped %s is greater '
                'than the current time' % (
                    item.id, item.last_stopped_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_time_fields]


class QuestionModelValidator(BaseModelValidator):
    """Class for validating QuestionModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_fetchers.get_question_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return {
            'question_commit_log_entry_ids': (
                question_models.QuestionCommitLogEntryModel,
                ['question-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'question_summary_ids': (
                question_models.QuestionSummaryModel, [item.id]),
            'snapshot_metadata_ids': (
                question_models.QuestionSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                question_models.QuestionSnapshotContentModel,
                snapshot_model_ids),
            'linked_skill_ids': (
                skill_models.SkillModel, item.linked_skill_ids)
        }


class ExplorationContextModelValidator(BaseModelValidator):
    """Class for validating ExplorationContextModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.story_id]),
            'exp_ids': (
                exp_models.ExplorationModel, [item.id])
        }


class QuestionSkillLinkModelValidator(BaseModelValidator):
    """Class for validating QuestionSkillLinkModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '%s:%s' % (item.question_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'question_ids': (
                question_models.QuestionModel, [item.question_id]),
            'skill_ids': (
                skill_models.SkillModel, [item.skill_id])
        }


class QuestionSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating QuestionSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return question_domain.QuestionChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'question_ids': (
                question_models.QuestionModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class QuestionSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating QuestionSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'question_ids': (
                question_models.QuestionModel,
                [item.id[:item.id.find('-')]]),
        }


class QuestionCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating QuestionCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'question'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [question]-[question_id]-[question_version].
        regex_string = '^(question)-%s-\\d+$' % (
            item.question_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('question'):
            return question_domain.QuestionChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'question_ids': (
                question_models.QuestionModel, [item.question_id]),
        }


class QuestionSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating QuestionSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return question_services.get_question_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'question_ids': (
                question_models.QuestionModel, [item.id])
        }

    @classmethod
    def _validate_question_content(cls, item):
        """Validate that question_content model is equal to
        QuestionModel.question_state_data.content.html.

        Args:
            item: ndb.Model. QuestionSummaryModel to validate.
        """
        question_model_class_model_id_model_tuples = (
            cls.external_instance_details['question_ids'])

        for (_, _, question_model) in (
                question_model_class_model_id_model_tuples):
            # The case for missing question external model is ignored here
            # since errors for missing question external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if question_model is None or question_model.deleted:
                continue
            content_html = question_model.question_state_data['content']['html']
            if item.question_content != content_html:
                cls.errors['question content check'].append((
                    'Entity id %s: Question content: %s does not match '
                    'content html in question state data in question '
                    'model: %s') % (
                        item.id, item.question_content,
                        content_html))

    @classmethod
    def _get_external_model_properties(cls):
        question_model_class_model_id_model_tuples = (
            cls.external_instance_details['question_ids'])

        question_model_properties_dict = {
            'question_model_created_on': 'created_on',
            'question_model_last_updated': 'last_updated'
        }

        return [(
            'question',
            question_model_class_model_id_model_tuples,
            question_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_question_content]


class ExplorationRecommendationsModelValidator(BaseModelValidator):
    """Class for validating ExplorationRecommendationsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'exploration_ids': (
                exp_models.ExplorationModel,
                [item.id] + item.recommended_exploration_ids),
        }

    @classmethod
    def _validate_item_id_not_in_recommended_exploration_ids(cls, item):
        """Validate that model id is not present in recommended exploration ids.

        Args:
            item: ndb.Model. ExplorationRecommendationsModel to validate.
        """
        if item.id in item.recommended_exploration_ids:
            cls.errors['item exploration id check'].append((
                'Entity id %s: The exploration id: %s for which the entity is '
                'created is also present in the recommended exploration ids '
                'for entity') % (item.id, item.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_item_id_not_in_recommended_exploration_ids]


class TopicSimilaritiesModelValidator(BaseModelValidator):
    """Class for validating TopicSimilaritiesModel."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        # Valid id: topics.
        return '^%s$' % recommendations_models.TOPIC_SIMILARITIES_ID

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_topic_similarities(cls, item):
        """Validate the topic similarities to be symmetric and have real
        values between 0.0 and 1.0.

        Args:
            item: ndb.Model. TopicSimilaritiesModel to validate.
        """

        topics = list(item.content.keys())
        data = '%s\n' % (',').join(topics)

        for topic1 in topics:
            similarity_list = []
            for topic2 in item.content[topic1]:
                similarity_list.append(
                    python_utils.UNICODE(item.content[topic1][topic2]))
            if len(similarity_list):
                data = data + '%s\n' % (',').join(similarity_list)

        try:
            recommendations_services.validate_topic_similarities(data)
        except Exception as e:
            cls.errors['topic similarity check'].append(
                'Entity id %s: Topic similarity validation for content: %s '
                'fails with error: %s' % (item.id, item.content, e))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_topic_similarities]


class SkillModelValidator(BaseModelValidator):
    """Class for validating SkillModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_services.get_skill_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        superseding_skill_ids = []
        if item.superseding_skill_id:
            superseding_skill_ids = [item.superseding_skill_id]
        return {
            'skill_commit_log_entry_ids': (
                skill_models.SkillCommitLogEntryModel,
                ['skill-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'skill_summary_ids': (
                skill_models.SkillSummaryModel, [item.id]),
            'superseding_skill_ids': (
                skill_models.SkillModel, superseding_skill_ids),
            'snapshot_metadata_ids': (
                skill_models.SkillSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                skill_models.SkillSnapshotContentModel,
                snapshot_model_ids),
        }

    @classmethod
    def _validate_all_questions_merged(cls, item):
        """Validate that all_questions_merged is True only if
        superseding_skill_id is not None and there are no
        questions linked with the skill. The superseding skill
        id check is already performed in domain object validation,
        so it is not repeated here.

        Args:
            item: ndb.Model. SkillModel to validate.
        """
        questions_ids_linked_with_skill = (
            question_models.QuestionSkillLinkModel
            .get_all_question_ids_linked_to_skill_id(item.id))
        if item.all_questions_merged and questions_ids_linked_with_skill:
            cls.errors['all questions merged check'].append(
                'Entity id %s: all_questions_merged is True but the '
                'following question ids are still linked to the skill: %s' % (
                    item.id, questions_ids_linked_with_skill))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_all_questions_merged]


class SkillSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating SkillSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return skill_domain.SkillChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class SkillSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating SkillSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel,
                [item.id[:item.id.find('-')]]),
        }


class SkillCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating SkillCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'skill'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [skill/rights]-[skill_id]-[skill_version].
        regex_string = '^(skill|rights)-%s-\\d+$' % (
            item.skill_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('skill'):
            return skill_domain.SkillChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'skill_ids': (
                skill_models.SkillModel, [item.skill_id]),
        }
        return external_id_relationships


class SkillSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating SkillSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return skill_services.get_skill_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'skill_ids': (
                skill_models.SkillModel, [item.id])
        }

    @classmethod
    def _validate_misconception_count(cls, item):
        """Validate that misconception_count of model is equal to
        number of misconceptions in SkillModel.misconceptions.

        Args:
            item: ndb.Model. SkillSummaryModel to validate.
        """
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        for (_, _, skill_model) in (
                skill_model_class_model_id_model_tuples):
            # The case for missing skill external model is ignored here
            # since errors for missing skill external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if not skill_model or skill_model.deleted:
                continue
            if item.misconception_count != len(skill_model.misconceptions):
                cls.errors['misconception count check'].append((
                    'Entity id %s: Misconception count: %s does not match '
                    'the number of misconceptions in skill model: %s') % (
                        item.id, item.misconception_count,
                        skill_model.misconceptions))

    @classmethod
    def _validate_worked_examples_count(cls, item):
        """Validate that worked examples count of model is equal to
        number of misconceptions in SkillModel.skill_contents.worked_examples.

        Args:
            item: ndb.Model. SkillSummaryModel to validate.
        """
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        for (_, _, skill_model) in (
                skill_model_class_model_id_model_tuples):
            # The case for missing skill external model is ignored here
            # since errors for missing skill external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if not skill_model or skill_model.deleted:
                continue
            if item.worked_examples_count != len(
                    skill_model.skill_contents['worked_examples']):
                cls.errors['worked examples count check'].append((
                    'Entity id %s: Worked examples count: %s does not match '
                    'the number of worked examples in skill_contents '
                    'in skill model: %s') % (
                        item.id, item.worked_examples_count,
                        skill_model.skill_contents['worked_examples']))

    @classmethod
    def _get_external_model_properties(cls):
        skill_model_class_model_id_model_tuples = (
            cls.external_instance_details['skill_ids'])

        skill_model_properties_dict = {
            'description': 'description',
            'language_code': 'language_code',
            'skill_model_created_on': 'created_on',
            'skill_model_last_updated': 'last_updated'
        }

        return [(
            'skill',
            skill_model_class_model_id_model_tuples,
            skill_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_misconception_count,
            cls._validate_worked_examples_count]


class StoryModelValidator(BaseModelValidator):
    """Class for validating StoryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version)
            for version in python_utils.RANGE(1, item.version + 1)]
        return {
            'story_commit_log_entry_ids': (
                story_models.StoryCommitLogEntryModel,
                ['story-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'story_summary_ids': (
                story_models.StorySummaryModel, [item.id]),
            'snapshot_metadata_ids': (
                story_models.StorySnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                story_models.StorySnapshotContentModel,
                snapshot_model_ids),
            'exploration_ids': (
                exp_models.ExplorationModel,
                [node['exploration_id'] for node in (
                    item.story_contents['nodes'])])
        }


class StorySnapshotMetadataModelValidator(BaseSnapshotMetadataModelValidator):
    """Class for validating StorySnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return story_domain.StoryChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class StorySnapshotContentModelValidator(BaseSnapshotContentModelValidator):
    """Class for validating StorySnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id[:item.id.find('-')]]),
        }


class StoryCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating StoryCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'story'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [story]-[story_id]-[story_version].
        regex_string = '^(story)-%s-\\d+$' % (
            item.story_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('story'):
            return story_domain.StoryChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.story_id]),
        }


class StorySummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating StorySummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return story_fetchers.get_story_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'story_ids': (
                story_models.StoryModel, [item.id])
        }

    @classmethod
    def _validate_node_titles(cls, item):
        """Validate that node_titles of model is equal to list of node titles
        in StoryModel.story_contents.

        Args:
            item: ndb.Model. StorySummaryModel to validate.
        """
        story_model_class_model_id_model_tuples = cls.external_instance_details[
            'story_ids']

        for (_, _, story_model) in story_model_class_model_id_model_tuples:
            # The case for missing story external model is ignored here
            # since errors for missing story external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if story_model is None or story_model.deleted:
                continue
            nodes = story_model.story_contents['nodes']
            node_titles = [node.title for node in nodes]
            if item.node_titles != node_titles:
                cls.errors['node titles check'].append((
                    'Entity id %s: Node titles: %s does not match the '
                    'nodes in story_contents dict: %s') % (
                        item.id, item.node_titles, nodes))

    @classmethod
    def _get_external_model_properties(cls):
        story_model_class_model_id_model_tuples = cls.external_instance_details[
            'story_ids']

        story_model_properties_dict = {
            'title': 'title',
            'language_code': 'language_code',
            'description': 'description',
            'story_model_created_on': 'created_on',
            'story_model_last_updated': 'last_updated'
        }

        return [(
            'story',
            story_model_class_model_id_model_tuples,
            story_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_node_titles]


class GeneralSuggestionModelValidator(BaseModelValidator):
    """Class for validating GeneralSuggestionModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: same as thread id:
        # [target_type].[target_id].[GENERATED_STRING].
        regex_string = '^%s\\.%s\\.[A-Za-z0-9=+/]{1,}$' % (
            item.target_type, item.target_id)
        return regex_string

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            return suggestion_services.get_suggestion_from_model(item)
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_instance_details = {
            'feedback_thread_ids': (
                feedback_models.GeneralFeedbackThreadModel, [item.id]),
            'author_ids': (user_models.UserSettingsModel, [item.author_id]),
        }
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            external_instance_details['%s_ids' % item.target_type] = (
                TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                [item.target_id])
        if item.final_reviewer_id:
            external_instance_details['reviewer_ids'] = (
                user_models.UserSettingsModel, [item.final_reviewer_id])
        return external_instance_details

    @classmethod
    def _validate_target_type(cls, item):
        """Validate the target type is valid.

        Args:
            item: ndb.Model. GeneralSuggestionModel to validate.
        """
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            cls.errors['target type check'].append(
                'Entity id %s: Target type %s is not allowed' % (
                    item.id, item.target_type))

    @classmethod
    def _validate_target_version_at_submission(cls, item):
        """Validate the target version at submission is less than or
        equal to the version of the target model.

        Args:
            item: ndb.Model. GeneralSuggestionModel to validate.
        """
        if item.target_type not in TARGET_TYPE_TO_TARGET_MODEL:
            return
        target_model_class_model_id_model_tuples = (
            cls.external_instance_details['%s_ids' % item.target_type])

        for (_, _, target_model) in (
                target_model_class_model_id_model_tuples):
            # The case for missing target external model is ignored here
            # since errors for missing target external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if target_model is None or target_model.deleted:
                continue
            if item.target_version_at_submission > target_model.version:
                cls.errors['target version at submission check'].append(
                    'Entity id %s: target version %s in entity is greater '
                    'than the version %s of %s corresponding to '
                    'id %s' % (
                        item.id, item.target_version_at_submission,
                        target_model.version, item.target_type, item.target_id))

    @classmethod
    def _validate_final_reveiwer_id(cls, item):
        """Validate that final reviewer id is None if suggestion is
        under review.

        Args:
            item: ndb.Model. GeneralSuggestionModel to validate.
        """
        if item.final_reviewer_id is None and (
                item.status != suggestion_models.STATUS_IN_REVIEW):
            cls.errors['final reviewer check'].append(
                'Entity id %s: Final reviewer id is empty but '
                'suggestion is %s' % (item.id, item.status))

        if item.final_reviewer_id and (
                item.status == suggestion_models.STATUS_IN_REVIEW):
            cls.errors['final reviewer check'].append(
                'Entity id %s: Final reviewer id %s is not empty but '
                'suggestion is in review' % (item.id, item.final_reviewer_id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_target_type,
            cls._validate_target_version_at_submission,
            cls._validate_final_reveiwer_id]


class GeneralVoiceoverApplicationModelValidator(BaseModelValidator):
    """Class for validating GeneralVoiceoverApplicationModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        """Returns a domain object instance created from the model.

        Args:
            item: GeneralVoiceoverApplicationModel. Entity to validate.

        Returns:
            *. A domain object to validate.
        """
        return voiceover_services.get_voiceover_application_by_id(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_instance_details = {
            'author_ids': (user_models.UserSettingsModel, [item.author_id]),
        }
        if item.target_type in TARGET_TYPE_TO_TARGET_MODEL:
            external_instance_details['%s_ids' % item.target_type] = (
                TARGET_TYPE_TO_TARGET_MODEL[item.target_type],
                [item.target_id])
        if item.final_reviewer_id is not None:
            external_instance_details['final_reviewer_ids'] = (
                user_models.UserSettingsModel, [item.final_reviewer_id])
        return external_instance_details


class TopicModelValidator(BaseModelValidator):
    """Class for validating TopicModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_fetchers.get_topic_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        skill_ids = item.uncategorized_skill_ids
        for subtopic in item.subtopics:
            skill_ids = skill_ids + subtopic['skill_ids']
        skill_ids = list(set(skill_ids))
        canonical_story_ids = [
            reference['story_id']
            for reference in item.canonical_story_references]
        additional_story_ids = [
            reference['story_id']
            for reference in item.additional_story_references]
        return {
            'topic_commit_log_entry_ids': (
                topic_models.TopicCommitLogEntryModel,
                ['topic-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'topic_summary_ids': (
                topic_models.TopicSummaryModel, [item.id]),
            'topic_rights_ids': (
                topic_models.TopicRightsModel, [item.id]),
            'snapshot_metadata_ids': (
                topic_models.TopicSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.TopicSnapshotContentModel,
                snapshot_model_ids),
            'story_ids': (
                story_models.StoryModel,
                canonical_story_ids + additional_story_ids),
            'skill_ids': (skill_models.SkillModel, skill_ids),
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel,
                ['%s-%s' % (
                    item.id, subtopic['id']) for subtopic in item.subtopics]),
            'all_users_model_ids': (
                topic_models.TopicRightsAllUsersModel, [item.id])
        }

    @classmethod
    def _validate_canonical_name_is_unique(cls, item):
        """Validate that canonical name of the model unique.

        Args:
            item: ndb.Model. TopicModel to validate.
        """
        topic_models_list = topic_models.TopicModel.query().filter(
            topic_models.TopicModel.canonical_name == (
                item.canonical_name)).filter(
                    topic_models.TopicModel.deleted == False).fetch() # pylint: disable=singleton-comparison
        topic_model_ids = [
            topic_model.id
            for topic_model in topic_models_list if topic_model.id != item.id]
        if topic_model_ids:
            cls.errors['unique name check'].append(
                'Entity id %s: canonical name %s matches with canonical '
                'name of topic models with ids %s' % (
                    item.id, item.canonical_name, topic_model_ids))

    @classmethod
    def _validate_canonical_name_matches_name_in_lowercase(cls, item):
        """Validate that canonical name of the model is same as name of the
        model in lowercase.

        Args:
            item: ndb.Model. TopicModel to validate.
        """
        name = item.name
        if name.lower() != item.canonical_name:
            cls.errors['canonical name check'].append(
                'Entity id %s: Entity name %s in lowercase does not match '
                'canonical name %s' % (item.id, item.name, item.canonical_name))

    @classmethod
    def _validate_uncategorized_skill_ids_not_in_subtopic_skill_ids(cls, item):
        """Validate that uncategorized_skill_ids of model is not present in
        any subtopic of the model.

        Args:
            item: ndb.Model. TopicModel to validate.
        """
        for skill_id in item.uncategorized_skill_ids:
            for subtopic in item.subtopics:
                if skill_id in subtopic['skill_ids']:
                    cls.errors['uncategorized skill ids check'].append(
                        'Entity id %s: uncategorized skill id %s is present '
                        'in subtopic for entity with id %s' % (
                            item.id, skill_id, subtopic['id']))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_name_is_unique,
            cls._validate_canonical_name_matches_name_in_lowercase,
            cls._validate_uncategorized_skill_ids_not_in_subtopic_skill_ids]


class TopicSnapshotMetadataModelValidator(BaseSnapshotMetadataModelValidator):
    """Class for validating TopicSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class TopicSnapshotContentModelValidator(BaseSnapshotContentModelValidator):
    """Class for validating TopicSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id[:item.id.find('-')]]),
        }


class TopicRightsModelValidator(BaseModelValidator):
    """Class for validating TopicRightsModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id]),
            'manager_user_ids': (
                user_models.UserSettingsModel, item.manager_ids),
            'snapshot_metadata_ids': (
                topic_models.TopicRightsSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.TopicRightsSnapshotContentModel,
                snapshot_model_ids),
        }


class TopicRightsSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating TopicRightsSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return topic_domain.TopicRightsChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_rights_ids': (
                topic_models.TopicRightsModel,
                [item.id[:item.id.find('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class TopicRightsSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating TopicRightsSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'topic rights'

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_rights_ids': (
                topic_models.TopicRightsModel,
                [item.id[:item.id.find('-')]]),
        }


class TopicRightsAllUsersModelValidator(BaseModelValidator):
    """Class for validating TopicRightsAllUsersModel."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_rights_ids': (
                topic_models.TopicRightsModel, [item.id]),
            'all_user_ids': (
                user_models.UserSettingsModel, item.all_user_ids)
        }


class TopicCommitLogEntryModelValidator(BaseCommitLogEntryModelValidator):
    """Class for validating TopicCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'topic'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [topic/rights]-[topic_id]-[topic_version].
        regex_string = '^(topic|rights)-%s-\\d*$' % (
            item.topic_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('rights'):
            return topic_domain.TopicRightsChange
        elif item.id.startswith('topic'):
            return topic_domain.TopicChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        external_id_relationships = {
            'topic_ids': (
                topic_models.TopicModel, [item.topic_id]),
        }
        if item.id.startswith('rights'):
            external_id_relationships['topic_rights_ids'] = (
                topic_models.TopicRightsModel, [item.topic_id])
        return external_id_relationships


class TopicSummaryModelValidator(BaseSummaryModelValidator):
    """Class for validating TopicSummaryModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return topic_services.get_topic_summary_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'topic_ids': (
                topic_models.TopicModel, [item.id]),
            'topic_rights_ids': (
                topic_models.TopicRightsModel, [item.id]),
        }

    @classmethod
    def _validate_canonical_story_count(cls, item):
        """Validate that canonical story count of model is equal to
        number of story ids in TopicModel.canonical_story_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            # The case for missing topic external model is ignored here
            # since errors for missing topic external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if topic_model is None or topic_model.deleted:
                continue
            pubished_canonical_story_ids = [
                reference['story_id']
                for reference in topic_model.canonical_story_references
                if reference['story_is_published']]
            if item.canonical_story_count != len(pubished_canonical_story_ids):
                cls.errors['canonical story count check'].append((
                    'Entity id %s: Canonical story count: %s does not '
                    'match the number of story ids in canonical_story_ids in '
                    'topic model: %s') % (
                        item.id, item.canonical_story_count,
                        pubished_canonical_story_ids))

    @classmethod
    def _validate_additional_story_count(cls, item):
        """Validate that additional story count of model is equal to
        number of story ids in TopicModel.additional_story_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            # The case for missing topic external model is ignored here
            # since errors for missing topic external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if topic_model is None or topic_model.deleted:
                continue
            published_additional_story_ids = [
                reference['story_id']
                for reference in topic_model.additional_story_references
                if reference['story_is_published']]
            if (
                    item.additional_story_count !=
                    len(published_additional_story_ids)):
                cls.errors['additional story count check'].append((
                    'Entity id %s: Additional story count: %s does not '
                    'match the number of story ids in additional_story_ids in '
                    'topic model: %s') % (
                        item.id, item.additional_story_count,
                        published_additional_story_ids))

    @classmethod
    def _validate_uncategorized_skill_count(cls, item):
        """Validate that uncategorized skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            # The case for missing topic external model is ignored here
            # since errors for missing topic external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if topic_model is None or topic_model.deleted:
                continue
            if item.uncategorized_skill_count != len(
                    topic_model.uncategorized_skill_ids):
                cls.errors['uncategorized skill count check'].append((
                    'Entity id %s: Uncategorized skill count: %s does not '
                    'match the number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s') % (
                        item.id, item.uncategorized_skill_count,
                        topic_model.uncategorized_skill_ids))

    @classmethod
    def _validate_total_skill_count(cls, item):
        """Validate that total skill count of model is equal to
        number of skill ids in TopicModel.uncategorized_skill_ids and skill
        ids in subtopics of TopicModel.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            # The case for missing topic external model is ignored here
            # since errors for missing topic external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if topic_model is None or topic_model.deleted:
                continue
            subtopic_skill_ids = []
            for subtopic in topic_model.subtopics:
                subtopic_skill_ids = subtopic_skill_ids + subtopic['skill_ids']
            if item.total_skill_count != len(
                    topic_model.uncategorized_skill_ids + subtopic_skill_ids):
                cls.errors['total skill count check'].append((
                    'Entity id %s: Total skill count: %s does not '
                    'match the total number of skill ids in '
                    'uncategorized_skill_ids in topic model: %s and skill_ids '
                    'in subtopics of topic model: %s') % (
                        item.id, item.total_skill_count,
                        topic_model.uncategorized_skill_ids,
                        subtopic_skill_ids))

    @classmethod
    def _validate_subtopic_count(cls, item):
        """Validate that subtopic count of model is equal to
        number of subtopics in TopicModel.

        Args:
            item: ndb.Model. TopicSummaryModel to validate.
        """
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        for (_, _, topic_model) in topic_model_class_model_id_model_tuples:
            # The case for missing topic external model is ignored here
            # since errors for missing topic external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if topic_model is None or topic_model.deleted:
                continue
            if item.subtopic_count != len(topic_model.subtopics):
                cls.errors['subtopic count check'].append((
                    'Entity id %s: Subtopic count: %s does not '
                    'match the total number of subtopics in topic '
                    'model: %s ') % (
                        item.id, item.subtopic_count, topic_model.subtopics))

    @classmethod
    def _get_external_model_properties(cls):
        topic_model_class_model_id_model_tuples = cls.external_instance_details[
            'topic_ids']

        topic_model_properties_dict = {
            'name': 'name',
            'canonical_name': 'canonical_name',
            'language_code': 'language_code',
            'topic_model_created_on': 'created_on',
            'topic_model_last_updated': 'last_updated'
        }

        return [(
            'topic',
            topic_model_class_model_id_model_tuples,
            topic_model_properties_dict
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_canonical_story_count,
            cls._validate_additional_story_count,
            cls._validate_uncategorized_skill_count,
            cls._validate_total_skill_count,
            cls._validate_subtopic_count]


class SubtopicPageModelValidator(BaseModelValidator):
    """Class for validating SubtopicPageModel."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s-\\d*$' % (item.topic_id)

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return subtopic_page_services.get_subtopic_page_from_model(item)

    @classmethod
    def _get_external_id_relationships(cls, item):
        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        return {
            'subtopic_page_commit_log_entry_ids': (
                topic_models.SubtopicPageCommitLogEntryModel,
                ['subtopicpage-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            'snapshot_metadata_ids': (
                topic_models.SubtopicPageSnapshotMetadataModel,
                snapshot_model_ids),
            'snapshot_content_ids': (
                topic_models.SubtopicPageSnapshotContentModel,
                snapshot_model_ids),
            'topic_ids': (
                topic_models.TopicModel, [item.topic_id])
        }

    @classmethod
    def _get_custom_validation_functions(cls):
        return []


class SubtopicPageSnapshotMetadataModelValidator(
        BaseSnapshotMetadataModelValidator):
    """Class for validating SubtopicPageSnapshotMetadataModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_change_domain_class(cls, unused_item):
        return subtopic_page_domain.SubtopicPageChange

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.id[:item.id.rfind('-')]]),
            'committer_ids': (
                user_models.UserSettingsModel, [item.committer_id])
        }


class SubtopicPageSnapshotContentModelValidator(
        BaseSnapshotContentModelValidator):
    """Class for validating SubtopicPageSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.id[:item.id.rfind('-')]]),
        }


class SubtopicPageCommitLogEntryModelValidator(
        BaseCommitLogEntryModelValidator):
    """Class for validating SubtopicPageCommitLogEntryModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, item):
        # Valid id: [subtopicpage]-[subtopic_id]-[subtopic_version].
        regex_string = '^(subtopicpage)-%s-\\d*$' % (
            item.subtopic_page_id)

        return regex_string

    @classmethod
    def _get_change_domain_class(cls, item):
        if item.id.startswith('subtopicpage'):
            return subtopic_page_domain.SubtopicPageChange
        else:
            # The case of invalid id is being ignored here since this
            # case will already be checked by the id regex test.
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subtopic_page_ids': (
                topic_models.SubtopicPageModel, [item.subtopic_page_id]),
        }


class UserSettingsModelValidator(BaseUserModelValidator):
    """Class for validating UserSettingsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_settings(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_contributions_ids': (
                user_models.UserContributionsModel, [item.id])
        }

    @classmethod
    def _validate_time_fields_of_user_actions(cls, item):
        """Validates that value for time fields for user actions is
        less than the current time when the job is run.

        Args:
            item: ndb.Model. UserSettingsModel to validate.
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
                cls.errors['%s check' % time_field_name].append(
                    'Entity id %s: Value for %s: %s is greater than the '
                    'time when job was run' % (
                        item.id, time_field_name, time_field_value))

        current_msec = utils.get_current_time_in_millisecs()
        if item.first_contribution_msec is not None and (
                item.first_contribution_msec > current_msec):
            cls.errors['first contribution check'].append(
                'Entity id %s: Value for first contribution msec: %s is '
                'greater than the time when job was run' % (
                    item.id, item.first_contribution_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_time_fields_of_user_actions]


class CompletedActivitiesModelValidator(BaseUserModelValidator):
    """Class for validating CompletedActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id]),
            'exploration_ids': (
                exp_models.ExplorationModel, item.exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, item.collection_ids)
        }

    @classmethod
    def _get_exp_ids(cls, item):
        return item.exploration_ids

    @classmethod
    def _get_col_ids(cls, item):
        return item.collection_ids

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
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_common_properties_do_not_match,
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public]


class IncompleteActivitiesModelValidator(BaseUserModelValidator):
    """Class for validating IncompleteActivitiesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id]),
            'exploration_ids': (
                exp_models.ExplorationModel, item.exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, item.collection_ids)
        }

    @classmethod
    def _get_exp_ids(cls, item):
        return item.exploration_ids

    @classmethod
    def _get_col_ids(cls, item):
        return item.collection_ids

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
        )]

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_common_properties_do_not_match,
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public]


class ExpUserLastPlaythroughModelValidator(BaseUserModelValidator):
    """Class for validating ExpUserLastPlaythroughModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id]),
            'exploration_ids': (
                exp_models.ExplorationModel, [item.exploration_id])
        }

    @classmethod
    def _get_exp_ids(cls, item):
        return [item.exploration_id]

    @classmethod
    def _validate_exp_id_is_marked_as_incomplete(cls, item):
        """Validates that exploration id for model is marked as
        incomplete.

        Args:
            item: ndb.Model. ExpUserLastPlaythroughModel to validate.
        """
        if item.exploration_id not in (
                learner_progress_services.get_all_incomplete_exp_ids(
                    item.user_id)):
            cls.errors['incomplete exp id check'].append(
                'Entity id %s: Exploration id %s for entity is not marked '
                'as incomplete' % (item.id, item.exploration_id))

    @classmethod
    def _validate_exp_version(cls, item):
        """Validates that last played exp version is less than or equal to
        for version of the exploration.

        Args:
            item: ndb.Model. ExpUserLastPlaythroughModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            if item.last_played_exp_version > exploration_model.version:
                cls.errors['version check'].append(
                    'Entity id %s: last played exp version %s is greater than '
                    'current version %s of exploration with id %s' % (
                        item.id, item.last_played_exp_version,
                        exploration_model.version, exploration_model.id))

    @classmethod
    def _validate_state_name(cls, item):
        """Validates that state name is a valid state in the exploration
        corresponding to the entity                         .

        Args:
            item: ndb.Model. ExpUserLastPlaythroughModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            if item.last_played_state_name not in (
                    exploration_model.states.keys()):
                cls.errors['state name check'].append(
                    'Entity id %s: last played state name %s is not present '
                    'in exploration states %s for exploration id %s' % (
                        item.id, item.last_played_state_name,
                        list(exploration_model.states.keys()),
                        exploration_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_explorations_are_public,
            cls._validate_exp_id_is_marked_as_incomplete,
            cls._validate_exp_version,
            cls._validate_state_name
        ]


class LearnerPlaylistModelValidator(BaseUserModelValidator):
    """Class for validating LearnerPlaylistModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id]),
            'exploration_ids': (
                exp_models.ExplorationModel, item.exploration_ids),
            'collection_ids': (
                collection_models.CollectionModel, item.collection_ids)
        }

    @classmethod
    def _get_exp_ids(cls, item):
        return item.exploration_ids

    @classmethod
    def _get_col_ids(cls, item):
        return item.collection_ids

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
        return [
            cls._validate_common_properties_do_not_match,
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public]


class UserContributionsModelValidator(BaseUserModelValidator):
    """Class for validating UserContributionsModels."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_services.get_user_contributions(item.id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id]),
            'created_exploration_ids': (
                exp_models.ExplorationModel, item.created_exploration_ids),
            'edited_exploration_ids': (
                exp_models.ExplorationModel, item.edited_exploration_ids)
        }


class UserEmailPreferencesModelValidator(BaseUserModelValidator):
    """Class for validating UserEmailPreferencesModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id])
        }


class UserSubscriptionsModelValidator(BaseUserModelValidator):
    """Class for validating UserSubscriptionsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'activity_ids': (exp_models.ExplorationModel, item.activity_ids),
            'collection_ids': (
                collection_models.CollectionModel,
                item.collection_ids),
            'general_feedback_thread_ids': (
                feedback_models.GeneralFeedbackThreadModel,
                item.general_feedback_thread_ids),
            'creator_ids': (user_models.UserSettingsModel, item.creator_ids),
            'subscriber_ids': (
                user_models.UserSubscribersModel, item.creator_ids),
            'id': (user_models.UserSettingsModel, [item.id]),
        }

    @classmethod
    def _validate_last_checked(cls, item):
        """Validates that last checked time field is less than the time
        when job was run.

        Args:
            item: ndb.Model. UserSubscriptionsModel to validate.
        """
        current_time = datetime.datetime.utcnow()
        if item.last_checked is not None and item.last_checked > current_time:
            cls.errors['last checked check'].append(
                'Entity id %s: last checked %s is greater than '
                'the time when job was run' % (
                    item.id, item.last_checked))

    @classmethod
    def _validate_user_id_in_subscriber_ids(cls, item):
        """Validates that user id is present in list of
        subscriber ids of the creators the user has subscribed to.

        Args:
            item: ndb.Model. UserSubscriptionsModel to validate.
        """
        subscriber_model_class_model_id_model_tuples = (
            cls.external_instance_details['subscriber_ids'])
        for (_, _, subscriber_model) in (
                subscriber_model_class_model_id_model_tuples):
            # The case for missing subscriber external model is ignored here
            # since errors for missing subscriber external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if subscriber_model is not None and not (
                    subscriber_model.deleted) and (
                        item.id not in subscriber_model.subscriber_ids):
                cls.errors['subscriber id check'].append(
                    'Entity id %s: User id is not present in subscriber ids of '
                    'creator with id %s to whom the user has subscribed' % (
                        item.id, subscriber_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_last_checked,
            cls._validate_user_id_in_subscriber_ids]


class UserSubscribersModelValidator(BaseUserModelValidator):
    """Class for validating UserSubscribersModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'subscriber_ids': (
                user_models.UserSettingsModel, item.subscriber_ids),
            'user_settings_ids': (user_models.UserSettingsModel, [item.id]),
            'subscription_ids': (
                user_models.UserSubscriptionsModel, item.subscriber_ids)
        }

    @classmethod
    def _validate_user_id_not_in_subscriber_ids(cls, item):
        """Validates that user id is not present in list of
        subscribers of user.

        Args:
            item: ndb.Model. UserSubscribersModel to validate.
        """
        if item.id in item.subscriber_ids:
            cls.errors['subscriber id check'].append(
                'Entity id %s: User id is present in subscriber ids '
                'for user' % item.id)

    @classmethod
    def _validate_user_id_in_creator_ids(cls, item):
        """Validates that user id is present in list of
        creator ids to which the subscribers of user have
        subscribed.

        Args:
            item: ndb.Model. UserSubscribersModel to validate.
        """
        subscription_model_class_model_id_model_tuples = (
            cls.external_instance_details['subscription_ids'])
        for (_, _, subscription_model) in (
                subscription_model_class_model_id_model_tuples):
            # The case for missing subscription external model is ignored here
            # since errors for missing subscription external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if subscription_model is not None and not (
                    subscription_model.deleted) and (
                        item.id not in subscription_model.creator_ids):
                cls.errors['subscription creator id check'].append(
                    'Entity id %s: User id is not present in creator ids to '
                    'which the subscriber of user with id %s has subscribed' % (
                        item.id, subscription_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_user_id_not_in_subscriber_ids,
            cls._validate_user_id_in_creator_ids]


class UserRecentChangesBatchModelValidator(BaseUserModelValidator):
    """Class for validating UserRecentChangesBatchModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id])
        }

    @classmethod
    def _validate_job_queued_msec(cls, item):
        """Validates that job queued msec is less than the time
        when job was run.

        Args:
            item: ndb.Model. UserRecentChangesBatchModel to validate.
        """
        current_msec = utils.get_current_time_in_millisecs()
        if item.job_queued_msec > current_msec:
            cls.errors['job queued msec check'].append(
                'Entity id %s: job queued msec %s is greater than '
                'the time when job was run' % (
                    item.id, item.job_queued_msec))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_job_queued_msec]


class UserStatsModelValidator(BaseUserModelValidator):
    """Class for validating UserStatsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id])
        }

    @classmethod
    def _validate_schema_version(cls, item):
        """Validates that schema version is less than current version.

        Args:
            item: ndb.Model. UserStatsModel to validate.
        """
        if item.schema_version > feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION:
            cls.errors['schema version check'].append(
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
            item: ndb.Model. UserStatsModel to validate.
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
                    cls.errors['weekly creator stats list'].append(
                        'Entity id %s: Invalid stats dict: %s' % (
                            item.id, stat))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_schema_version,
            cls._validate_weekly_creator_stats_list]


class ExplorationUserDataModelValidator(BaseUserModelValidator):
    """Class for validating ExplorationUserDataModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.exploration_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id]),
            'exploration_ids': (
                exp_models.ExplorationModel, [item.exploration_id])
        }

    @classmethod
    def _validate_draft_change_list(cls, item):
        """Validates that commands in draft change list follow
        the schema of ExplorationChange domain object.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        for change_dict in item.draft_change_list:
            try:
                exp_domain.ExplorationChange(change_dict)
            except Exception as e:
                cls.errors['draft change list check'].append(
                    'Entity id %s: Invalid change dict %s due to error %s' % (
                        item.id, change_dict, e))

    @classmethod
    def _validate_rating(cls, item):
        """Validates that rating is in the interval [1, 5].

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.rating is not None and (item.rating < 1 or item.rating > 5):
            cls.errors['rating check'].append(
                'Entity id %s: Expected rating to be in range [1, 5], '
                'received %s' % (item.id, item.rating))

    @classmethod
    def _validate_rated_on(cls, item):
        """Validates that rated on is less than the time when job
        was run.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.rating is not None and not item.rated_on:
            cls.errors['rated on check'].append(
                'Entity id %s: rating %s exists but rated on is None' % (
                    item.id, item.rating))
        current_time = datetime.datetime.utcnow()
        if item.rated_on is not None and item.rated_on > current_time:
            cls.errors['rated on check'].append(
                'Entity id %s: rated on %s is greater than the time '
                'when job was run' % (item.id, item.rated_on))

    @classmethod
    def _validate_draft_change_list_last_updated(cls, item):
        """Validates that draft change list last updated is less than
        the time when job was run.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        if item.draft_change_list and not item.draft_change_list_last_updated:
            cls.errors['draft change list last updated check'].append(
                'Entity id %s: draft change list %s exists but '
                'draft change list last updated is None' % (
                    item.id, item.draft_change_list))
        current_time = datetime.datetime.utcnow()
        if item.draft_change_list_last_updated is not None and (
                item.draft_change_list_last_updated > current_time):
            cls.errors['draft change list last updated check'].append(
                'Entity id %s: draft change list last updated %s is '
                'greater than the time when job was run' % (
                    item.id, item.draft_change_list_last_updated))

    @classmethod
    def _validate_exp_version(cls, item):
        """Validates that draft change exp version is less than version
        of the exploration corresponding to the model.

        Args:
            item: ndb.Model. ExplorationUserDataModel to validate.
        """
        exploration_model_class_model_id_model_tuples = (
            cls.external_instance_details['exploration_ids'])
        for (_, _, exploration_model) in (
                exploration_model_class_model_id_model_tuples):
            # The case for missing exploration external model is ignored here
            # since errors for missing exploration external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if exploration_model is None or exploration_model.deleted:
                continue
            if item.draft_change_list_exp_version > exploration_model.version:
                cls.errors['exp version check'].append(
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
            cls._validate_draft_change_list_last_updated,
            cls._validate_exp_version]


class CollectionProgressModelValidator(BaseUserModelValidator):
    """Class for validating CollectionProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.collection_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id]),
            'collection_ids': (
                collection_models.CollectionModel, [item.collection_id]),
            'exploration_ids': (
                exp_models.ExplorationModel, item.completed_explorations),
            'completed_activities_ids': (
                user_models.CompletedActivitiesModel, [item.user_id])
        }

    @classmethod
    def _get_exp_ids(cls, item):
        return item.completed_explorations

    @classmethod
    def _get_col_ids(cls, item):
        return [item.collection_id]

    @classmethod
    def _validate_completed_exploration(cls, item):
        """Validates that completed exploration ids belong to
        the collection and are present in CompletedActivitiesModel
        for the user.

        Args:
            item: ndb.Model. CollectionProgressModel to validate.
        """
        completed_exp_ids = item.completed_explorations
        completed_activities_model_class_model_id_model_tuples = (
            cls.external_instance_details['completed_activities_ids'])
        for (_, _, completed_activities_model) in (
                completed_activities_model_class_model_id_model_tuples):
            # The case for missing completed activities external model is
            # ignored here since errors for missing completed activities
            # external model are already checked and stored in
            # _validate_external_id_relationships function.
            if completed_activities_model is not None and not (
                    completed_activities_model.deleted):
                missing_exp_ids = [
                    exp_id
                    for exp_id in completed_exp_ids if exp_id not in (
                        completed_activities_model.exploration_ids)]
                if missing_exp_ids:
                    cls.errors['completed exploration check'].append(
                        'Entity id %s: Following completed exploration ids %s '
                        'are not present in CompletedActivitiesModel for the '
                        'user' % (item.id, missing_exp_ids))

        collection_model_class_model_id_model_tuples = (
            cls.external_instance_details['collection_ids'])
        for (_, _, collection_model) in (
                collection_model_class_model_id_model_tuples):
            # The case for missing collection external model is ignored here
            # since errors for missing collection external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if collection_model is None or collection_model.deleted:
                continue
            collection_node_ids = [
                node['exploration_id'] for node in (
                    collection_model.collection_contents['nodes'])]
            invalid_exp_ids = [
                exp_id
                for exp_id in completed_exp_ids if exp_id not in (
                    collection_node_ids)]
            if invalid_exp_ids:
                cls.errors['completed exploration check'].append(
                    'Entity id %s: Following completed exploration ids %s do '
                    'not belong to the collection with id %s corresponding '
                    'to the entity' % (
                        item.id, invalid_exp_ids, collection_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_completed_exploration,
            cls._validate_explorations_are_public,
            cls._validate_collections_are_public]


class StoryProgressModelValidator(BaseUserModelValidator):
    """Class for validating StoryProgressModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.story_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id]),
            'story_ids': (
                story_models.StoryModel, [item.story_id])
        }

    @classmethod
    def _validate_story_is_public(cls, item):
        """Validates that story is public.

        Args:
            item: ndb.Model. StoryProgressModel to validate.
        """
        story_model_class_model_id_model_tuples = (
            cls.external_instance_details['story_ids'])
        for (_, _, story_model) in (
                story_model_class_model_id_model_tuples):
            # The case for missing story external model is ignored here
            # since errors for missing story external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if story_model is None or story_model.deleted:
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
                    cls.errors['public story check'].append(
                        'Entity id %s: Story with id %s corresponding to '
                        'entity is private' % (item.id, story_model.id))

    @classmethod
    def _validate_completed_nodes(cls, item):
        """Validates that completed nodes belong to the story

        Args:
            item: ndb.Model. StoryProgressModel to validate.
        """
        completed_activity_model = user_models.CompletedActivitiesModel.get(
            item.user_id)
        story_model_class_model_id_model_tuples = (
            cls.external_instance_details['story_ids'])
        for (_, _, story_model) in (
                story_model_class_model_id_model_tuples):
            # The case for missing story external model is ignored here
            # since errors for missing story external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if story_model is None or story_model.deleted:
                continue
            story_node_ids = [
                node['id'] for node in story_model.story_contents['nodes']]
            invalid_node_ids = [
                node_id
                for node_id in item.completed_node_ids if node_id not in (
                    story_node_ids)]
            if invalid_node_ids:
                cls.errors['completed node check'].append(
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
                cls.errors['explorations in completed node check'].append(
                    'Entity id %s: %s' % (item.id, error_msg))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_story_is_public,
            cls._validate_completed_nodes]


class UserQueryModelValidator(BaseUserModelValidator):
    """Class for validating UserQueryModels."""

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9-_]{1,%s}$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, (
                    item.user_ids + [item.submitter_id])),
            'sent_email_model_ids': (
                email_models.BulkEmailModel, [item.sent_email_model_id])
        }

    @classmethod
    def _validate_sender_and_recipient_ids(cls, item):
        """Validates that sender id of BulkEmailModel matches the
        submitter id of query and all recipient ids are present in
        user ids who satisfy the query. It is not necessary that
        all user ids are present in recipient ids since email
        is only sent to a limited maximum of qualified users.
        It also checks that a UserBulkEmailsModel exists for each
        of the recipients.

        Args:
            item: ndb.Model. UserQueryModel to validate.
        """
        email_model_class_model_id_model_tuples = (
            cls.external_instance_details['sent_email_model_ids'])
        for (_, _, email_model) in (
                email_model_class_model_id_model_tuples):
            # The case for missing email external model is ignored here
            # since errors for missing email external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if email_model is not None and not email_model.deleted:
                extra_recipient_ids = [
                    user_id
                    for user_id in email_model.recipient_ids if user_id not in (
                        item.user_ids)]
                if extra_recipient_ids:
                    cls.errors['recipient check'].append(
                        'Entity id %s: Email model %s for query has following '
                        'extra recipients %s which are not qualified as per '
                        'the query'
                        % (item.id, email_model.id, extra_recipient_ids))
                if email_model.sender_id != item.submitter_id:
                    cls.errors['sender check'].append(
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
                        cls.errors['user bulk email check'].append(
                            'Entity id %s: UserBulkEmails model is missing for '
                            'recipient with id %s' % (
                                item.id, recipient_user_ids[index]))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_sender_and_recipient_ids]


class UserBulkEmailsModelValidator(BaseUserModelValidator):
    """Class for validating UserBulkEmailsModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id]),
            'sent_email_model_ids': (
                email_models.BulkEmailModel, item.sent_email_model_ids)
        }

    @classmethod
    def _validate_user_id_in_recipient_id_for_emails(cls, item):
        """Validates that user id is present in recipient ids
        for bulk email model.

        Args:
            item: ndb.Model. UserBulkEmailsModel to validate.
        """
        email_model_class_model_id_model_tuples = (
            cls.external_instance_details['sent_email_model_ids'])
        for (_, _, email_model) in (
                email_model_class_model_id_model_tuples):
            # The case for missing email external model is ignored here
            # since errors for missing email external model are already
            # checked and stored in _validate_external_id_relationships
            # function.
            if email_model is not None and not email_model.deleted and (
                    item.id not in email_model.recipient_ids):
                cls.errors['recipient check'].append(
                    'Entity id %s: user id is not present in recipient ids '
                    'of BulkEmailModel with id %s' % (item.id, email_model.id))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [cls._validate_user_id_in_recipient_id_for_emails]


class UserSkillMasteryModelValidator(BaseUserModelValidator):
    """Class for validating UserSkillMasteryModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.user_id, item.skill_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id]),
            'skill_ids': (
                skill_models.SkillModel, [item.skill_id])
        }

    @classmethod
    def _validate_skill_mastery(cls, item):
        """Validates that skill mastery is in range [0.0, 1.0].

        Args:
            item: ndb.Model. UserSkillMasteryModel to validate.
        """
        if item.degree_of_mastery < 0 or item.degree_of_mastery > 1:
            cls.errors['skill mastery check'].append(
                'Entity id %s: Expected degree of mastery to be in '
                'range [0.0, 1.0], received %s' % (
                    item.id, item.degree_of_mastery))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_skill_mastery]


class UserContributionScoringModelValidator(BaseUserModelValidator):
    """Class for validating UserContributionScoringModels."""

    @classmethod
    def _get_model_id_regex(cls, item):
        return '^%s\\.%s$' % (item.score_category, item.user_id)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.user_id])
        }

    @classmethod
    def _validate_score_category(cls, item):
        """Validates that score category belongs to allowed score categories.

        Args:
            item: ndb.Model. UserContributionScoringModel to validate.
        """
        score_category_regex = '^(%s)$' % ('|').join(ALLOWED_SCORE_CATEGORIES)
        if not re.compile(score_category_regex).match(item.score_category):
            cls.errors['score category check'].append(
                'Entity id %s: Score category %s is invalid' % (
                    item.id, item.score_category))

    @classmethod
    def _validate_score(cls, item):
        """Validates that score is non-negative.

        Args:
            item: ndb.Model. UserContributionScoringModel to validate.
        """
        if item.score < 0:
            cls.errors['score check'].append(
                'Entity id %s: Expected score to be non-negative, '
                'received %s' % (item.id, item.score))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_score_category,
            cls._validate_score]


class UserCommunityRightsModelValidator(BaseUserModelValidator):
    """Class for validating UserCommunityRightsModel."""

    @classmethod
    def _get_model_domain_object_instance(cls, item):
        return user_domain.UserCommunityRights(
            item.id, item.can_review_translation_for_language_codes,
            item.can_review_voiceover_for_language_codes,
            item.can_review_questions)

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'user_settings_ids': (
                user_models.UserSettingsModel, [item.id])
        }


class PendingDeletionRequestModelValidator(BaseUserModelValidator):
    """Class for validating PendingDeletionRequestModels."""

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {}

    @classmethod
    def _validate_user_settings_are_marked_deleted(cls, item):
        """Validates that explorations for model are marked as deleted.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        user_model = user_models.UserSettingsModel.get_by_id(item.id)
        if user_model is None or not user_model.deleted:
            cls.errors['deleted user settings'].append(
                'Entity id %s: User settings model is not marked as deleted'
                % (item.id))

    @classmethod
    def _validate_explorations_are_marked_deleted(cls, item):
        """Validates that explorations for model are marked as deleted.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        exp_ids = cls._get_exp_ids(item)
        not_marked_exp_ids = []
        for exp_id in exp_ids:
            exp_model = exp_models.ExplorationModel.get_by_id(exp_id)
            if exp_model is None or not exp_model.deleted:
                not_marked_exp_ids.append(exp_id)

        if not_marked_exp_ids:
            cls.errors['deleted exploration check'].append(
                'Entity id %s: Explorations with ids %s are not marked as '
                'deleted' % (item.id, not_marked_exp_ids))

    @classmethod
    def _validate_collections_are_marked_deleted(cls, item):
        """Validates that collections for model are marked as deleted.

        Args:
            item: ndb.Model. BaseUserModel to validate.
        """
        col_ids = cls._get_col_ids(item)
        not_marked_col_ids = []
        for col_id in col_ids:
            col_model = collection_models.CollectionModel.get_by_id(col_id)
            if col_model is None or not col_model.deleted:
                not_marked_col_ids.append(col_id)

        if not_marked_col_ids:
            cls.errors['deleted collection check'].append(
                'Entity id %s: Collections with ids %s are not marked as '
                'deleted' % (item.id, not_marked_col_ids))

    @classmethod
    def _get_exp_ids(cls, item):
        return item.exploration_ids

    @classmethod
    def _get_col_ids(cls, item):
        return item.collection_ids

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_user_settings_are_marked_deleted,
            cls._validate_explorations_are_marked_deleted,
            cls._validate_collections_are_marked_deleted]


class TaskEntryModelValidator(BaseModelValidator):
    """One off job for auditing task entries."""

    # The name of the model which is to be used in the error messages.
    MODEL_NAME = 'task entry'

    @classmethod
    def _get_model_id_regex(cls, item):
        return re.escape(improvements_models.TaskEntryModel.generate_task_id(
            item.entity_type, item.entity_id, item.entity_version,
            item.task_type, item.target_type, item.target_id))

    @classmethod
    def _get_external_id_relationships(cls, item):
        return {
            'resolver_ids': (
                user_models.UserSettingsModel,
                [item.resolver_id] if item.resolver_id is not None else []),
            'entity_ids': (exp_models.ExplorationModel, [item.entity_id])
        }

    @classmethod
    def _validate_composite_entity_id(cls, item):
        """Validates the composite_entity_id field of the given item.

        Args:
            item: improvements_models.TaskEntryModel.
        """
        expected_composite_entity_id = (
            improvements_models.TaskEntryModel.generate_composite_entity_id(
                item.entity_type, item.entity_id, item.entity_version))
        if item.composite_entity_id != expected_composite_entity_id:
            cls.errors['composite_entity_id field check'].append(
                'Entity id %s: composite_entity_id "%s" should be "%s"' % (
                    item.id,
                    item.composite_entity_id,
                    expected_composite_entity_id))

    @classmethod
    def _validate_status(cls, item):
        """Validates the fields of the item relating to the status field.

        Args:
            item: improvements_models.TaskEntryModel.
        """
        if item.status == improvements_models.TASK_STATUS_OPEN:
            if item.resolver_id:
                cls.errors['status field check'].append(
                    'Entity id %s: status is open but resolver_id is "%s", '
                    'should be empty.' % (item.id, item.resolver_id))
            if item.resolved_on:
                cls.errors['status field check'].append(
                    'Entity id %s: status is open but resolved_on is "%s", '
                    'should be empty.' % (item.id, item.resolved_on))
        elif item.status == improvements_models.TASK_STATUS_RESOLVED:
            if item.resolver_id is None:
                cls.errors['status field check'].append(
                    'Entity id %s: status is resolved but resolver_id is not '
                    'set' % (item.id,))
            if item.resolved_on is None:
                cls.errors['status field check'].append(
                    'Entity id %s: status is resolved but resolved_on is not '
                    'set' % (item.id,))

    @classmethod
    def _validate_target_id(cls, item):
        """Validate that the given item contains an existing exploration state
        name.

        Args:
            item: improvements_models.TaskEntryModel.
        """
        try:
            exp_model = exp_models.ExplorationModel.get(
                item.entity_id, strict=True, version=item.entity_version)
        except Exception:
            cls.errors['target_id field check'].append(
                'Entity id %s: exploration with id "%s" does not exist at '
                'version %d' % (item.id, item.entity_id, item.entity_version))
            return
        if item.target_id not in exp_model.states.keys():
            cls.errors['target_id field check'].append(
                'Entity id %s: exploration with id "%s" does not have a state '
                'named "%s" at version %d' % (
                    item.id, item.entity_id, item.target_id,
                    item.entity_version))

    @classmethod
    def _get_custom_validation_functions(cls):
        return [
            cls._validate_composite_entity_id,
            cls._validate_status,
            cls._validate_target_id,
        ]


MODEL_TO_VALIDATOR_MAPPING = {
    activity_models.ActivityReferencesModel: ActivityReferencesModelValidator,
    audit_models.RoleQueryAuditModel: RoleQueryAuditModelValidator,
    audit_models.UsernameChangeAuditModel: UsernameChangeAuditModelValidator,
    classifier_models.ClassifierTrainingJobModel: (
        ClassifierTrainingJobModelValidator),
    classifier_models.TrainingJobExplorationMappingModel: (
        TrainingJobExplorationMappingModelValidator),
    collection_models.CollectionModel: CollectionModelValidator,
    collection_models.CollectionSnapshotMetadataModel: (
        CollectionSnapshotMetadataModelValidator),
    collection_models.CollectionSnapshotContentModel: (
        CollectionSnapshotContentModelValidator),
    collection_models.CollectionRightsModel: CollectionRightsModelValidator,
    collection_models.CollectionRightsSnapshotMetadataModel: (
        CollectionRightsSnapshotMetadataModelValidator),
    collection_models.CollectionRightsSnapshotContentModel: (
        CollectionRightsSnapshotContentModelValidator),
    collection_models.CollectionCommitLogEntryModel: (
        CollectionCommitLogEntryModelValidator),
    collection_models.CollectionRightsAllUsersModel: (
        CollectionRightsAllUsersModelValidator),
    collection_models.CollectionSummaryModel: CollectionSummaryModelValidator,
    config_models.ConfigPropertyModel: ConfigPropertyModelValidator,
    config_models.ConfigPropertySnapshotMetadataModel: (
        ConfigPropertySnapshotMetadataModelValidator),
    config_models.ConfigPropertySnapshotContentModel: (
        ConfigPropertySnapshotContentModelValidator),
    email_models.SentEmailModel: SentEmailModelValidator,
    email_models.BulkEmailModel: BulkEmailModelValidator,
    email_models.GeneralFeedbackEmailReplyToIdModel: (
        GeneralFeedbackEmailReplyToIdModelValidator),
    exp_models.ExplorationContextModel: (
        ExplorationContextModelValidator),
    exp_models.ExplorationModel: ExplorationModelValidator,
    exp_models.ExplorationSnapshotMetadataModel: (
        ExplorationSnapshotMetadataModelValidator),
    exp_models.ExplorationSnapshotContentModel: (
        ExplorationSnapshotContentModelValidator),
    exp_models.ExplorationRightsModel: ExplorationRightsModelValidator,
    exp_models.ExplorationRightsSnapshotMetadataModel: (
        ExplorationRightsSnapshotMetadataModelValidator),
    exp_models.ExplorationRightsSnapshotContentModel: (
        ExplorationRightsSnapshotContentModelValidator),
    exp_models.ExplorationRightsAllUsersModel: (
        ExplorationRightsAllUsersModelValidator),
    exp_models.ExplorationCommitLogEntryModel: (
        ExplorationCommitLogEntryModelValidator),
    exp_models.ExpSummaryModel: ExpSummaryModelValidator,
    feedback_models.GeneralFeedbackThreadModel: (
        GeneralFeedbackThreadModelValidator),
    feedback_models.GeneralFeedbackMessageModel: (
        GeneralFeedbackMessageModelValidator),
    feedback_models.GeneralFeedbackThreadUserModel: (
        GeneralFeedbackThreadUserModelValidator),
    feedback_models.FeedbackAnalyticsModel: FeedbackAnalyticsModelValidator,
    feedback_models.UnsentFeedbackEmailModel: UnsentFeedbackEmailModelValidator,
    improvements_models.TaskEntryModel: TaskEntryModelValidator,
    job_models.JobModel: JobModelValidator,
    job_models.ContinuousComputationModel: ContinuousComputationModelValidator,
    opportunity_models.ExplorationOpportunitySummaryModel: (
        ExplorationOpportunitySummaryModelValidator),
    opportunity_models.SkillOpportunityModel: (SkillOpportunityModelValidator),
    question_models.QuestionModel: QuestionModelValidator,
    question_models.QuestionSkillLinkModel: (
        QuestionSkillLinkModelValidator),
    question_models.QuestionSnapshotMetadataModel: (
        QuestionSnapshotMetadataModelValidator),
    question_models.QuestionSnapshotContentModel: (
        QuestionSnapshotContentModelValidator),
    question_models.QuestionCommitLogEntryModel: (
        QuestionCommitLogEntryModelValidator),
    question_models.QuestionSummaryModel: QuestionSummaryModelValidator,
    recommendations_models.ExplorationRecommendationsModel: (
        ExplorationRecommendationsModelValidator),
    recommendations_models.TopicSimilaritiesModel: (
        TopicSimilaritiesModelValidator),
    skill_models.SkillModel: SkillModelValidator,
    skill_models.SkillSnapshotMetadataModel: (
        SkillSnapshotMetadataModelValidator),
    skill_models.SkillSnapshotContentModel: (
        SkillSnapshotContentModelValidator),
    skill_models.SkillCommitLogEntryModel: (
        SkillCommitLogEntryModelValidator),
    skill_models.SkillSummaryModel: SkillSummaryModelValidator,
    story_models.StoryModel: StoryModelValidator,
    story_models.StorySnapshotMetadataModel: (
        StorySnapshotMetadataModelValidator),
    story_models.StorySnapshotContentModel: (
        StorySnapshotContentModelValidator),
    story_models.StoryCommitLogEntryModel: (
        StoryCommitLogEntryModelValidator),
    story_models.StorySummaryModel: StorySummaryModelValidator,
    suggestion_models.GeneralSuggestionModel: GeneralSuggestionModelValidator,
    suggestion_models.GeneralVoiceoverApplicationModel: (
        GeneralVoiceoverApplicationModelValidator),
    topic_models.TopicModel: TopicModelValidator,
    topic_models.TopicSnapshotMetadataModel: (
        TopicSnapshotMetadataModelValidator),
    topic_models.TopicSnapshotContentModel: (
        TopicSnapshotContentModelValidator),
    topic_models.TopicRightsModel: TopicRightsModelValidator,
    topic_models.TopicRightsSnapshotMetadataModel: (
        TopicRightsSnapshotMetadataModelValidator),
    topic_models.TopicRightsSnapshotContentModel: (
        TopicRightsSnapshotContentModelValidator),
    topic_models.TopicRightsAllUsersModel: TopicRightsAllUsersModelValidator,
    topic_models.TopicCommitLogEntryModel: (
        TopicCommitLogEntryModelValidator),
    topic_models.TopicSummaryModel: TopicSummaryModelValidator,
    topic_models.SubtopicPageModel: SubtopicPageModelValidator,
    topic_models.SubtopicPageSnapshotMetadataModel: (
        SubtopicPageSnapshotMetadataModelValidator),
    topic_models.SubtopicPageSnapshotContentModel: (
        SubtopicPageSnapshotContentModelValidator),
    topic_models.SubtopicPageCommitLogEntryModel: (
        SubtopicPageCommitLogEntryModelValidator),
    user_models.UserSettingsModel: UserSettingsModelValidator,
    user_models.CompletedActivitiesModel: CompletedActivitiesModelValidator,
    user_models.IncompleteActivitiesModel: IncompleteActivitiesModelValidator,
    user_models.ExpUserLastPlaythroughModel: (
        ExpUserLastPlaythroughModelValidator),
    user_models.LearnerPlaylistModel: LearnerPlaylistModelValidator,
    user_models.UserContributionsModel: UserContributionsModelValidator,
    user_models.UserEmailPreferencesModel: UserEmailPreferencesModelValidator,
    user_models.UserSubscriptionsModel: UserSubscriptionsModelValidator,
    user_models.UserSubscribersModel: UserSubscribersModelValidator,
    user_models.UserRecentChangesBatchModel: (
        UserRecentChangesBatchModelValidator),
    user_models.UserStatsModel: UserStatsModelValidator,
    user_models.ExplorationUserDataModel: ExplorationUserDataModelValidator,
    user_models.CollectionProgressModel: CollectionProgressModelValidator,
    user_models.StoryProgressModel: StoryProgressModelValidator,
    user_models.UserQueryModel: UserQueryModelValidator,
    user_models.UserBulkEmailsModel: UserBulkEmailsModelValidator,
    user_models.UserSkillMasteryModel: UserSkillMasteryModelValidator,
    user_models.UserContributionScoringModel: (
        UserContributionScoringModelValidator),
    user_models.UserCommunityRightsModel: UserCommunityRightsModelValidator,
    user_models.PendingDeletionRequestModel: (
        PendingDeletionRequestModelValidator)
}


class ProdValidationAuditOneOffJobMetaClass(type):
    """Type class for audit one off jobs. Registers classes inheriting from
    ProdValidationAuditOneOffJob in a list. With this strategy, job writers can
    define them in separate modules while allowing us to assert that each model
    has an audit job.
    """

    _MODEL_AUDIT_ONE_OFF_JOB_NAMES = set()

    def __new__(mcs, name, bases, dct):
        mcs._MODEL_AUDIT_ONE_OFF_JOB_NAMES.add(name)
        return super(ProdValidationAuditOneOffJobMetaClass, mcs).__new__(
            mcs, name, bases, dct)

    @classmethod
    def get_model_audit_job_names(mcs):
        """Returns list of job names that have inherited from
        ProdValidationAuditOneOffJob.

        Returns:
            tuple(str). The names of the one off audit jobs of this class type.
        """
        return sorted(mcs._MODEL_AUDIT_ONE_OFF_JOB_NAMES)


class ProdValidationAuditOneOffJob( # pylint: disable=inherit-non-class
        python_utils.with_metaclass(
            ProdValidationAuditOneOffJobMetaClass,
            jobs.BaseMapReduceOneOffJobManager)):
    """Job that audits and validates production models."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        raise NotImplementedError

    @staticmethod
    def map(model_instance):
        """Implements a map function which defers to a pre-defined validator."""
        if not model_instance.deleted:
            model_name = model_instance.__class__.__name__
            validator_cls = MODEL_TO_VALIDATOR_MAPPING[type(model_instance)]
            validator = validator_cls()
            validator.validate(model_instance)
            if len(validator.errors) > 0:
                for error_key, error_val in validator.errors.items():
                    yield (
                        'failed validation check for %s of %s' % (
                            error_key, model_name),
                        (',').join(set(error_val)))
            else:
                yield (
                    'fully-validated %s' % model_name, 1)

    @staticmethod
    def reduce(key, values):
        """Yields number of fully validated models or the failure messages."""
        if 'fully-validated' in key:
            yield (key, len(values))
        else:
            yield (key, values)


class ActivityReferencesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ActivityReferencesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [activity_models.ActivityReferencesModel]


class RoleQueryAuditModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates RoleQueryAuditModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [audit_models.RoleQueryAuditModel]


class UsernameChangeAuditModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UsernameChangeAuditModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [audit_models.UsernameChangeAuditModel]


class ClassifierTrainingJobModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ClassifierTrainingJobModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [classifier_models.ClassifierTrainingJobModel]


class TrainingJobExplorationMappingModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TrainingJobExplorationMappingModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [classifier_models.TrainingJobExplorationMappingModel]


class CollectionModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionModel]


class CollectionSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSnapshotMetadataModel]


class CollectionSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSnapshotContentModel]


class CollectionRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsModel]


class CollectionRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsSnapshotMetadataModel]


class CollectionRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsSnapshotContentModel]


class CollectionRightsAllUsersModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionRightsAllUsersModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionRightsAllUsersModel]


class CollectionCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionCommitLogEntryModel]


class CollectionSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [collection_models.CollectionSummaryModel]


class ExplorationOpportunitySummaryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationOpportunitySummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [opportunity_models.ExplorationOpportunitySummaryModel]


class SkillOpportunityModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillOpportunityModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [opportunity_models.SkillOpportunityModel]


class ConfigPropertyModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertyModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertyModel]


class ConfigPropertySnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertySnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertySnapshotMetadataModel]


class ConfigPropertySnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ConfigPropertySnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.ConfigPropertySnapshotContentModel]


class SentEmailModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SentEmailModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.SentEmailModel]


class BulkEmailModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BulkEmailModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.BulkEmailModel]


class GeneralFeedbackEmailReplyToIdModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralFeedbackEmailReplyToIdModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [email_models.GeneralFeedbackEmailReplyToIdModel]


class ExplorationModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationModel]


class ExplorationSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotMetadataModel]


class ExplorationSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapshotContentModel]


class ExplorationRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsModel]


class ExplorationRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotMetadataModel]


class ExplorationRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsSnapshotContentModel]


class ExplorationRightsAllUsersModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRightsAllUsersModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationRightsAllUsersModel]


class ExplorationCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationCommitLogEntryModel]


class ExpSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExpSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExpSummaryModel]


class GeneralFeedbackThreadModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralFeedbackThreadModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.GeneralFeedbackThreadModel]


class GeneralFeedbackMessageModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralFeedbackMessageModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.GeneralFeedbackMessageModel]


class GeneralFeedbackThreadUserModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralFeedbackThreadUserModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.GeneralFeedbackThreadUserModel]


class FeedbackAnalyticsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates FeedbackAnalyticsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.FeedbackAnalyticsModel]


class UnsentFeedbackEmailModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UnsentFeedbackEmailModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [feedback_models.UnsentFeedbackEmailModel]


class JobModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates JobModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [job_models.JobModel]


class ContinuousComputationModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ContinuousComputationModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [job_models.ContinuousComputationModel]


class QuestionModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]


class QuestionSkillLinkModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSkillLinkModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSkillLinkModel]


class ExplorationContextModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationContextModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationContextModel]


class QuestionSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotMetadataModel]


class QuestionSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotContentModel]


class QuestionCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionCommitLogEntryModel]


class QuestionSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSummaryModel]


class ExplorationRecommendationsModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationRecommendationsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.ExplorationRecommendationsModel]


class TopicSimilaritiesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSimilaritiesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [recommendations_models.TopicSimilaritiesModel]


class SkillModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillModel]


class SkillSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotMetadataModel]


class SkillSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotContentModel]


class SkillCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillCommitLogEntryModel]


class SkillSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSummaryModel]


class StoryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryModel]


class StorySnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotMetadataModel]


class StorySnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotContentModel]


class StoryCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StoryCommitLogEntryModel]


class StorySummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySummaryModel]


class GeneralSuggestionModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralSuggestionModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralSuggestionModel]


class GeneralVoiceoverApplicationModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates GeneralVoiceoverApplicationModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.GeneralVoiceoverApplicationModel]


class TopicModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]


class TopicSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSnapshotMetadataModel]


class TopicSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSnapshotContentModel]


class TopicRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsModel]


class TopicRightsSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsSnapshotMetadataModel]


class TopicRightsSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsSnapshotContentModel]


class TopicRightsAllUsersModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicRightsAllUsersModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicRightsAllUsersModel]


class TopicCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicCommitLogEntryModel]


class TopicSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSummaryModel]


class SubtopicPageModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageModel]


class SubtopicPageSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageSnapshotMetadataModel]


class SubtopicPageSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageSnapshotContentModel]


class SubtopicPageCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.SubtopicPageCommitLogEntryModel]


class UserSettingsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSettingsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]


class UserNormalizedNameAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates normalized usernames."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
            yield (model_instance.normalized_username, model_instance.id)

    @staticmethod
    def reduce(key, values):
        if len(values) > 1:
            yield (
                'failed validation check for normalized username check of '
                'UserSettingsModel',
                'Users with ids %s have the same normalized username %s' % (
                    sorted(values), key))


class CompletedActivitiesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CompletedActivitiesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.CompletedActivitiesModel]


class IncompleteActivitiesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates IncompleteActivitiesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.IncompleteActivitiesModel]


class ExpUserLastPlaythroughModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExpUserLastPlaythroughModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.ExpUserLastPlaythroughModel]


class LearnerPlaylistModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates LearnerPlaylistModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.LearnerPlaylistModel]


class UserContributionsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserContributionsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionsModel]


class UserEmailPreferencesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserEmailPreferencesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserEmailPreferencesModel]


class UserSubscriptionsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSubscriptionsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]


class UserSubscribersModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSubscribersModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscribersModel]


class UserRecentChangesBatchModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserRecentChangesBatchModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserRecentChangesBatchModel]


class UserStatsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserStatsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserStatsModel]


class ExplorationUserDataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ExplorationUserDataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.ExplorationUserDataModel]


class CollectionProgressModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates CollectionProgressModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.CollectionProgressModel]


class StoryProgressModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StoryProgressModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.StoryProgressModel]


class UserQueryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserQueryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserQueryModel]


class UserBulkEmailsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserBulkEmailsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserBulkEmailsModel]


class UserSkillMasteryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserSkillMasteryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSkillMasteryModel]


class UserContributionScoringModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserContributionScoringModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionScoringModel]


class UserCommunityRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserCommunityRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserCommunityRightsModel]


class PendingDeletionRequestModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates PendingDeletionRequestModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.PendingDeletionRequestModel]


class TaskEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TaskEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [improvements_models.TaskEntryModel]
