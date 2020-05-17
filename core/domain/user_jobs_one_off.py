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

from core import jobs
from core.domain import exp_fetchers
from core.domain import rights_manager
from core.domain import subscription_services
from core.domain import user_services
from core.platform import models
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


class UserProfilePictureOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job that updates profile pictures for users which do not
    currently have them. Users who already have profile pictures are
    unaffected.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        """Return a list of datastore class references to map over."""
        return [user_models.UserSettingsModel]

    @staticmethod
    def map(item):
        """Implements the map function for this job."""
        if item.deleted or item.profile_picture_data_url is not None:
            return

        user_services.generate_initial_profile_picture(item.id)


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
