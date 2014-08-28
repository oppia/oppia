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

from core.platform import models
(user_models,) = models.Registry.import_models([
    models.NAMES.user
])


def subscribe_to_thread(user_id, feedback_thread_id):
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    if (feedback_thread_id not in
            subscriptions_model.feedback_thread_ids):
        subscriptions_model.feedback_thread_ids.append(
            feedback_thread_id)
        subscriptions_model.put()


def subscribe_to_activity(user_id, activity_id):
    subscriptions_model = user_models.UserSubscriptionsModel.get(
        user_id, strict=False)
    if not subscriptions_model:
        subscriptions_model = user_models.UserSubscriptionsModel(id=user_id)

    if (activity_id not in
            subscriptions_model.activity_ids):
        subscriptions_model.activity_ids.append(activity_id)
        subscriptions_model.put()
