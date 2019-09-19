# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Functions to export the data of all user related models from a given
user_id.
"""
from __future__ import absolute_import   # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models

(
    user_models, collection_models, exploration_models, story_models,
    feedback_models, suggestion_models,
    email_models) = models.Registry.import_models([
     models.NAMES.user, models.NAMES.collection, models.NAMES.exploration,
     models.NAMES.story, models.NAMES.feedback, models.NAMES.suggestion,
     models.NAMES.email])


def export_all_models(user_id):
    # User models.
    stats_data = user_models.UserStatsModel.export_data(user_id)
    user_settings_data = user_models.UserSettingsModel.export_data(user_id)
    user_subscriptions_data = (user_models.
                               UserSubscriptionsModel.export_data(user_id))
    user_skill_data = user_models.UserSkillMasteryModel.export_data(user_id)
    user_contribution_data = (user_models.
                              UserContributionsModel.export_data(user_id))
    user_exploration_data = (user_models.
                             ExplorationUserDataModel.export_data(user_id))
    completed_activities_data = (user_models.
                                 CompletedActivitiesModel.export_data(user_id))
    incomplete_activities_data = (user_models.
                                  IncompleteActivitiesModel.
                                  export_data(user_id))
    last_playthrough_data = (user_models.
                             ExpUserLastPlaythroughModel.export_data(user_id))
    learner_playlist_data = (user_models.
                             LearnerPlaylistModel.export_data(user_id))
    collection_progress_data = (user_models.
                                CollectionProgressModel.export_data(user_id))
    story_progress_data = user_models.StoryProgressModel.export_data(user_id)

    # Feedback models.
    general_feedback_thread_data = (feedback_models.
                                    GeneralFeedbackThreadModel.
                                    export_data(user_id))
    general_feedback_message_data = (feedback_models.
                                     GeneralFeedbackMessageModel.
                                     export_data(user_id))

    # Collection models.
    collection_rights_data = (collection_models.
                              CollectionRightsModel.
                              export_data(user_id))

    # Suggestion models.
    general_suggestion_data = (suggestion_models.
                               GeneralSuggestionModel.
                               export_data(user_id))

    # Exploration models.
    exploration_rights_data = (exploration_models.ExplorationRightsModel.
                               export_data(user_id))

    general_feedback_email_reply_data = (email_models.
                                         GeneralFeedbackEmailReplyToIdModel.
                                         export_data(user_id))

    # Combine the data into a single dictionary.
    return {
        'stats_data': stats_data,
        'user_settings_data': user_settings_data,
        'user_subscriptions_data': user_subscriptions_data,
        'user_skill_data': user_skill_data,
        'user_contribution_data': user_contribution_data,
        'user_exploration_data': user_exploration_data,
        'completed_activities_data': completed_activities_data,
        'incomplete_activities_data': incomplete_activities_data,
        'last_playthrough_data': last_playthrough_data,
        'learner_playlist_data': learner_playlist_data,
        'collection_progress_data': collection_progress_data,
        'story_progress_data': story_progress_data,
        'general_feedback_thread_data': general_feedback_thread_data,
        'general_feedback_message_data': general_feedback_message_data,
        'collection_rights_data': collection_rights_data,
        'general_suggestion_data': general_suggestion_data,
        'exploration_rights_data': exploration_rights_data,
        'general_feedback_email_reply_data': general_feedback_email_reply_data
    }
