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

import copy
import imghdr

from core import jobs
from core.domain import image_services
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
