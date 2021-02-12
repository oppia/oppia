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

"""Validators for prod models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools

from core.domain import base_model_validators
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.platform import models
import feconf
import python_utils
import utils

(
    base_models, collection_models, exp_models,
    feedback_models, question_models,
    skill_models, story_models, subtopic_models,
    suggestion_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.collection, models.NAMES.exploration,
    models.NAMES.feedback, models.NAMES.question,
    models.NAMES.skill, models.NAMES.story, models.NAMES.subtopic,
    models.NAMES.suggestion, models.NAMES.topic, models.NAMES.user
])

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
TARGET_TYPE_TO_TARGET_MODEL = {
    feconf.ENTITY_TYPE_EXPLORATION: (
        exp_models.ExplorationModel),
    feconf.ENTITY_TYPE_QUESTION: (
        question_models.QuestionModel),
    feconf.ENTITY_TYPE_SKILL: (
        skill_models.SkillModel),
    feconf.ENTITY_TYPE_TOPIC: (
        topic_models.TopicModel)
}


class SubtopicPageModelValidator(base_model_validators.BaseModelValidator):
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
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_commit_log_entry_ids',
                subtopic_models.SubtopicPageCommitLogEntryModel,
                ['subtopicpage-%s-%s'
                 % (item.id, version) for version in python_utils.RANGE(
                     1, item.version + 1)]),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_metadata_ids',
                subtopic_models.SubtopicPageSnapshotMetadataModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'snapshot_content_ids',
                subtopic_models.SubtopicPageSnapshotContentModel,
                snapshot_model_ids),
            base_model_validators.ExternalModelFetcherDetails(
                'topic_ids', topic_models.TopicModel, [item.topic_id])]

    @classmethod
    def _get_custom_validation_functions(cls):
        return []


class SubtopicPageSnapshotMetadataModelValidator(
        base_model_validators.BaseSnapshotMetadataModelValidator):
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
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'committer_ids', [item.committer_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]


class SubtopicPageSnapshotContentModelValidator(
        base_model_validators.BaseSnapshotContentModelValidator):
    """Class for validating SubtopicPageSnapshotContentModel."""

    EXTERNAL_MODEL_NAME = 'subtopic page'

    @classmethod
    def _get_model_id_regex(cls, unused_item):
        return '^[A-Za-z0-9]{1,%s}-\\d*-\\d*$' % base_models.ID_LENGTH

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.id[:item.id.rfind(base_models.VERSION_DELIMITER)]])]


class SubtopicPageCommitLogEntryModelValidator(
        base_model_validators.BaseCommitLogEntryModelValidator):
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
            cls._add_error(
                'model %s' % base_model_validators.ERROR_CATEGORY_ID_CHECK,
                'Entity id %s: Entity id does not match regex pattern' % (
                    item.id))
            return None

    @classmethod
    def _get_external_id_relationships(cls, item):
        return [
            base_model_validators.ExternalModelFetcherDetails(
                'subtopic_page_ids',
                subtopic_models.SubtopicPageModel,
                [item.subtopic_page_id]),
            base_model_validators.UserSettingsModelFetcherDetails(
                'user_id', [item.user_id],
                may_contain_system_ids=True,
                may_contain_pseudonymous_ids=True
            )]
