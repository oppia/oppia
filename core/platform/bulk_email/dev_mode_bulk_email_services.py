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

"""Services for handling bulk email calls in DEV MODE."""

from __future__ import annotations

import logging

from typing import Dict


def permanently_delete_user_from_list(user_email: str) -> None:
    """Logs that the delete request was sent.

    Args:
        user_email: str. Email id of the user.
    """
    logging.info(
        'Email ID %s permanently deleted from bulk email provider\'s db. '
        'Cannot access API, since this is a dev environment' % user_email)


def add_or_update_user_status(
    user_email: str,
    unused_merge_fields: Dict[str, str],
    unused_tag: str,
    *,
    can_receive_email_updates: bool
) -> bool:
    """Subscribes/unsubscribes an existing user or creates a new user with
    correct status in the mailchimp DB.

    Args:
        user_email: str. Email id of the user.
        can_receive_email_updates: bool. Whether they want to be subscribed to
            list or not.
        unused_merge_fields: dict. Additional 'merge fields' used by mailchimp
            for adding extra information for each user. The format is
            { 'KEY': value } where the key is defined in the mailchimp
            dashboard.
        unused_tag: str. Tag to add to user in mailchimp.

    Returns:
        bool. True to mock successful user creation.
    """
    logging.info(
        'Updated status of email ID %s\'s bulk email preference in the service '
        'provider\'s db to %s. Cannot access API, since this is a dev '
        'environment.' % (user_email, can_receive_email_updates))
    return True
