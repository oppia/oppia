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

"""Jobs for queries personalized to individual users."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core.platform import models

(
    audit_models, collection_models, config_models,
    email_models, exp_models, feedback_models,
    file_models, question_models, skill_models,
    story_models, suggestion_models, topic_models,
    user_models) = (
        models.Registry.import_models([
            models.NAMES.audit, models.NAMES.collection, models.NAMES.config,
            models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
            models.NAMES.file, models.NAMES.question, models.NAMES.skill,
            models.NAMES.story, models.NAMES.suggestion, models.NAMES.topic,
            models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


class UserIdJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating new user ids for all the users and re-adding
    models that use the user id.
    """

    # Models that use user_id as id and thus need to be recreated.
    MODEL_TYPES_TO_BE_COPIED = (
        user_models.UserSettingsModel,
        user_models.CompletedActivitiesModel,
        user_models.IncompleteActivitiesModel,
        user_models.LearnerPlaylistModel,
        user_models.UserContributionsModel,
        user_models.UserEmailPreferencesModel,
        user_models.UserSubscriptionsModel,
        user_models.UserSubscribersModel,
        user_models.UserRecentChangesBatchModel,
        user_models.UserStatsModel,
        user_models.UserBulkEmailsModel,
        user_models.UserRecentChangesBatchModel,
        feedback_models.UnsentFeedbackEmailModel)

    # Models that use user_id as part of an id and thus need to be recreated.
    MODEL_TYPES_TO_BE_COPIED_PART_ID = (
        user_models.ExpUserLastPlaythroughModel,
        user_models.ExplorationUserDataModel,
        user_models.CollectionProgressModel,
        user_models.StoryProgressModel,
        user_models.UserSkillMasteryModel)

    # Models that have one field with user id.
    MODEL_TYPES_ONE_USER_ID_FIELD = {
        'author_id': (
            feedback_models.GeneralFeedbackMessageModel,
            suggestion_models.GeneralSuggestionModel,
        ),
        'committer_id': (
            collection_models.CollectionSnapshotMetadataModel,
            collection_models.CollectionRightsSnapshotMetadataModel,
            config_models.ConfigPropertySnapshotMetadataModel,
            exp_models.ExplorationSnapshotMetadataModel,
            exp_models.ExplorationRightsSnapshotMetadataModel,
            file_models.FileMetadataSnapshotMetadataModel,
            file_models.FileSnapshotMetadataModel,
            question_models.QuestionSnapshotMetadataModel,
            question_models.QuestionRightsSnapshotMetadataModel,
            skill_models.SkillSnapshotMetadataModel,
            skill_models.SkillRightsSnapshotMetadataModel,
            story_models.StorySnapshotMetadataModel,
            topic_models.TopicSnapshotMetadataModel,
            topic_models.SubtopicPageSnapshotMetadataModel,
        ),
        'creator_id': (
            question_models.QuestionSummaryModel,
            question_models.QuestionRightsModel,
            skill_models.SkillRightsModel,
        ),
        'final_reviewer_id': (suggestion_models.GeneralSuggestionModel,),
        'original_author_id': (feedback_models.GeneralFeedbackThreadModel,),
        'recipient_id': (email_models.SentEmailModel,),
        'sender_id': (email_models.SentEmailModel, email_models.BulkEmailModel),
        'submitter_id': (user_models.UserQueryModel,),
        'user_id': (
            audit_models.RoleQueryAuditModel,
            collection_models.CollectionCommitLogEntryModel,
            email_models.GeneralFeedbackEmailReplyToIdModel,
            exp_models.ExplorationCommitLogEntryModel,
            feedback_models.GeneralFeedbackThreadUserModel,
            question_models.QuestionCommitLogEntryModel,
            skill_models.SkillCommitLogEntryModel,
            story_models.StoryCommitLogEntryModel,
            topic_models.TopicCommitLogEntryModel,
            topic_models.SubtopicPageCommitLogEntryModel,
        ),
    }

    @staticmethod
    def _copy_model_with_new_id(model_class, old_user_id, new_user_id):
        """Create new model with same values but new id."""
        old_model = model_class.get_by_id(old_user_id)
        if not old_model:
            return
        model_values = old_model.to_dict()
        model_values['id'] = new_user_id
        model_class(**model_values).put(update_last_updated_time=False)
        old_model.delete()

    @staticmethod
    def _copy_model_with_new_id_and_user_id(
            model_class, old_user_id, new_user_id):
        """Create new model with same values but new id and user_id."""
        old_models = model_class.query(
            model_class.user_id == old_user_id).fetch()
        for old_model in old_models:
            model_values = old_model.to_dict()
            new_id = '%s.%s' % (new_user_id, old_model.id.split('.')[1])
            model_values['id'] = new_id
            model_values['user_id'] = new_user_id
            model_class(**model_values).put(update_last_updated_time=False)
            old_model.delete()

    @staticmethod
    def _change_model_with_one_user_id_field(
            model_class, old_user_id, new_user_id, field_name):
        """Replace field in model with new user id."""
        found_models = model_class.query(
            getattr(model_class, field_name) == old_user_id).fetch()
        for model in found_models:
            model_values = model.to_dict()
            model_values[field_name] = new_user_id
            model.populate(**model_values)
            model.put(update_last_updated_time=False)

    @staticmethod
    def _change_user_contribution_scoring_model(old_user_id, new_user_id):
        """Create new model with same values but new id and user_id."""
        old_models = user_models.UserContributionScoringModel.query(
            user_models.UserContributionScoringModel.user_id == old_user_id
        ).fetch()
        for old_model in old_models:
            model_values = old_model.to_dict()
            new_id = '%s.%s' % (old_model.id.split('.')[0], new_user_id)
            model_values['id'] = new_id
            model_values['user_id'] = new_user_id
            user_models.UserContributionScoringModel(
                **model_values).put(update_last_updated_time=False)
            old_model.delete()

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        old_user_id = user_model.id
        new_user_id = user_models.UserSettingsModel.get_new_id('user')
        for model_type in UserIdJob.MODEL_TYPES_TO_BE_COPIED:
            UserIdJob._copy_model_with_new_id(
                model_type, old_user_id, new_user_id)
        for model_type in UserIdJob.MODEL_TYPES_TO_BE_COPIED_PART_ID:
            UserIdJob._copy_model_with_new_id_and_user_id(
                model_type, old_user_id, new_user_id)
        for field_name, model_types in UserIdJob.MODEL_TYPES_ONE_USER_ID_FIELD.items():
            for model_type in model_types:
                UserIdJob._change_model_with_one_user_id_field(
                    model_type, old_user_id, new_user_id, field_name)
        UserIdJob._change_user_contribution_scoring_model(
            old_user_id, new_user_id)

        yield ('SUCCESS', new_user_id)

    @staticmethod
    def reduce(key, new_user_ids):
        """Implements the reduce function for this job."""
        yield (key, new_user_ids)
