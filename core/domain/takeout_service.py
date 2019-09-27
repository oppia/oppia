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
    user_models, collection_models, exploration_models, feedback_models,
    suggestion_models, email_models) = models.Registry.import_models([
        models.NAMES.user, models.NAMES.collection, models.NAMES.exploration,
        models.NAMES.feedback, models.NAMES.suggestion, models.NAMES.email])


def export_data_for_user(user_id):
    """Exports selected models according to model defined export_data functions.

    Args:
            user_id: str. The user_id of the user to export.

    Returns:
            dict. Dictionary containing all user data.
    """

    models_export_format = {
        'stats_data': user_models.UserStatsModel,
        'user_settings_data': user_models.UserSettingsModel,
        'user_subscriptions_data': user_models.UserSubscriptionsModel,
        'user_skill_data': user_models.UserSkillMasteryModel,
        'user_contribution_data': user_models.UserContributionsModel,
        'user_exploration_data': user_models.ExplorationUserDataModel,
        'completed_activities_data': user_models.CompletedActivitiesModel,
        'incomplete_activities_data': user_models.IncompleteActivitiesModel,
        'last_playthrough_data': user_models.ExpUserLastPlaythroughModel,
        'learner_playlist_data': user_models.LearnerPlaylistModel,
        'collection_progress_data': user_models.CollectionProgressModel,
        'story_progress_data': user_models.StoryProgressModel,
        'general_feedback_thread_data': (
            feedback_models.GeneralFeedbackThreadModel),
        'general_feedback_message_data': (
            feedback_models.GeneralFeedbackMessageModel),
        'collection_rights_data': collection_models.CollectionRightsModel,
        'general_suggestion_data': suggestion_models.GeneralSuggestionModel,
        'exploration_rights_data': exploration_models.ExplorationRightsModel,
        'general_feedback_email_reply_data': (
            email_models.GeneralFeedbackEmailReplyToIdModel)
    }

    exported_data = dict()
    for k, v in models_export_format.items():
        exported_data[k] = v.export_data(user_id)

    # Combine the data into a single dictionary.
    return exported_data
