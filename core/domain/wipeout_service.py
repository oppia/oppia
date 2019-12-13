# coding: utf-8
#
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

"""Services for user data."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import collection_services
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import skill_services
from core.domain import topic_services
from core.domain import user_services
from core.platform import models

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()


def _activity_should_be_deleted(activity_summary, user_id):
    """Return if activity should be deleted, thus if it is private and the user
    is the sole owner of the activity.

    Args:
        activity_summary: ExplorationSummary|CollectionSummary. The activity
            summary.
        user_id: str. The id of the user to be deleted.

    Returns:
        bool. Whether the activity should be deleted.
    """
    return (
        activity_summary.status == constants.ACTIVITY_STATUS_PRIVATE and
        user_id in activity_summary.owner_ids and
        len(activity_summary.owner_ids) == 1
    )


def _topic_should_be_deleted(topic_rights, user_id):
    """Return if topic should be deleted, thus if it is not published and
    the user is the sole owner of the topic.

    Args:
        topic_rights: TopicRights. The topic rights.
        user_id: str. The id of the user to be deleted.

    Returns:
        bool. Whether the topic should be deleted.
    """
    return (
        not topic_rights.topic_is_published and
        topic_rights.is_manager(user_id) and
        len(topic_rights.manager_ids) == 1
    )


def pre_delete_user(user_id):
    """Prepare user for the full deletion

        Args:
            user_id: str. The id of the user to be deleted.
        """
    subscribed_exploration_summaries = (
        exp_fetchers.get_exploration_summaries_subscribed_to(user_id))
    explorations_to_be_deleted_ids = [
        exp_summary.id for exp_summary in subscribed_exploration_summaries
        if _activity_should_be_deleted(exp_summary, user_id)]
    for exp_id in explorations_to_be_deleted_ids:
        exp_services.delete_exploration(user_id, exp_id)

    subscribed_collection_summaries = (
        collection_services.get_collection_summaries_subscribed_to(user_id))
    collections_to_be_deleted_ids = [
        col_summary.id for col_summary in subscribed_collection_summaries
        if _activity_should_be_deleted(col_summary, user_id)]
    for col_id in collections_to_be_deleted_ids:
        collection_services.delete_collection(user_id, col_id)

    skills_to_be_deleted_ids = [
        skill_rights.id for skill_rights in (
            skill_services.get_unpublished_skill_rights_by_creator(user_id))]
    for skill_id in skills_to_be_deleted_ids:
        skill_services.delete_skill(user_id, skill_id)

    user_topics_rights = [
        topic_rights for topic_rights in (
            topic_services.get_topic_rights_with_user(user_id))]
    topics_to_be_deleted_ids = [
        topic_rights.id for topic_rights in user_topics_rights
        if _topic_should_be_deleted(topic_rights, user_id)]
    for topic_id in topics_to_be_deleted_ids:
        topic_services.delete_topic(user_id, topic_id)

    # Set all the user's email preferences to False in order to disable all
    # ordinary emails that could be send to the users.
    user_services.update_email_preferences(user_id, False, False, False, False)

    user_services.set_user_to_be_deleted(
        user_id,
        explorations_to_be_deleted_ids,
        collections_to_be_deleted_ids,
        skills_to_be_deleted_ids,
        topics_to_be_deleted_ids
    )
