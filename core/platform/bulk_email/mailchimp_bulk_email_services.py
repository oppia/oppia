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

"""Services for handling mailchimp API calls."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from mailchimp3 import MailChimp
from mailchimp3.mailchimpclient import MailChimpError

import feconf
import hashlib
import python_utils


def _get_subscriber_hash(email):
    """Returns Mailchimp subscriber hash from email.

    Args:
        email: str. The email ID of the user.

    Raises:
        Exception. Invalid type for email. Expecetd string.

    Returns:
        str. The subscriber hash corresponding to input email.
    """
    if not isinstance(email, python_utils.BASESTRING):
        raise Exception(
            'Invalid type for email. Expected string, received %s' % email)
    md5_hash = hashlib.md5()
    md5_hash.update(email)
    return md5_hash.hexdigest()


def _get_mailchimp_class():
    """Returns the mailchimp api class. This is separated into a separate
    function to facilitate testing.

    NOTE: No other functionalities should be added to this function.

    Raises:
        Exception: Mailchimp API key is not available.
        Exception: Mailchimp username is not set.
    """
    if not feconf.MAILCHIMP_API_KEY:
        raise Exception('Mailchimp API key is not available.')

    if not feconf.MAILCHIMP_USERNAME:
        raise Exception('Mailchimp username is not set.')

    return MailChimp(
        mc_api=feconf.MAILCHIMP_API_KEY, mc_user=feconf.MAILCHIMP_USERNAME)


def permanently_delete_user_from_list(user_email):
    """Permanently deletes user from mailchimp list.

    NOTE: This should only be called from the wipeout service since once a user
    is permanently deleted from mailchimp, they cannot be programmatically added
    back via their API (the user would have to manually resubscribe back).

    Args:
        user_email: str. Email id of the user.
    """
    client = _get_mailchimp_class()
    subscriber_hash = _get_subscriber_hash(user_email)

    try:
        member_details = client.lists.members.get(
            list_id=feconf.MAILCHIMP_AUDIENCE_ID,
            subscriber_hash=subscriber_hash)
        client.lists.members.delete_permanent(
            list_id=feconf.MAILCHIMP_AUDIENCE_ID,
            subscriber_hash=subscriber_hash)
    except MailChimpError as error:
        # Ignore if the error corresponds to "User does not exist"
        if error[0]['status'] != 404:
            raise Exception(error[0]['detail'])


def add_or_update_user_status(user_email, can_receive_email_updates):
    """Subscribes/unsubscribes an existing user or creates a new user with
    correct status in the mailchimp DB.

    Args:
        user_email: str. Email id of the user.
        can_receive_email_updates: bool. Whether they want to be subscribed to
            list or not.
    """
    client = _get_mailchimp_class()
    subscriber_hash = _get_subscriber_hash(user_email)

    subscribed_mailchimp_data = {
        'email_address': user_email,
        'status': 'subscribed'
    }

    unsubscribed_mailchimp_data = {
        'email_address': user_email,
        'status': 'unsubscribed'
    }

    try:
        member_details = client.lists.members.get(
            list_id=feconf.MAILCHIMP_AUDIENCE_ID,
            subscriber_hash=subscriber_hash)

        # If member is already added to mailchimp list, we cannot permanently
        # delete a list member, since they cannot be programmatically added
        # back, so we change their status based on preference.
        if (
            can_receive_email_updates and
            member_details['status'] != 'subscribed'):
            client.lists.members.update(
                list_id=feconf.MAILCHIMP_AUDIENCE_ID,
                subscriber_hash=subscriber_hash,
                data=subscribed_mailchimp_data)
        elif (
            not can_receive_email_updates and
            member_details['status'] == 'subscribed'):
            client.lists.members.update(
                list_id=feconf.MAILCHIMP_AUDIENCE_ID,
                subscriber_hash=subscriber_hash,
                data=unsubscribed_mailchimp_data)

    except MailChimpError as error:
        # Error 404 corresponds to "User does not exist".
        if error[0]['status'] == 404:
            if can_receive_email_updates:
                client.lists.members.create(
                    list_id=feconf.MAILCHIMP_AUDIENCE_ID,
                    data=subscribed_mailchimp_data)
        else:
            raise Exception(error[0]['detail'])