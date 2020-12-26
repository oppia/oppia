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

from core import jobs
from core.domain import exp_fetchers
from core.domain import image_services
from core.domain import rights_manager
from core.domain import subscription_services
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


class CleanupActivityIdsFromUserSubscriptionsModelOneOffJob(
        jobs.BaseMapReduceOneOffJobManager):
    """One off job that removes nonexisting activity ids from
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
                    [('ExplorationModel', model_instance.activity_ids)]))[0]

            exp_ids_removed = []
            for exp_id, exp_instance in list(python_utils.ZIP(
                    model_instance.activity_ids,
                    fetched_exploration_model_instances)):
                if exp_instance is None or exp_instance.deleted:
                    exp_ids_removed.append(exp_id)
                    model_instance.activity_ids.remove(exp_id)
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


class RemoveGaeUserIdOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes the gae_user_id from the UserSettingsModel."""

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        # This is the only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'gae_user_id' in user_settings_model._properties:  # pylint: disable=protected-access
            del user_settings_model._properties['gae_user_id']  # pylint: disable=protected-access
            if 'gae_user_id' in user_settings_model._values:  # pylint: disable=protected-access
                del user_settings_model._values['gae_user_id']  # pylint: disable=protected-access
            user_settings_model.update_timestamps(
                update_last_updated_time=False)
            user_settings_model.put()
            yield (
                'SUCCESS_REMOVED - UserSettingsModel', user_settings_model.id)
        else:
            yield (
                'SUCCESS_ALREADY_REMOVED - UserSettingsModel',
                user_settings_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class RemoveGaeIdOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that deletes the gae_id from the UserSettingsModel.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(user_settings_model):
        # This is the only way to remove the field from the model,
        # see https://stackoverflow.com/a/15116016/3688189 and
        # https://stackoverflow.com/a/12701172/3688189.
        if 'gae_id' in user_settings_model._properties:  # pylint: disable=protected-access
            del user_settings_model._properties['gae_id']  # pylint: disable=protected-access
            if 'gae_id' in user_settings_model._values:  # pylint: disable=protected-access
                del user_settings_model._values['gae_id']  # pylint: disable=protected-access
            user_settings_model.update_timestamps(
                update_last_updated_time=False)
            user_settings_model.put()
            yield (
                'SUCCESS_REMOVED - UserSettingsModel', user_settings_model.id)
        else:
            yield (
                'SUCCESS_ALREADY_REMOVED - UserSettingsModel',
                user_settings_model.id)

    @staticmethod
    def reduce(key, values):
        """Implements the reduce function for this job."""
        yield (key, len(values))


class FixUserSettingsCreatedOnOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits timestamp attributes of user models to fix the invalid
    values of created_on attribute in the UserSettingsModel.
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
            (
                'UserSettingsModel_first_contribution_msec',
                user_settings_model.first_contribution_msec
            ),
        ]

        # Models in user storage module having user_id as an attribute.
        collection_progress_model = (
            user_models.CollectionProgressModel.query(
                user_models.CollectionProgressModel.user_id == user_id).get()
        )
        exp_user_last_playthrough_model = (
            user_models.ExpUserLastPlaythroughModel.query(
                user_models.ExpUserLastPlaythroughModel.user_id == user_id
            ).get()
        )
        story_progress_model = (
            user_models.StoryProgressModel.query(
                user_models.StoryProgressModel.user_id == user_id).get()
        )
        user_contribution_proficiency_model = (
            user_models.UserContributionProficiencyModel.query(
                user_models.UserContributionProficiencyModel.user_id == user_id
            ).get()
        )
        user_identifiers_model = (
            user_models.UserIdentifiersModel.query(
                user_models.UserIdentifiersModel.user_id == user_id).get()
        )
        user_skill_mastery_model = (
            user_models.UserSkillMasteryModel.query(
                user_models.UserSkillMasteryModel.user_id == user_id).get()
        )
        exploration_user_data_model = (
            user_models.ExplorationUserDataModel.query(
                user_models.ExplorationUserDataModel.user_id == user_id).get()
        )

        all_models_linked_with_user_settings_model = [
            ('CollectionProgressModel', collection_progress_model),
            ('ExpUserLastPlaythroughModel', exp_user_last_playthrough_model),
            ('StoryProgressModel', story_progress_model),
            ('UserContributionProficiencyModel', (
                user_contribution_proficiency_model)),
            ('UserIdentifiersModel', user_identifiers_model),
            ('UserSkillMasteryModel', user_skill_mastery_model),
            ('ExplorationUserDataModel', exploration_user_data_model)
        ]

        # Models in user storage module keyed by user_id itself.
        model_names_and_ids_to_be_fetched_in_batch = [
            ('CompletedActivitiesModel', [user_id]),
            ('IncompleteActivitiesModel', [user_id]),
            ('LearnerPlaylistModel', [user_id]),
            ('PendingDeletionRequestModel', [user_id]),
            ('UserAuthDetailsModel', [user_id]),
            ('UserBulkEmailsModel', [user_id]),
            ('UserContributionsModel', [user_id]),
            ('UserContributionRightsModel', [user_id]),
            ('UserEmailPreferencesModel', [user_id]),
            ('UserRecentChangesBatchModel', [user_id]),
            ('UserStatsModel', [user_id]),
            ('UserSubscribersModel', [user_id]),
            ('UserSubscriptionsModel', [user_id]),
        ]
        fetched_batch_models = (
            datastore_services.fetch_multiple_entities_by_ids_and_models(
                model_names_and_ids_to_be_fetched_in_batch)
        )

        for model_name_tuple, model_list in python_utils.ZIP(
                model_names_and_ids_to_be_fetched_in_batch,
                fetched_batch_models
            ):
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

        attribute_name, min_date = min(
            filtered_user_dates_list, key=lambda x: x[1])
        time_delta = datetime.timedelta(
            minutes=feconf.CREATED_ON_TIME_DELTA_MINUTES)
        correction_cutoff_timestamp = datetime.datetime.strptime(
            'Jul 1 2020', '%b %d %Y')
        if user_settings_model.created_on - min_date > time_delta:
            yield (
                'UPDATE_USING_' + python_utils.UNICODE(attribute_name), 1)

            # Yield an additional error key for user_models created after
            # feconf.CREATED_ON_CORRECTION_CUTOFF_DATE having a discrepancy in
            # their created_on.
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


class UserAuthDetailsModelAuditOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that audits whether there are UserAuthDetailsModels with the same
    gae_id field.
    """

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(UserAuthDetailsModelAuditOneOffJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserAuthDetailsModel]

    @staticmethod
    def map(model):
        number_of_models_with_same_gae_id = (
            user_models.UserAuthDetailsModel.query(
                user_models.UserAuthDetailsModel.gae_id == model.gae_id
            ).count()
        )

        if number_of_models_with_same_gae_id > 1:
            yield ('FAILURE', model.id)
        else:
            yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        if key.startswith('SUCCESS'):
            yield (key, len(values))
        else:
            yield (key, values)


class GenerateUserIdentifiersModelOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """Job that creates UserIdentifiersModel for each UserAuthDetailsModel."""

    @classmethod
    def enqueue(cls, job_id, additional_job_params=None):
        # We can raise the number of shards for this job, since it goes only
        # over one type of entity class.
        super(GenerateUserIdentifiersModelOneOffJob, cls).enqueue(
            job_id, shard_count=32)

    @classmethod
    def entity_classes_to_map_over(cls):
        return [user_models.UserAuthDetailsModel]

    @staticmethod
    def map(model):
        user_models.UserIdentifiersModel(
            id=model.gae_id,
            user_id=model.id,
            deleted=model.deleted
        ).put()
        yield ('SUCCESS', 1)

    @staticmethod
    def reduce(key, values):
        yield (key, len(values))


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
