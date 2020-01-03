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

import inspect
import re

from core.platform import models

(
    base_models, collection_models, email_models, exploration_models,
    feedback_models, suggestion_models,
    user_models) = models.Registry.import_models(
        [models.NAMES.base_model, models.NAMES.collection, models.NAMES.email,
         models.NAMES.exploration, models.NAMES.feedback,
         models.NAMES.suggestion, models.NAMES.user])


def get_models_should_be_exported():
    """Returns set of strings representing models to export.
    
    Returns:
        set of str. Set of strings representing models whose data should be
        exported.
    """
    return {
        'collection_rights_data',
        'general_feedback_email_reply_to_id_data',
        'exploration_rights_data',
        'general_feedback_message_data',
        'general_feedback_thread_data',
        'general_feedback_thread_user_data',
        'general_suggestion_data',
        'collection_progress_data',
        'completed_activities_data',
        'exp_user_last_playthrough_data',
        'exploration_user_data_data',
        'incomplete_activities_data',
        'learner_playlist_data',
        'story_progress_data',
        'user_contributions_data',
        'user_settings_data',
        'user_skill_mastery_data',
        'user_stats_data',
        'user_subscriptions_data'
    }


def export_data_for_user(user_id):
    """Exports selected models according to model defined export_data functions.

    Args:
        user_id: str. The user_id of the user whose data is being exported.

    Returns:
        dict. Dictionary containing all user data in the following format:
        {
            <MODEL_NAME>_data: <dict of data in format as specified by
                                model export policy>
        }
    """
    all_models = []
    model_names_list = [
        model_name for model_name in dir(models.NAMES)
        if not model_name.startswith('__') and not model_name == 'base_model'
    ]
    model_modules = models.Registry.import_models(model_names_list)
    for model_module in model_modules:
        for _, obj in inspect.getmembers(model_module):
            if inspect.isclass(obj):
                all_models.append(obj)

    exported_data = dict()
    models_to_export = get_models_should_be_exported()
    for model in all_models:
        # Split the model name by uppercase characters.
        split_name = re.findall('[A-Z][^A-Z]*', model.__name__)[:-1]
        # Join the split name with underscores and add _data for final name.
        final_name = ('_').join([x.lower() for x in split_name]) + '_data'
        if final_name in models_to_export:
            exported_data[final_name] = model.export_data(user_id)
    # Combine the data into a single dictionary.
    return exported_data
