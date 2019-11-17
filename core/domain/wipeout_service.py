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

from core.platform import models

current_user_services = models.Registry.import_current_user_services()
(user_models,) = models.Registry.import_models([models.NAMES.user])
transaction_services = models.Registry.import_transaction_services()


def remove_user_account(user_id):
    transaction_services.run_in_transaction(pre_deletion, user_id)


def pre_deletion(user_id):
    user_settings_model = user_models.UserSettingsModel.get_by_id(user_id)
    if not user_settings_model:
        raise Exception('User settings does not exist.')
    if user_settings_model.to_be_removed:
        return
    user_settings_model.to_be_removed = True
    user_settings_model.put()

    user_email_preferences_model = (
        user_models.UserEmailPreferencesModel.get_by_id(user_id))
    if not user_email_preferences_model:
        raise Exception('User email preferences does not exist.')
    user_email_preferences_model.deleted = True

    user_subscription_model = (
        user_models.UserSubscriptionsModel.get_by_id(user_id))
    if not user_subscription_model:
        raise Exception('User subscription does not exist.')
    user_subscription_model.deleted = True
