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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import copy
import datetime
import imghdr

from constants import constants
from core import jobs
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import image_services
from core.domain import learner_progress_services
from core.domain import rights_manager
from core.domain import story_fetchers
from core.domain import subscription_services
from core.domain import topic_fetchers
from core.domain import user_services
from core.platform import models
import feconf
import python_utils
import utils

(exp_models, collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.NAMES.exploration, models.NAMES.collection,
        models.NAMES.feedback, models.NAMES.user]))
datastore_services = models.Registry.import_datastore_services()


_LANGUAGES_TO_RESET = ['hu', 'mk', 'sv', 'tr', 'de', 'fr', 'nl', 'pt']


class UserContributionsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for creating and populating UserContributionsModels for
    all registered users that have contributed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [exp_models.ExplorationSnapshotMetadataModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        yield (
            item.committer_id, {
                'exploration_id': item.get_unversioned_instance_id(),
                'version_string': item.get_version_string(),
            })

    @staticmethod
    def reduce(key, version_and_exp_ids):
        """Implements the reduce function for this job."""
        created_exploration_ids = set()
        edited_exploration_ids = set()

        edits = [ast.literal_eval(v) for v in version_and_exp_ids]
        for edit in edits:
            edited_exploration_ids.add(edit['exploration_id'])
            if edit['version_string'] == '1':
                created_exploration_ids.add(edit['exploration_id'])

        if user_services.get_user_contributions(key, strict=False) is not None:
            user_services.update_user_contributions(
                key, list(created_exploration_ids), list(
                    edited_exploration_ids))
        else:
            user_services.create_user_contributions(
                key, list(created_exploration_ids), list(
                    edited_exploration_ids))


class UsernameLengthDistributionOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for calculating the distribution of username lengths."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        if item.username is not None:
            yield (len(item.username), 1)

    @staticmethod
    def reduce(key, stringified_username_counter):
        """Implements the reduce function for this job."""
        username_counter = [
            ast.literal_eval(v) for v in stringified_username_counter]
        yield (key, len(username_counter))


class UsernameLengthAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits and validates username lengths."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(model_instance):
        if len(model_instance.username) > 20:
            yield (len(model_instance.username), model_instance.username)

    @staticmethod
    def reduce(key, values):
        yield ('Length: %s' % key, 'Usernames: %s' % sorted(values))


class LongUserBiosOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for calculating the length of user_bios."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        if item.user_bio is None:
            user_bio_length = 0
        else:
            user_bio_length = len(item.user_bio)

        yield (user_bio_length, item.username)

    @staticmethod
    def reduce(userbio_length, stringified_usernames):
        """Implements the reduce function for this job."""
        if int(userbio_length) > 500:
            yield (userbio_length, stringified_usernames)


class PopulateStoriesAndTopicsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One-off job to populate the story_ids and topic_ids
    in Incomplete and Completed Activities Model."""

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        user_id = item.id
        activity_ids_in_learner_dashboard = (
            learner_progress_services.get_learner_dashboard_activities(
                user_id))
        incomplete_exploration_ids = (
            activity_ids_in_learner_dashboard.incomplete_exploration_ids)
        completed_exploration_ids = (
            activity_ids_in_learner_dashboard.completed_exploration_ids)

        story_ids_linked_to_incomplete_explorations = (
            list(set(exp_services.get_story_ids_linked_to_explorations(
                incomplete_exploration_ids))))
        stories_linked_to_incomplete_explorations = (
            story_fetchers.get_stories_by_ids(
                story_ids_linked_to_incomplete_explorations))

        story_ids_linked_to_completed_explorations = (
            list(set(exp_services.get_story_ids_linked_to_explorations(
                completed_exploration_ids))))
        stories_linked_to_completed_explorations = (
            story_fetchers.get_stories_by_ids(
                story_ids_linked_to_completed_explorations))
        topic_ids_linked_to_stories_for_completed_exps = [
            story.corresponding_topic_id for story in (
                stories_linked_to_completed_explorations)]
        topics_linked_to_stories_for_completed_exps = (
            topic_fetchers.get_topics_by_ids(
                topic_ids_linked_to_stories_for_completed_exps))
        completed_story_ids = []

        # Mark stories for completed explorations.
        for story in stories_linked_to_completed_explorations:
            if story:
                completed_nodes = (
                    story_fetchers.get_completed_nodes_in_story(
                        user_id, story.id))
                all_nodes = story.story_contents.nodes

                if len(completed_nodes) != len(all_nodes):
                    learner_progress_services.record_story_started(
                        user_id, story.id)
                else:
                    learner_progress_services.mark_story_as_completed(
                        user_id, story.id)
                    completed_story_ids.append(story.id)

        # Mark stories for incomplete explorations.
        for story in stories_linked_to_incomplete_explorations:
            if story:
                learner_progress_services.record_story_started(
                    user_id, story.id)
                if story.corresponding_topic_id:
                    learner_progress_services.record_topic_started(
                        user_id, story.corresponding_topic_id)

        # Mark topics for completed explorations.
        for topic in topics_linked_to_stories_for_completed_exps:
            if topic:
                story_ids_in_topic = []
                for canonical_story in topic.canonical_story_references:
                    story_ids_in_topic.append(canonical_story.story_id)
                if set(story_ids_in_topic).intersection(set(
                        completed_story_ids)):
                    learner_progress_services.mark_topic_as_learnt(
                        user_id, topic.id)
                else:
                    learner_progress_services.record_topic_started(
                        user_id, topic.id)

        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class DashboardSubscriptionsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for subscribing users to explorations, collections, and
    feedback threads.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [
            exp_models.ExplorationRightsModel,
            collection_models.CollectionRightsModel,
            feedback_models.GeneralFeedbackMessageModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        if isinstance(item, feedback_models.GeneralFeedbackMessageModel):
            if item.author_id:
                yield (
                    item.author_id, {
                        'type': 'feedback',
                        'id': item.thread_id
                    })
        elif isinstance(item, exp_models.ExplorationRightsModel):
            if item.deleted:
                return

            if not item.community_owned:
                for owner_id in item.owner_ids:
                    yield (
                        owner_id, {
                            'type': 'exploration',
                            'id': item.id
                        })
                for editor_id in item.editor_ids:
                    yield (
                        editor_id, {
                            'type': 'exploration',
                            'id': item.id
                        })
            else:
                # Go through the history.
                current_version = item.version
                for version in python_utils.RANGE(1, current_version + 1):
                    model = exp_models.ExplorationRightsModel.get_version(
                        item.id, version)

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (
                                owner_id, {
                                    'type': 'exploration',
                                    'id': item.id
                                })
                        for editor_id in model.editor_ids:
                            yield (
                                editor_id, {
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
                    yield (
                        owner_id, {
                            'type': 'collection',
                            'id': item.id
                        })
                for editor_id in item.editor_ids:
                    yield (
                        editor_id, {
                            'type': 'collection',
                            'id': item.id
                        })
            else:
                # Go through the history.
                current_version = item.version
                for version in python_utils.RANGE(1, current_version + 1):
                    model = (
                        collection_models.CollectionRightsModel.get_version(
                            item.id, version))

                    if not model.community_owned:
                        for owner_id in model.owner_ids:
                            yield (
                                owner_id, {
                                    'type': 'collection',
                                    'id': item.id
                                })
                        for editor_id in model.editor_ids:
                            yield (
                                editor_id, {
                                    'type': 'collection',
                                    'id': item.id
                                })

    @staticmethod
    def reduce(key, stringified_values):
        """Implements the reduce function for this job."""
        values = [ast.literal_eval(v) for v in stringified_values]
        for item in values:
            if item['type'] == 'feedback':
                subscription_services.subscribe_to_thread(key, item['id'])
            elif item['type'] == 'exploration':
                subscription_services.subscribe_to_exploration(key, item['id'])
            elif item['type'] == 'collection':
                subscription_services.subscribe_to_collection(key, item['id'])


class DashboardStatsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job for populating weekly dashboard stats for all registered
    users who have a non-None value of UserStatsModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        user_services.update_dashboard_stats_log(item.id)


class UserFirstContributionMsecOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that updates first contribution time in milliseconds for
    current users. This job makes the assumption that once an exploration is
    published, it remains published. This job is not completely precise in that
    (1) we ignore explorations that have been published in the past but are now
    unpublished, and (2) commits that were made during an interim unpublished
    period are counted against the first publication date instead of the second
    publication date.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [exp_models.ExplorationRightsSnapshotMetadataModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        exp_id = item.get_unversioned_instance_id()

        exp_rights = rights_manager.get_exploration_rights(
            exp_id, strict=False)
        if exp_rights is None:
            return

        exp_first_published_msec = exp_rights.first_published_msec
        # First contribution time in msec is only set from contributions to
        # explorations that are currently published.
        if not rights_manager.is_exploration_private(exp_id):
            created_on_msec = utils.get_time_in_millisecs(item.created_on)
            yield (
                item.committer_id,
                max(exp_first_published_msec, created_on_msec)
            )

    @staticmethod
    def reduce(user_id, stringified_commit_times_msec):
        """Implements the reduce function for this job."""
        commit_times_msec = [
            ast.literal_eval(commit_time_string) for
            commit_time_string in stringified_commit_times_msec]
        first_contribution_msec = min(commit_times_msec)
        user_services.update_first_contribution_msec_if_not_set(
            user_id, first_contribution_msec)


class UserLastExplorationActivityOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that adds fields to record last exploration created and last
    edited times.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_model):
        """Implements the map function for this job."""
        user_id = user_model.id
        contributions = user_models.UserContributionsModel.get(user_id)

        created_explorations = exp_fetchers.get_multiple_explorations_by_id(
            contributions.created_exploration_ids)
        if created_explorations:
            user_model.last_created_an_exploration = max(
                [model.created_on for model in created_explorations.values()])

        user_commits = (
            exp_models.ExplorationCommitLogEntryModel.query(
                exp_models.ExplorationCommitLogEntryModel.user_id == user_id).
            order(-exp_models.ExplorationCommitLogEntryModel.created_on).
            fetch(1))

        if user_commits:
            user_model.last_edited_an_exploration = user_commits[0].created_on

        user_model.update_timestamps()
        user_model.put()


class CleanupExplorationIdsFromUserSubscriptionsModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One off job that removes nonexisting exploration ids from
    UserSubscriptionsModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Remove invalid ids in a UserSubscriptionsModel entity."""

        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(model_instance):
        if not model_instance.deleted:
            fetched_exploration_model_instances = (
                datastore_services.fetch_multiple_entities_by_ids_and_models(
                    [('ExplorationModel', model_instance.exploration_ids)]))[0]

            exp_ids_removed = []
            for exp_id, exp_instance in list(python_utils.ZIP(
                    model_instance.exploration_ids,
                    fetched_exploration_model_instances)):
                if exp_instance is None or exp_instance.deleted:
                    exp_ids_removed.append(exp_id)
                    model_instance.exploration_ids.remove(exp_id)
            if exp_ids_removed:
                model_instance.update_timestamps()
                model_instance.put()
                yield (
                    'Successfully cleaned up UserSubscriptionsModel %s and '
                    'removed explorations %s' % (
                        model_instance.id,
                        ', '.join(exp_ids_removed)),
                    1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class RemoveActivityIDsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes the activity_ids from the UserSubscriptionsModel.

    NOTE TO DEVELOPERS: This job can be deleted after it is run in Februrary
    2021 release.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(RemoveActivityIDsOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(user_subscriptions_model):
        # This is the only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'activity_ids' in user_subscriptions_model._properties:  # pylint: disable=protected-access
            del user_subscriptions_model._properties['activity_ids']  # pylint: disable=protected-access
            if 'activity_ids' in user_subscriptions_model._values:  # pylint: disable=protected-access
                del user_subscriptions_model._values['activity_ids']  # pylint: disable=protected-access
            user_subscriptions_model.update_timestamps(
                update_last_updated_time=False)
            user_subscriptions_model.put()
            yield (
                'SUCCESS_REMOVED - UserSubscriptionsModel',
                user_subscriptions_model.id)
        else:
            yield (
                'SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel',
                user_subscriptions_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class RemoveFeedbackThreadIDsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes the feedback_thread_ids from the UserSubscriptionsModel.

    NOTE TO DEVELOPERS: This job can be deleted after it is run in January
    2021 release.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(RemoveFeedbackThreadIDsOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscriptionsModel]

    @staticmethod
    def map(user_subscriptions_model):
        # This is the only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'feedback_thread_ids' in user_subscriptions_model._properties:  # pylint: disable=protected-access
            del user_subscriptions_model._properties['feedback_thread_ids']  # pylint: disable=protected-access
            if 'feedback_thread_ids' in user_subscriptions_model._values:  # pylint: disable=protected-access
                del user_subscriptions_model._values['feedback_thread_ids']  # pylint: disable=protected-access
            user_subscriptions_model.update_timestamps(
                update_last_updated_time=False)
            user_subscriptions_model.put()
            yield (
                'SUCCESS_REMOVED - UserSubscriptionsModel',
                user_subscriptions_model.id)
        else:
            yield (
                'SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel',
                user_subscriptions_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class FixUserSettingsCreatedOnOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that fixes the invalid values of created_on attribute in the
    UserSettingsModel.
    It is a one-off job and can be removed from the codebase after we resolve
    this issue by running the job once in the January 2021 release.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(FixUserSettingsCreatedOnOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        user_id = user_settings_model.id
        user_dates_list = [
            (
                'UserSettingsModel_last_updated',
                user_settings_model.last_updated
            ),
            (
                'UserSettingsModel_last_agreed_to_terms',
                user_settings_model.last_agreed_to_terms
            ),
            (
                'UserSettingsModel_last_started_state_editor_tutorial',
                user_settings_model.last_started_state_editor_tutorial
            ),
            (
                'UserSettingsModel_last_started_state_translation_tutorial',
                user_settings_model.last_started_state_translation_tutorial
            ),
            (
                'UserSettingsModel_last_logged_in',
                user_settings_model.last_logged_in
            ),
            (
                'UserSettingsModel_last_edited_an_exploration',
                user_settings_model.last_edited_an_exploration
            ),
            (
                'UserSettingsModel_last_created_an_exploration',
                user_settings_model.last_created_an_exploration
            ),
        ]

        if user_settings_model.first_contribution_msec is not None:
            user_dates_list.append(
                (
                    'UserSettingsModel_first_contribution_msec',
                    datetime.datetime.fromtimestamp(
                        python_utils.divide(
                            user_settings_model.first_contribution_msec, 1000.0)
                    )
                )
            )

        # Models in user storage module having user_id as an attribute.
        exploration_user_data_model = (
            user_models.ExplorationUserDataModel.query(
                user_models.ExplorationUserDataModel.user_id == user_id).get()
        )

        all_models_linked_with_user_settings_model = [
            ('ExplorationUserDataModel', exploration_user_data_model)
        ]

        # Models in user storage module keyed by user_id itself.
        model_names_and_ids_to_be_fetched_in_batch = [
            ('UserContributionsModel', [user_id]),
            ('UserEmailPreferencesModel', [user_id]),
            ('UserStatsModel', [user_id]),
            ('UserSubscriptionsModel', [user_id]),
        ]
        fetched_batch_models = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                model_names_and_ids_to_be_fetched_in_batch)
        )

        for model_name_tuple, model_list in list(python_utils.ZIP(
                model_names_and_ids_to_be_fetched_in_batch,
                fetched_batch_models)):
            model_name = model_name_tuple[0]
            actual_model = model_list[0]
            all_models_linked_with_user_settings_model.append(
                (model_name, actual_model)
            )

        for model_name, model in all_models_linked_with_user_settings_model:
            if model is not None:
                user_dates_list.append(
                    (
                        model_name + python_utils.UNICODE('_last_updated'),
                        model.last_updated
                    )
                )
                user_dates_list.append(
                    (
                        model_name + python_utils.UNICODE('_created_on'),
                        model.created_on
                    )
                )
                if model_name == 'UserSubscriptionsModel':
                    user_dates_list.append(
                        (
                            'UserSubscriptionsModel_last_checked',
                            model.last_checked
                        )
                    )
                if model_name == 'ExplorationUserDataModel':
                    user_dates_list.append(
                        (
                            'ExplorationUserDataModel_rated_on',
                            model.rated_on
                        )
                    )
                    user_dates_list.append(
                        (
                            'ExplorationUserDataModel_draft_change_list_last_'
                            'updated',
                            model.draft_change_list_last_updated
                        )
                    )

        filtered_user_dates_list = [
            (attribute_name, date) for attribute_name, date in user_dates_list
            if date is not None
        ]
        model_name, min_date = min(filtered_user_dates_list, key=lambda x: x[1])
        time_delta_for_update = datetime.timedelta(minutes=5)

        # This method for converting date_time_string to datettime object has
        # also been used here:
        # https://github.com/oppia/oppia/blob/d394b6a186acc74b5ec9c3fecc20cc3f1954f441/utils.py#L479
        correction_cutoff_timestamp = datetime.datetime.strptime(
            'Jul 1 2020', '%b %d %Y')
        if user_settings_model.created_on - min_date > time_delta_for_update:
            user_settings_model.update_timestamps(
                update_last_updated_time=False)
            user_settings_model.created_on = min_date
            user_settings_model.put()
            yield (
                'SUCCESS_UPDATED_USING_' + python_utils.UNICODE(model_name), 1)

            # Yield an additional error key for user_models created after
            # cutoff date July 1, 2020 and having a discrepancy in their
            # created_on.
            if min_date >= correction_cutoff_timestamp:
                yield ('ERROR_NOT_UP_TO_DATE_USER', user_id)
        else:
            yield ('SUCCESS_ALREADY_UP_TO_DATE', 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key == 'ERROR_NOT_UP_TO_DATE_USER':
            yield (key, values)
        else:
            yield (key, len(values))


class UserSettingsCreatedOnAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits the value of created_on attribute in the
    UserSettingsModel. This one-off job can be removed after we have verified
    that all UserSettingsModels have their created_on set correctly.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(UserSettingsCreatedOnAuditOneOffJob, cls).enqueue(
            job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        user_id = user_settings_model.id
        user_dates_list = [
            (
                'UserSettingsModel_created_on',
                user_settings_model.created_on
            ),
            (
                'UserSettingsModel_last_updated',
                user_settings_model.last_updated
            ),
            (
                'UserSettingsModel_last_agreed_to_terms',
                user_settings_model.last_agreed_to_terms
            ),
            (
                'UserSettingsModel_last_started_state_editor_tutorial',
                user_settings_model.last_started_state_editor_tutorial
            ),
            (
                'UserSettingsModel_last_started_state_translation_tutorial',
                user_settings_model.last_started_state_translation_tutorial
            ),
            (
                'UserSettingsModel_last_logged_in',
                user_settings_model.last_logged_in
            ),
            (
                'UserSettingsModel_last_edited_an_exploration',
                user_settings_model.last_edited_an_exploration
            ),
            (
                'UserSettingsModel_last_created_an_exploration',
                user_settings_model.last_created_an_exploration
            ),
        ]

        if user_settings_model.first_contribution_msec is not None:
            user_dates_list.append(
                (
                    'UserSettingsModel_first_contribution_msec',
                    datetime.datetime.fromtimestamp(
                        python_utils.divide(
                            user_settings_model.first_contribution_msec, 1000.0)
                    )
                )
            )

        # Models in user storage module having user_id as an attribute.
        exploration_user_data_model = (
            user_models.ExplorationUserDataModel.query(
                user_models.ExplorationUserDataModel.user_id == user_id).get()
        )

        all_models_linked_with_user_settings_model = [
            ('ExplorationUserDataModel', exploration_user_data_model)
        ]

        # Models in user storage module keyed by user_id.
        model_names_and_ids_to_be_fetched_in_batch = [
            ('UserContributionsModel', [user_id]),
            ('UserEmailPreferencesModel', [user_id]),
            ('UserStatsModel', [user_id]),
            ('UserSubscriptionsModel', [user_id]),
        ]
        fetched_batch_models = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                model_names_and_ids_to_be_fetched_in_batch)
        )

        for model_name_tuple, model_list in list(python_utils.ZIP(
                model_names_and_ids_to_be_fetched_in_batch,
                fetched_batch_models)):
            model_name = model_name_tuple[0]
            actual_model = model_list[0]
            all_models_linked_with_user_settings_model.append(
                (model_name, actual_model)
            )

        for model_name, model in all_models_linked_with_user_settings_model:
            if model is not None:
                user_dates_list.append(
                    (
                        model_name + python_utils.UNICODE('_last_updated'),
                        model.last_updated
                    )
                )
                user_dates_list.append(
                    (
                        model_name + python_utils.UNICODE('_created_on'),
                        model.created_on
                    )
                )
                if model_name == 'UserSubscriptionsModel':
                    user_dates_list.append(
                        (
                            'UserSubscriptionsModel_last_checked',
                            model.last_checked
                        )
                    )
                if model_name == 'ExplorationUserDataModel':
                    user_dates_list.append(
                        (
                            'ExplorationUserDataModel_rated_on',
                            model.rated_on
                        )
                    )
                    user_dates_list.append(
                        (
                            'ExplorationUserDataModel_draft_change_list_last_'
                            'updated',
                            model.draft_change_list_last_updated
                        )
                    )

        filtered_user_dates_list = [
            (attribute_name, date) for attribute_name, date in user_dates_list
            if date is not None
        ]
        model_name, min_date = min(filtered_user_dates_list, key=lambda x: x[1])
        time_delta_for_correctness = datetime.timedelta(minutes=5)
        if user_settings_model.created_on - min_date > (
                time_delta_for_correctness):
            yield (
                'ERROR_NEED_TO_UPDATE_USING_' + python_utils.UNICODE(
                    model_name), user_id)
        else:
            yield ('SUCCESS_ALREADY_UP_TO_DATE', 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith('ERROR_NEED_TO_UPDATE_USING'):
            yield (key, values)
        else:
            yield (key, len(values))


class CleanUpUserSubscribersModelOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that cleans up UserSubscribersModel by removing user id if it is
    present in subscriber ids.

    NOTE TO DEVELOPERS: This job can be deleted after it is run in October
    2020 release.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSubscribersModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        if item.id in item.subscriber_ids:
            item.subscriber_ids.remove(item.id)
            item.update_timestamps()
            item.put()
            yield ('Removed user from their own subscribers list', item.id)

    @staticmethod
    def reduce(key, values):
        values.sort()
        yield (key, values)


class CleanUpCollectionProgressModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that cleans up CollectionProgressModel.

    This is done by:
        1. Removing exploration ids which are not a part of the collection.
        2. Creating CompletedActivitiesModel for completed explorations if
        it is missing.
        3. Adding missing exploration ids for completed explorations.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10809 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.CollectionProgressModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(item.user_id))

        if completed_activities_model is None:
            completed_activities_model = (
                user_models.CompletedActivitiesModel(id=item.user_id))
            completed_activities_model.exploration_ids = (
                item.completed_explorations)
            completed_activities_model.update_timestamps()
            completed_activities_model.put()
            yield ('Regenerated Missing CompletedActivitiesModel', item.id)
        else:
            missing_exp_ids = [
                exp_id
                for exp_id in item.completed_explorations if exp_id not in (
                    completed_activities_model.exploration_ids)]
            if missing_exp_ids:
                completed_activities_model.exploration_ids.extend(
                    missing_exp_ids)
                completed_activities_model.update_timestamps()
                completed_activities_model.put()
                yield (
                    'Added missing exp ids in CompletedActivitiesModel',
                    item.id)

        col_model = collection_models.CollectionModel.get_by_id(
            item.collection_id)

        collection_node_ids = [
            node['exploration_id'] for node in (
                col_model.collection_contents['nodes'])]
        exp_ids_to_remove = [
            exp_id
            for exp_id in item.completed_explorations if exp_id not in (
                collection_node_ids)]

        if exp_ids_to_remove:
            item.completed_explorations = [
                exp_id for exp_id in item.completed_explorations
                if exp_id not in exp_ids_to_remove]
            item.update_timestamps()
            item.put()
            yield (
                'Invalid Exploration IDs cleaned from '
                'CollectionProgressModel',
                'Model id: %s, Collection id: %s, Removed exploration '
                'ids: %s' % (
                    item.id, item.collection_id, exp_ids_to_remove))

    @staticmethod
    def reduce(key, values):
        values.sort()
        yield (key, values)


class CleanUpUserContributionsModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that cleans up UserContributionsModel by removing deleted
    explorations from user contribution.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10809 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionsModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        fetched_created_exploration_model_instances = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                [('ExplorationModel', item.created_exploration_ids)]))[0]

        exp_ids_removed = []
        for exp_id, exp_instance in list(python_utils.ZIP(
                copy.deepcopy(item.created_exploration_ids),
                fetched_created_exploration_model_instances)):
            if exp_instance is None or exp_instance.deleted:
                exp_ids_removed.append(exp_id)
                item.created_exploration_ids.remove(exp_id)

        fetched_edited_exploration_model_instances = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                [('ExplorationModel', item.edited_exploration_ids)]))[0]

        for exp_id, exp_instance in list(python_utils.ZIP(
                copy.deepcopy(item.edited_exploration_ids),
                fetched_edited_exploration_model_instances)):
            if exp_instance is None or exp_instance.deleted:
                exp_ids_removed.append(exp_id)
                item.edited_exploration_ids.remove(exp_id)

        if exp_ids_removed:
            item.update_timestamps()
            item.put()
            yield (
                'Removed deleted exp ids from UserContributionsModel',
                'Model id: %s, Removed exploration ids: %s' % (
                    item.id, exp_ids_removed))

    @staticmethod
    def reduce(key, values):
        values.sort()
        yield (key, values)


class ProfilePictureAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that verifies various aspects of profile_picture_data_url in the
    UserSettingsModel.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(ProfilePictureAuditOneOffJob, cls).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(model):  # pylint: disable=too-many-return-statements
        if model.deleted:
            yield ('SUCCESS - DELETED', model.username)
            return

        if model.username is None:
            yield ('SUCCESS - NOT REGISTERED', model.username)
            return

        if model.profile_picture_data_url is None:
            yield ('FAILURE - MISSING PROFILE PICTURE', model.username)
            return

        try:
            profile_picture_binary = utils.convert_png_data_url_to_binary(
                model.profile_picture_data_url)
        except Exception:
            yield ('FAILURE - INVALID PROFILE PICTURE DATA URL', model.username)
            return

        if imghdr.what(None, h=profile_picture_binary) != 'png':
            yield ('FAILURE - PROFILE PICTURE NOT PNG', model.username)
            return

        try:
            # Load the image to retrieve dimensions for later verification.
            height, width = image_services.get_image_dimensions(
                profile_picture_binary)
        except Exception:
            yield ('FAILURE - CANNOT LOAD PROFILE PICTURE', model.username)
            return

        if (
                height != user_services.GRAVATAR_SIZE_PX or
                width != user_services.GRAVATAR_SIZE_PX
        ):
            yield (
                'FAILURE - PROFILE PICTURE NON STANDARD DIMENSIONS - %s,%s' % (
                    height, width
                ),
                model.username
            )
            return

        yield ('SUCCESS', model.username)

    @staticmethod
    def reduce(key, values):
        if key.startswith('SUCCESS'):
            yield (key, len(values))
        else:
            yield (key, values)


class UniqueHashedNormalizedUsernameAuditJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that checks that the hashed normalized usernames are unique."""

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(UniqueHashedNormalizedUsernameAuditJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(model):
        if model.normalized_username is None:
            yield ('SUCCESS USERNAME NONE', 1)
        else:
            yield (
                utils.convert_to_hash(
                    model.normalized_username,
                    user_models.DeletedUsernameModel.ID_LENGTH
                ),
                model.normalized_username
            )

    @staticmethod
    def reduce(key, values):
        if key == 'SUCCESS USERNAME NONE':
            yield (key, len(values))
            return

        if len(values) != 1:
            yield ('FAILURE', values)


class DiscardOldDraftsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that discards any drafts that were last updated in 2019 or prior.

    This is done to avoid issues arising from old schema version
    incompatibility. It is unlikely that such drafts are being used or relied
    on anyway, since they have been abandoned for over a year.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(DiscardOldDraftsOneOffJob, cls).enqueue(job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.ExplorationUserDataModel]

    @staticmethod
    def map(model):
        if model.draft_change_list is None:
            return

        exploration = exp_fetchers.get_exploration_by_id(
            model.exploration_id, strict=False)

        if exploration is None:
            yield ('DISCARDED - Exploration is missing', model.id)
        elif model.draft_change_list_last_updated.timetuple().tm_year <= 2019:
            yield ('DISCARDED - Draft is old', model.id)
        else:
            return

        # Discard the draft.
        model.draft_change_list = None
        model.draft_change_list_last_updated = None
        model.draft_change_list_exp_version = None
        model.update_timestamps()
        model.put()

        yield ('SUCCESS - Discarded draft', 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        if key.startswith('SUCCESS'):
            yield (key, len(values))
        else:
            yield (key, values)


class UserRolesPopulationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that populates the roles and banned fields of the UserSettingsModel.

    It is a one-off job and can be removed from the codebase after May 2021
    release.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(UserRolesPopulationOneOffJob, cls).enqueue(job_id, shard_count=64)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(model_instance):
        user_services.update_roles_and_banned_fields(model_instance)

        model_instance.update_timestamps(update_last_updated_time=False)
        model_instance.put()

        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


class DeleteNonExistentExpsFromUserModelsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that removes explorations that do not exist or that are private from
    completed and incomplete activities models and from user
    subscriptions model.

    This job will only be used in the April 2021 release to fix the errors on
    the prod server. The errors exist because the activity models were not
    properly updated when the explorations were deleted.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(
            DeleteNonExistentExpsFromUserModelsOneOffJob, cls
        ).enqueue(job_id, shard_count=16)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [
            user_models.CompletedActivitiesModel,
            user_models.IncompleteActivitiesModel,
            user_models.UserSubscriptionsModel
        ]

    @staticmethod
    def map(model):
        class_name = model.__class__.__name__
        exploration_ids = model.exploration_ids
        exp_rights_models = exp_models.ExplorationRightsModel.get_multi(
            model.exploration_ids)
        existing_exploration_ids = [
            exp_id for exp_id, exp_rights_model
            in python_utils.ZIP(exploration_ids, exp_rights_models)
            if exp_rights_model is not None
        ]

        changed = False
        if len(existing_exploration_ids) < len(exploration_ids):
            changed = True
            yield ('REMOVED_DELETED_EXPS - %s' % class_name, 1)

        if isinstance(model, (
                user_models.CompletedActivitiesModel,
                user_models.IncompleteActivitiesModel
        )):
            public_exploration_ids = [
                exp_id for exp_id, exp_rights_model
                in python_utils.ZIP(exploration_ids, exp_rights_models)
                if exp_rights_model is not None and
                exp_rights_model.status == constants.ACTIVITY_STATUS_PUBLIC
            ]

            if len(public_exploration_ids) < len(existing_exploration_ids):
                changed = True
                yield ('REMOVED_PRIVATE_EXPS - %s' % class_name, 1)
        else:
            public_exploration_ids = existing_exploration_ids

        if changed:
            model.exploration_ids = public_exploration_ids
            model.update_timestamps(update_last_updated_time=False)
            model.put()

        yield ('SUCCESS - %s' % class_name, 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class DeleteNonExistentExpUserDataOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes exploration user data models that do not have
    existing explorations.

    This job will only be used in the April 2021 release to fix the errors on
    the prod server. The errors exist because the exploration user data models
    were not properly deleted when the explorations were deleted.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(
            DeleteNonExistentExpUserDataOneOffJob, cls
        ).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.ExplorationUserDataModel]

    @staticmethod
    def map(model):
        exp_model = exp_models.ExplorationModel.get(
            model.exploration_id, strict=False)
        if exp_model is None:
            # By using delete_exploration we combine a few things, we delete
            # the ExplorationUserDataModels, also we delete any other models
            # that still exist for the exploration ID, and finally we verify
            # that the delete_exploration works correctly.
            exp_services.delete_exploration(
                feconf.SYSTEM_COMMITTER_ID,
                model.exploration_id,
                force_deletion=True
            )
            yield ('SUCCESS_DELETED_EXPLORATION', 1)
        else:
            yield ('SUCCESS_KEPT', 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class DeleteNonExistentExpUserContributionsOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """Job that removes deleted explorations from UserContributionsModels.

    This job will only be used in the April 2021 release to fix the errors on
    the prod server. The errors exist because the contributions models were not
    properly updated when the explorations were deleted.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        super(
            DeleteNonExistentExpUserContributionsOneOffJob, cls
        ).enqueue(job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserContributionsModel]

    @staticmethod
    def map(model):
        created_exp_models = exp_models.ExplorationModel.get_multi(
            model.created_exploration_ids)
        existing_created_exp_ids = [
            exp_id for exp_id, exp_model
            in python_utils.ZIP(
                model.created_exploration_ids, created_exp_models
            ) if exp_model is not None
        ]

        changed = False
        if len(existing_created_exp_ids) < len(model.created_exploration_ids):
            changed = True
            yield ('REMOVED_CREATED_DELETED_EXPS', 1)

        edited_exp_models = exp_models.ExplorationModel.get_multi(
            model.edited_exploration_ids)
        existing_edited_exp_ids = [
            exp_id for exp_id, exp_model
            in python_utils.ZIP(
                model.edited_exploration_ids, edited_exp_models
            ) if exp_model is not None
        ]

        if len(existing_edited_exp_ids) < len(model.edited_exploration_ids):
            changed = True
            yield ('REMOVED_EDITED_DELETED_EXPS', 1)

        if changed:
            model.created_exploration_ids = existing_created_exp_ids
            model.edited_exploration_ids = existing_edited_exp_ids
            model.update_timestamps(update_last_updated_time=False)
            model.put()

        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))
