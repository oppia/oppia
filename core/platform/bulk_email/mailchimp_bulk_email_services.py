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

import ast
import hashlib

import feconf
import mailchimp3
from mailchimp3 import mailchimpclient

import python_utils


def _get_subscriber_hash(email):
    """Returns Mailchimp subscriber hash from email.

    Args:
        email: str. The email of the user.

    Returns:
        str. The subscriber hash corresponding to the input email.

    Raises:
        Exception. Invalid type for email, expected string.
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

    Returns:
        Mailchimp. A mailchimp class instance with the API key and username
        initialized.

    Raises:
        Exception. Mailchimp API key is not available.
        Exception. Mailchimp username is not set.
    """
    if not feconf.MAILCHIMP_API_KEY:
        raise Exception('Mailchimp API key is not available.')

    if not feconf.MAILCHIMP_USERNAME:
        raise Exception('Mailchimp username is not set.')

    # The following is a class initialized in the library with the API key and
    # username and hence cannot be tested directly. The mailchimp functions are
    # tested with a mock class.
    return mailchimp3.MailChimp(    # pragma: no cover
        mc_api=feconf.MAILCHIMP_API_KEY, mc_user=feconf.MAILCHIMP_USERNAME)


def _create_user_in_mailchimp_db(user_email):
    """Creates a new user in the mailchimp database and handles the case where
    the user was permanently deleted from the database.

    Args:
        user_email: str. Email ID of the user. Email is used to uniquely
            identify the user in the mailchimp DB.

    Returns:
        bool. Whether the user was successfully added to the db. (This will be
        False if the user was permanently deleted earlier and therefore cannot
        be added back.)

    Raises:
        Exception. Any error (other than the one mentioned below) raised by the
            mailchimp API.
    """
    post_data = {
        'email_address': user_email,
        'status': 'subscribed'
    }
    client = _get_mailchimp_class()

    try:
        client.lists.members.create(feconf.MAILCHIMP_AUDIENCE_ID, post_data)
    except mailchimpclient.MailChimpError as error:
        error_message = ast.literal_eval(python_utils.UNICODE(error))
        # This is the specific error message returned for the case where the
        # user was permanently deleted from the Mailchimp database earlier.
        # This was found by experimenting with the MailChimp API. Note that the
        # error reference
        # (https://mailchimp.com/developer/marketing/docs/errors/) is not
        # comprehensive, since, under status 400, they only list a subset of the
        # common error titles.
        if error_message['title'] == 'Forgotten Email Not Subscribed':
            return False
        raise Exception(error_message['detail'])
    return True


def permanently_delete_user_from_list(user_email):
    """Permanently deletes the user with the given email from the Mailchimp
    list.

    NOTE TO DEVELOPERS: This should only be called from the wipeout service
    since once a user is permanently deleted from mailchimp, they cannot be
    programmatically added back via their API (the user would have to manually
    resubscribe back).

    Args:
        user_email: str. Email ID of the user. Email is used to uniquely
            identify the user in the mailchimp DB.

    Raises:
        Exception. Any error raised by the mailchimp API.
    """
    client = _get_mailchimp_class()
    subscriber_hash = _get_subscriber_hash(user_email)

    try:
        client.lists.members.get(
            feconf.MAILCHIMP_AUDIENCE_ID, subscriber_hash)
        client.lists.members.delete_permanent(
            feconf.MAILCHIMP_AUDIENCE_ID, subscriber_hash)
    except mailchimpclient.MailChimpError as error:
        # This has to be done since the message can only be accessed from
        # MailChimpError by error.message in Python2, but this is deprecated in
        # Python3.
        # In Python3, the message can be accessed directly by KeyError
        # (https://github.com/VingtCinq/python-mailchimp/pull/65), so as a
        # workaround for Python2, the 'message' attribute is obtained by
        # str() and then it is converted to dict. This works in Python3 as well.
        error_message = ast.literal_eval(python_utils.UNICODE(error))
        # Ignore if the error corresponds to "User does not exist".
        if error_message['status'] != 404:
            raise Exception(error_message['detail'])


def add_or_update_user_status(user_email, can_receive_email_updates):
    """Subscribes/unsubscribes an existing user or creates a new user with
    correct status in the mailchimp DB.

    NOTE: Callers should ensure that the user's corresponding
    UserEmailPreferencesModel.site_updates field is kept in sync.

    Args:
        user_email: str. Email ID of the user. Email is used to uniquely
            identify the user in the mailchimp DB.
        can_receive_email_updates: bool. Whether they want to be subscribed to
            the bulk email list or not.

    Returns:
        bool. Whether the user was successfully added to the db. (This will be
        False if the user was permanently deleted earlier and therefore cannot
        be added back.)

    Raises:
        Exception. Any error (other than the case where the user was permanently
            deleted earlier) raised by the mailchimp API.
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
            feconf.MAILCHIMP_AUDIENCE_ID, subscriber_hash)

        # If member is already added to mailchimp list, we cannot permanently
        # delete a list member, since they cannot be programmatically added
        # back, so we change their status based on preference.
        if (
                can_receive_email_updates and
                member_details['status'] != 'subscribed'):
            client.lists.members.update(
                feconf.MAILCHIMP_AUDIENCE_ID, subscriber_hash,
                subscribed_mailchimp_data)
        elif (
                not can_receive_email_updates and
                member_details['status'] == 'subscribed'):
            client.lists.members.update(
                feconf.MAILCHIMP_AUDIENCE_ID, subscriber_hash,
                unsubscribed_mailchimp_data)

    except mailchimpclient.MailChimpError as error:
        # This has to be done since the message can only be accessed from
        # MailChimpError by error.message in Python2, but this is deprecated in
        # Python3.
        # In Python3, the message can be accessed directly by KeyError
        # (https://github.com/VingtCinq/python-mailchimp/pull/65), so as a
        # workaround for Python2, the 'message' attribute is obtained by
        # str() and then it is converted to dict. This works in Python3 as well.
        error_message = ast.literal_eval(python_utils.UNICODE(error))
        # Error 404 corresponds to "User does not exist".
        if error_message['status'] == 404:
            if can_receive_email_updates:
                user_creation_successful = _create_user_in_mailchimp_db(
                    user_email)
                if not user_creation_successful:
                    return False
        else:
            raise Exception(error_message['detail'])
    return True
