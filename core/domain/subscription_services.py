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

"""Services for managing subscriptions."""

__author__ = 'Sean Lip'

import datetime

from core.platform import models
(user_models,) = models.Registry.import_models([
    models.NAMES.user
])
import utils


def subscribe_to_thread(user_id, feedback_thread_id):
    """Subscribes a user to a feedback thread.

    Callers of this function should ensure that the user_id and
    feedback_thread_id are valid.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    if (feedback_thread_id not in
            subscriptions_model.feedback_thread_ids):
        subscriptions_model.feedback_thread_ids.append(
            feedback_thread_id)
        subscriptions_model.put()


def subscribe_to_exploration(user_id, exploration_id):
    """Subscribes a user to an exploration (and, therefore, indirectly to all
    feedback threads for that exploration).

    Callers of this function should ensure that the user_id and exploration_id
    are valid.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    if exploration_id not in subscriptions_model.activity_ids:
        subscriptions_model.activity_ids.append(exploration_id)
        subscriptions_model.put()


def get_exploration_ids_subscribed_to(user_id):
    """Returns a list with ids of all explorations that the given user
    subscribes to.

    Callers of this function should ensure that the user_id is valid.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    return (
        subscriptions_model.activity_ids
        if subscriptions_model else [])


def subscribe_to_collection(user_id, collection_id):
    """Subscribes a user to a collection.

    Callers of this function should ensure that the user_id and collection_id
    are valid.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    if collection_id not in subscriptions_model.collection_ids:
        subscriptions_model.collection_ids.append(collection_id)
        subscriptions_model.put()


def get_collection_ids_subscribed_to(user_id):
    """Returns a list with ids of all collections that the given user
    subscribes to.

    Callers of this function should ensure that the user_id is valid.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    return (
        subscriptions_model.collection_ids
        if subscriptions_model else [])


def get_last_seen_notifications_msec(user_id):
    """Returns the last time, in milliseconds since the Epoch, when the user
    checked their notifications in the dashboard page or the notifications
    dropdown.

    If the user has never checked the dashboard page or the notifications
    dropdown, returns None.
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    return (
        utils.get_time_in_millisecs(subscriptions_model.last_checked)
        if (subscriptions_model and subscriptions_model.last_checked)
        else None)


def record_user_has_seen_notifications(user_id, last_seen_msecs):
    """Updates the last_checked time for this user (which represents the time
    the user last saw the notifications in the dashboard page or the
    notifications dropdown).
    """
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    subscriptions_model.last_checked = datetime.datetime.utcfromtimestamp(
        last_seen_msecs / 1000.0)
    subscriptions_model.put()
