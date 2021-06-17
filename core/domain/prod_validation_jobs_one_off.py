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

import importlib

from core import jobs
from core.platform import models
import python_utils

(
    activity_models, app_feedback_report_models, audit_models, auth_models,
    beam_job_models, blog_models, classifier_models, collection_models,
    config_models, email_models, exp_models, feedback_models,
    improvements_models, job_models, opportunity_models, question_models,
    recommendations_models, skill_models, stats_models, story_models,
    subtopic_models, suggestion_models, topic_models, translation_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.activity, models.NAMES.app_feedback_report, models.NAMES.audit,
    models.NAMES.auth, models.NAMES.beam_job, models.NAMES.blog,
    models.NAMES.classifier, models.NAMES.collection, models.NAMES.config,
    models.NAMES.email, models.NAMES.exploration, models.NAMES.feedback,
    models.NAMES.improvements, models.NAMES.job, models.NAMES.opportunity,
    models.NAMES.question, models.NAMES.recommendations, models.NAMES.skill,
    models.NAMES.statistics, models.NAMES.story, models.NAMES.subtopic,
    models.NAMES.suggestion, models.NAMES.topic, models.NAMES.translation,
    models.NAMES.user
])

VALIDATION_STATUS_SUCCESS = 'fully-validated'


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
        """Return a list of datastore class references to map over.

        Raises:
            NotImplementedError. This function has not yet been implemented.
        """
        raise NotImplementedError(
            'The entity_classes_to_map_over() method is missing from the '
            'derived class. It should be implemented in the derived class.')

    @staticmethod
    def map(model_instance):
        """Implements a map function which defers to a pre-defined validator."""
        model_name = model_instance.__class__.__name__
        validator_cls_name = '%sValidator' % model_name
        # Module name for models is of the form:
        # 'core.storage.<model-type>.gae_models'.
        # Module name for validators is of the form:
        # 'core.domain.<model-type>_validators'.
        # So, we extract the module name for models to obtain the module name
        # for validators. There is no extra test required to verify that models
        # and validators have names defined based on model-type since if they
        # don't the validators test will automatically fail based on the import
        # we perform here for validators.
        model_module_name = model_instance.__module__
        model_type = model_module_name.split('.')[2]
        validator_module_name = '%s_validators' % model_type

        validator_module = importlib.import_module(
            'core.domain.%s' % validator_module_name)
        validator = getattr(validator_module, validator_cls_name)
        if not model_instance.deleted:
            validator.validate(model_instance)
        else:
            validator.validate_deleted(model_instance)

        if len(validator.errors) > 0:
            for error_key, error_list in validator.errors.items():
                error_message = (
                    ((',').join(set(error_list))).encode(encoding='utf-8'))
                yield (
                    'failed validation check for %s of %s' % (
                        error_key, model_name),
                    python_utils.convert_to_bytes(error_message)
                )
        else:
            yield ('%s %s' % (VALIDATION_STATUS_SUCCESS, model_name), 1)

    @staticmethod
    def reduce(key, values):
        """Yields number of fully validated models or the failure messages."""
        if VALIDATION_STATUS_SUCCESS in key:
            yield (key, len(values))
        else:
            yield (key, values)


class ActivityReferencesModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates ActivityReferencesModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [activity_models.ActivityReferencesModel]


class AppFeedbackReportModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates AppFeedbackReportModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [app_feedback_report_models.AppFeedbackReportModel]


class AppFeedbackReportTicketModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates AppFeedbackReportTicketModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [app_feedback_report_models.AppFeedbackReportTicketModel]


class AppFeedbackReportStatsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates AppFeedbackReportStatsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [app_feedback_report_models.AppFeedbackReportStatsModel]


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


class StateTrainingJobsMappingModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates StateTrainingJobsMappingModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [classifier_models.StateTrainingJobsMappingModel]


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

    @staticmethod
    def reduce(key, values):
        """Yields the number of fully validated models or the failure messages.
        By default, this method only yields a maximum of 10 errors if there are
        multiple errors of the same type.

        Note: This behaviour can be overriden in any subclass if more errors
        need to be yielded. To do so, just change the yield statement to
        yield all values instead of the first 10.
        """
        if VALIDATION_STATUS_SUCCESS in key:
            yield (key, len(values))
        else:
            # Just yield ten errors of each error type since the list of errors
            # for this model is quite large.
            yield (key, values[:10])


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


class QuestionSnapshotMetadataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotMetadataModel]


class QuestionSnapshotContentModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates QuestionSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionSnapshotContentModel]


class QuestionCommitLogEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
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


class SkillSnapshotMetadataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotMetadataModel]


class SkillSnapshotContentModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates SkillSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [skill_models.SkillSnapshotContentModel]


class SkillCommitLogEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
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


class StorySnapshotMetadataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotMetadataModel]


class StorySnapshotContentModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates StorySnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [story_models.StorySnapshotContentModel]


class StoryCommitLogEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
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


class CommunityContributionStatsModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates CommunityContributionStatsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [suggestion_models.CommunityContributionStatsModel]


class TopicModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicModel]


class TopicSnapshotMetadataModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TopicSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [topic_models.TopicSnapshotMetadataModel]


class TopicSnapshotContentModelAuditOneOffJob(ProdValidationAuditOneOffJob):
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


class TopicCommitLogEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
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
        return [subtopic_models.SubtopicPageModel]


class SubtopicPageSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            subtopic_models.SubtopicPageSnapshotMetadataModel]


class SubtopicPageSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            subtopic_models.SubtopicPageSnapshotContentModel]


class SubtopicPageCommitLogEntryModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates SubtopicPageCommitLogEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            subtopic_models.SubtopicPageCommitLogEntryModel]


class MachineTranslationModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates MachineTranslationModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [translation_models.MachineTranslationModel]


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
        # If normalized name is not set, we do not compare it with normalized
        # names for other users. It is not mandatory to set the normalized
        # user names in UserSettingsModel since some users who have logged in
        # but not completed the sign-up process may not have a username
        # specified yet.
        if key != 'None' and len(values) > 1:
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
    """Job that audits and validates UserStatsModel.

    NOTE TO DEVELOPERS: This job is expected to take a very long time to
    run since it iterates over weekly creator stats for validation which
    is a very large list.
    """

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


class UserContributionProficiencyModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates UserContributionProficiencyModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionProficiencyModel]


class UserContributionRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserContributionRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionRightsModel]


class PendingDeletionRequestModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates PendingDeletionRequestModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.PendingDeletionRequestModel]


class DeletedUserModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates DeletedUserModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.DeletedUserModel]


class DeletedUsernameModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates DeletedUsernameModels."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.DeletedUsernameModel]


class TaskEntryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates TaskEntryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [improvements_models.TaskEntryModel]


class PlaythroughModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates PlaythroughModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [stats_models.PlaythroughModel]


class PseudonymizedUserModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates PseudonymizedUserModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.PseudonymizedUserModel]


class BeamJobRunModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BeamJobRunModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [beam_job_models.BeamJobRunModel]


class BeamJobRunResultModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BeamJobRunResultModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [beam_job_models.BeamJobRunResultModel]


class UserAuthDetailsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserAuthDetailsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [auth_models.UserAuthDetailsModel]


class UserIdentifiersModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserIdentifiersModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [auth_models.UserIdentifiersModel]


class UserIdByFirebaseAuthIdModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates UserIdByFirebaseAuthIdModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [auth_models.UserIdByFirebaseAuthIdModel]


class FirebaseSeedModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates FirebaseSeedModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [auth_models.FirebaseSeedModel]


class PlatformParameterModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates PlatformParameterModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.PlatformParameterModel]


class PlatformParameterSnapshotMetadataModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates PlatformParameterSnapshotMetadataModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.PlatformParameterSnapshotMetadataModel]


class PlatformParameterSnapshotContentModelAuditOneOffJob(
        ProdValidationAuditOneOffJob):
    """Job that audits and validates PlatformParameterSnapshotContentModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [config_models.PlatformParameterSnapshotContentModel]


class BlogPostModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BlogPostModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [blog_models.BlogPostModel]


class BlogPostSummaryModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BlogPostSummaryModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [blog_models.BlogPostSummaryModel]


class BlogPostRightsModelAuditOneOffJob(ProdValidationAuditOneOffJob):
    """Job that audits and validates BlogPostRightsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [blog_models.BlogPostRightsModel]
