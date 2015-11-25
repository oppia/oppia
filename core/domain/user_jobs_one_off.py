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

"""Jobs for queries personalized to individual users."""

import ast

from core import jobs
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
(exp_models, collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection,
        models.NAMES.feedback, models.NAMES.user]))

class UserContributionsOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for creating and populating UserContributionsModels for 
    all registered users.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [exp_models.ExplorationSnapchatMetadataModel]

    @staticmethod
    def map(item):
        split_id = item.id.split("-")
        yield (item.committer_id, {
            'version_number': split_id[1],
            'exploration_id': split_id[0]
        })

    @staticmethod
    def reduce(key, version_and_exp_ids):

        created_explorations = []
        edited_explorations = []

        for edit in version_and_exp_ids
            if(edit.version_number == 1){
                created_explorations.append(edit.exploration_id)
            edited_explorations.append(edit.exploration_id)

        if isinstance(UserContributionsModel.get(key), user_models.UserContributionsModel)
            user_services.update_user_contributions(key, set(created_explorations),
                set(edited_explorations))

        else                
            user_contributions = user_services.create_user_contributions(key, set(created_explorations),
                set(edited_explorations))
      

class DashboardSubscriptionsOneOffJob(jobs.BaseMapReduceJobManager):
    """One-off job for subscribing users to explorations, collections, and
    feedback threads.
    """
    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            exp_models.ExplorationRightsModel,
            collection_models.CollectionRightsModel,
            feedback_models.FeedbackMessageModel,
        ]

    @staticmethod
    def map(item):
        if isinstance(item, feedback_models.FeedbackMessageModel):
            if item.author_id:
                yield (item.author_id, {
                    'type': 'feedback',
                    'id': item.thread_id
                })
        elif isinstance(item, exp_models.ExplorationRightsModel):
            if item.deleted:
                return

            if not item.community_owned:
                for owner_id in item.owner_ids:
                    yield (owner_id, {
                        'type': 'exploration',
                        'id': item.id
                    })
                for editor_id in item.editor_ids:
                    yield (editor_id, {
                        'type': 'exploration',
                        'id': item.id
                    })
            else:
                # Go through the history.
                current_version = item.version
                for version in range(1, current_version + 1):
                    model = exp_models.ExplorationRightsModel.get_version(
                        item.id, version)

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (owner_id, {
                                'type': 'exploration',
                                'id': item.id
                            })
                        for editor_id in model.editor_ids:
                            yield (editor_id, {
                                'type': 'exploration',
                                'id': item.id
                            })
        elif isinstance(item, collection_models.CollectionRightsModel):
            # NOTE TO DEVELOPERS: Although the code handling subscribing to
            # collections is very similar to the code above for explorations,
            # it is not abstracted out due to the majority of the coding being
            # yield statements. These must happen inside the generator method
            # (which is this method) and, as a result, there is little common
            # code between the two code blocks which can be effectively
            # abstracted.
            if item.deleted:
                return

            if not item.community_owned:
                for owner_id in item.owner_ids:
                    yield (owner_id, {
                        'type': 'collection',
                        'id': item.id
                    })
                for editor_id in item.editor_ids:
                    yield (editor_id, {
                        'type': 'collection',
                        'id': item.id
                    })
            else:
                # Go through the history.
                current_version = item.version
                for version in range(1, current_version + 1):
                    model = (
                        collection_models.CollectionRightsModel.get_version(
                            item.id, version))

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (owner_id, {
                                'type': 'collection',
                                'id': item.id
                            })
                        for editor_id in model.editor_ids:
                            yield (editor_id, {
                                'type': 'collection',
                                'id': item.id
                            })

    @staticmethod
    def reduce(key, stringified_values):
        values = [ast.literal_eval(v) for v in stringified_values]
        for item in values:
            if item['type'] == 'feedback':
                subscription_services.subscribe_to_thread(key, item['id'])
            elif item['type'] == 'exploration':
                subscription_services.subscribe_to_exploration(key, item['id'])
            elif item['type'] == 'collection':
                subscription_services.subscribe_to_collection(key, item['id'])
