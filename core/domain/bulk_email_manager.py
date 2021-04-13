# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Functions for handling bulk email preferences."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models

import feconf
import python_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])
platform_bulk_email_services = models.Registry.import_bulk_email_services()


def add_or_update_bulk_email_preference(
        user_email, can_receive_email_updates, email_preferences_model):
    """Adds a new user to the bulk email mailing list as well as enables their
    preference in the passed in UserEmailPreferencesModel object.

    Args:
        user_email: str. The email ID of the user.
        can_receive_email_updates: bool. Whether the given user can receive
            email updates.
        email_preferences_model: UserEmailPreferencesModel. The email
            preferences model of the user. This is not fetched in this function,
            and is passed in, since new users won't have this model, in which
            case the calling function would have to create this model and pass
            it in so that all email preferences stay in sync.

    Raises:
        Exception: Incorrect type for email_preferences_model.

    Returns:
        UserEmailPreferencesModel. Updated email_preferences_model with
            site_updates preference.
    """
    if not isinstance(
        email_preferences_model, user_models.UserEmailPreferencesModel):
        raise Exception(
            'Incorrect type for email_preferences_model. Received %s'
            % email_preferences_model)

    platform_bulk_email_services.add_or_update_user_status(
        user_email, can_receive_email_updates)

    email_preferences_model.site_updates = can_receive_email_updates
    return email_preferences_model


