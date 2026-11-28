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

from __future__ import annotations

from core.domain import user_domain
from core.platform import models

from typing import List, Sequence

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


def get_user_subscriptions_from_model(
    user_subscriptions_model: user_models.UserSubscriptionsModel,
) -> user_domain.UserSubscriptions:
    """Returns the UserSubscriptions domain object corresponding to the given
    UserSubscriptionsModel.

    Args:
        user_subscriptions_model: UserSubscriptionsModel. The user
            subscriptions model loaded from the datastore.

    Returns:
        UserSubscriptions. The corresponding domain object.
    """
    # The lists are copied so that changing the domain object does not also
    # change the (possibly cached) datastore model before it is saved.
    return user_domain.UserSubscriptions(
        user_subscriptions_model.id,
        list(user_subscriptions_model.exploration_ids),
        list(user_subscriptions_model.collection_ids),
        list(user_subscriptions_model.general_feedback_thread_ids),
        list(user_subscriptions_model.creator_ids),
        user_subscriptions_model.last_checked,
    )


def get_user_subscriptions(
    user_id: str, strict: bool = False
) -> user_domain.UserSubscriptions:
    """Returns the subscriptions of the given user.

    Args:
        user_id: str. The user ID.
        strict: bool. Whether to raise an error if the user has no
            subscriptions stored in the datastore. If False, an empty
            UserSubscriptions object is returned in that case.

    Returns:
        UserSubscriptions. The subscriptions of the given user.
    """
    user_subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=strict
    )
    if user_subscriptions_model is None:
        return user_domain.UserSubscriptions(user_id, [], [], [], [], None)
    return get_user_subscriptions_from_model(user_subscriptions_model)


def get_user_subscriptions_with_exploration_ids(
    exploration_ids: List[str],
) -> List[user_domain.UserSubscriptions]:
    """Returns the subscriptions of all users who subscribe to at least one
    of the given explorations.

    Args:
        exploration_ids: list(str). The exploration IDs. This must not be
            empty.

    Returns:
        list(UserSubscriptions). The subscriptions of the matching users.
    """
    user_subscriptions_models: Sequence[user_models.UserSubscriptionsModel] = (
        user_models.UserSubscriptionsModel.query(
            user_models.UserSubscriptionsModel.exploration_ids.IN(
                exploration_ids
            )
        ).fetch()
    )
    return [
        get_user_subscriptions_from_model(user_subscriptions_model)
        for user_subscriptions_model in user_subscriptions_models
    ]


def save_user_subscriptions(
    user_subscriptions: user_domain.UserSubscriptions,
) -> None:
    """Validates the given UserSubscriptions object and saves it to the
    datastore.

    Args:
        user_subscriptions: UserSubscriptions. The subscriptions to save.

    Raises:
        ValidationError. The subscriptions are invalid.
    """
    save_multiple_user_subscriptions([user_subscriptions])


def save_multiple_user_subscriptions(
    user_subscriptions_list: List[user_domain.UserSubscriptions],
) -> None:
    """Validates the given UserSubscriptions objects and saves them to the
    datastore. Nothing is saved if any of them is invalid.

    Args:
        user_subscriptions_list: list(UserSubscriptions). The subscriptions
            to save.

    Raises:
        ValidationError. One or more of the subscriptions are invalid.
    """
    for user_subscriptions in user_subscriptions_list:
        user_subscriptions.validate()

    # Deleted models are included so that saving keeps their deleted flag,
    # as the previous model-level code did, instead of overwriting them.
    existing_models = user_models.UserSubscriptionsModel.get_multi(
        [
            user_subscriptions.user_id
            for user_subscriptions in user_subscriptions_list
        ],
        include_deleted=True,
    )
    models_to_put = []
    for user_subscriptions, user_subscriptions_model in zip(
        user_subscriptions_list, existing_models
    ):
        if user_subscriptions_model is None:
            user_subscriptions_model = user_models.UserSubscriptionsModel(
                id=user_subscriptions.user_id
            )
        user_subscriptions_model.populate(**user_subscriptions.to_dict())
        models_to_put.append(user_subscriptions_model)

    user_models.UserSubscriptionsModel.update_timestamps_multi(models_to_put)
    user_models.UserSubscriptionsModel.put_multi(models_to_put)


def subscribe_to_thread(user_id: str, feedback_thread_id: str) -> None:
    """Subscribes a user to a feedback thread.

    WARNING: Callers of this function should ensure that the user_id and
    feedback_thread_id are valid.

    Args:
        user_id: str. The user ID of the new subscriber.
        feedback_thread_id: str. The ID of the feedback thread.
    """
    subscribe_to_threads(user_id, [feedback_thread_id])


def subscribe_to_threads(user_id: str, feedback_thread_ids: List[str]) -> None:
    """Subscribes a user to feedback threads.

    WARNING: Callers of this function should ensure that the user_id and
    the feedback_thread_ids are valid.

    Args:
        user_id: str. The user ID of the new subscriber.
        feedback_thread_ids: list(str). The IDs of the feedback threads.
    """
    user_subscriptions = get_user_subscriptions(user_id)
    user_subscriptions.add_feedback_thread_ids(feedback_thread_ids)
    save_user_subscriptions(user_subscriptions)


def subscribe_to_exploration(user_id: str, exploration_id: str) -> None:
    """Subscribes a user to an exploration (and, therefore, indirectly to all
    feedback threads for that exploration).

    WARNING: Callers of this function should ensure that the user_id and
    exploration_id are valid.

    Args:
        user_id: str. The user ID of the new subscriber.
        exploration_id: str. The exploration ID.
    """
    user_subscriptions = get_user_subscriptions(user_id)
    if exploration_id not in user_subscriptions.exploration_ids:
        user_subscriptions.add_exploration_id(exploration_id)
        save_user_subscriptions(user_subscriptions)


def subscribe_to_creator(user_id: str, creator_id: str) -> None:
    """Subscribes a user (learner) to a creator.

    WARNING: Callers of this function should ensure that the user_id and
    creator_id are valid.

    Args:
        user_id: str. The user ID of the new subscriber.
        creator_id: str. The user ID of the creator.

    Raises:
        Exception. The user ID of the new subscriber is same as the
            user ID of the creator.
    """
    if user_id == creator_id:
        raise Exception('User %s is not allowed to self subscribe.' % user_id)
    subscribers_model_creator = user_models.UserSubscribersModel.get(
        creator_id, strict=False
    )
    user_subscriptions = get_user_subscriptions(user_id)

    if not subscribers_model_creator:
        subscribers_model_creator = user_models.UserSubscribersModel(
            id=creator_id
        )

    if user_id not in subscribers_model_creator.subscriber_ids:
        subscribers_model_creator.subscriber_ids.append(user_id)
        user_subscriptions.add_creator_id(creator_id)
        # The user's subscriptions are saved first because saving validates
        # them, so an invalid change is caught before anything is written.
        save_user_subscriptions(user_subscriptions)
        subscribers_model_creator.update_timestamps()
        subscribers_model_creator.put()


def unsubscribe_from_creator(user_id: str, creator_id: str) -> None:
    """Unsubscribe a user from a creator.

    WARNING: Callers of this function should ensure that the user_id and
    creator_id are valid.

    Args:
        user_id: str. The user ID of the subscriber.
        creator_id: str. The user ID of the creator.
    """
    subscribers_model_creator = user_models.UserSubscribersModel.get(creator_id)
    user_subscriptions = get_user_subscriptions(user_id, strict=True)

    if user_id in subscribers_model_creator.subscriber_ids:
        subscribers_model_creator.subscriber_ids.remove(user_id)
        user_subscriptions.remove_creator_id(creator_id)
        save_user_subscriptions(user_subscriptions)
        subscribers_model_creator.update_timestamps()
        subscribers_model_creator.put()


def get_all_creators_subscribed_to(user_id: str) -> List[str]:
    """Returns a list with ids of all the creators to which this learner has
    subscribed.

    WARNING: Callers of this function should ensure that the user_id is valid.

    Args:
        user_id: str. The user ID of the subscriber.

    Returns:
        list(str). IDs of all the creators to which this learner has
        subscribed.
    """
    return get_user_subscriptions(user_id).creator_ids


def get_all_subscribers_of_creator(user_id: str) -> List[str]:
    """Returns a list with ids of all users who have subscribed to this
    creator.

    WARNING: Callers of this function should ensure that the user_id is valid.

    Args:
        user_id: str. The user ID of the subscriber.

    Returns:
        list(str). IDs of all users who have subscribed to this creator.
    """
    subscribers_model = user_models.UserSubscribersModel.get(
        user_id, strict=False
    )
    # TODO(#15621): The explicit declaration of type for ndb properties should
    # be removed. Currently, these ndb properties are annotated with Any return
    # type. Once we have proper return type we can remove this.
    if subscribers_model:
        subscriber_ids: List[str] = subscribers_model.subscriber_ids
        return subscriber_ids
    else:
        return []


def get_exploration_ids_subscribed_to(user_id: str) -> List[str]:
    """Returns a list with ids of all explorations that the given user
    subscribes to.

    WARNING: Callers of this function should ensure that the user_id is valid.

    Args:
        user_id: str. The user ID of the subscriber.

    Returns:
        list(str). IDs of all explorations that the given user
        subscribes to.
    """
    return get_user_subscriptions(user_id).exploration_ids


def subscribe_to_collection(user_id: str, collection_id: str) -> None:
    """Subscribes a user to a collection.

    WARNING: Callers of this function should ensure that the user_id and
    collection_id are valid.

    Args:
        user_id: str. The user ID of the new subscriber.
        collection_id: str. The collection ID.
    """
    user_subscriptions = get_user_subscriptions(user_id)
    if collection_id not in user_subscriptions.collection_ids:
        user_subscriptions.add_collection_id(collection_id)
        save_user_subscriptions(user_subscriptions)


def get_collection_ids_subscribed_to(user_id: str) -> List[str]:
    """Returns a list with ids of all collections that the given user
    subscribes to.

    WARNING: Callers of this function should ensure that the user_id is valid.

    Args:
        user_id: str. The user ID of the subscriber.

    Returns:
        list(str). IDs of all collections that the given user
        subscribes to.
    """
    return get_user_subscriptions(user_id).collection_ids
