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

"""Domain objects for user."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections

import feconf
import python_utils
import utils


UserQueryParams = collections.namedtuple(
    'UserQueryParams',
    [
        'inactive_in_last_n_days',
        'has_not_logged_in_for_n_days',
        'created_at_least_n_exps',
        'created_fewer_than_n_exps',
        'edited_at_least_n_exps',
        'edited_fewer_than_n_exps'
    ]
)


class UserQuery(python_utils.OBJECT):

    def __init__(
        self, query_id, query_params, submitter_id, query_status, user_ids,
        sent_email_model_id=None, created_on=None, deleted=False
    ):
        self._id = query_id
        self._params = query_params
        self._submitter_id = submitter_id
        self._status = query_status
        self._user_ids = user_ids
        self._sent_email_model_id = sent_email_model_id
        self._created_on = created_on
        self._deleted = deleted

    @property
    def id(self):
        return self._id

    @property
    def params(self):
        return self._params

    @property
    def submitter_id(self):
        return self._submitter_id

    @property
    def status(self):
        return self._status

    @property
    def user_ids(self):
        return self._user_ids

    @property
    def sent_email_model_id(self):
        return self._sent_email_model_id

    def validate(self):
        """Validates various properties of the ExplorationSummary.

        Raises:
            ValidationError. One or more attributes of the ExplorationSummary
                are invalid.
        """
        if not isinstance(self._id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected ID to be a string, received %s' % self._id)

        if not isinstance(self._params, UserQueryParams):
            raise utils.ValidationError(
                'Expected params to be of type UserQueryParams, received %s'
                % self._params)

        if not isinstance(self._submitter_id, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self._submitter_id)
        if not utils.is_user_id_valid

        if not isinstance(self.language_code, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected language_code to be a string, received %s' %
                self.language_code)
        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language_code: %s' % self.language_code)

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected \'tags\' to be a list, received %s' % self.tags)
        for tag in self.tags:
            if not isinstance(tag, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each tag in \'tags\' to be a string, received '
                    '\'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(constants.TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain lowercase letters and spaces, '
                    'received \'%s\'' % tag)

            if (tag[0] not in string.ascii_lowercase or
                    tag[-1] not in string.ascii_lowercase):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received '
                    '\'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received \'%s\'' % tag)
        if len(set(self.tags)) != len(self.tags):
            raise utils.ValidationError('Some tags duplicate each other')

        if not isinstance(self.ratings, dict):
            raise utils.ValidationError(
                'Expected ratings to be a dict, received %s' % self.ratings)

        valid_rating_keys = ['1', '2', '3', '4', '5']
        actual_rating_keys = sorted(self.ratings.keys())
        if valid_rating_keys != actual_rating_keys:
            raise utils.ValidationError(
                'Expected ratings to have keys: %s, received %s' % (
                    (', ').join(valid_rating_keys),
                    (', ').join(actual_rating_keys)))
        for value in self.ratings.values():
            if not isinstance(value, int):
                raise utils.ValidationError(
                    'Expected value to be int, received %s' % value)
            if value < 0:
                raise utils.ValidationError(
                    'Expected value to be non-negative, received %s' % (
                        value))

        if not isinstance(self.scaled_average_rating, float):
            raise utils.ValidationError(
                'Expected scaled_average_rating to be float, received %s' % (
                    self.scaled_average_rating))

        if not isinstance(self.status, python_utils.BASESTRING):
            raise utils.ValidationError(
                'Expected status to be string, received %s' % self.status)

        if not isinstance(self.community_owned, bool):
            raise utils.ValidationError(
                'Expected community_owned to be bool, received %s' % (
                    self.community_owned))

        if not isinstance(self.owner_ids, list):
            raise utils.ValidationError(
                'Expected owner_ids to be list, received %s' % self.owner_ids)
        for owner_id in self.owner_ids:
            if not isinstance(owner_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in owner_ids to '
                    'be string, received %s' % owner_id)

        if not isinstance(self.editor_ids, list):
            raise utils.ValidationError(
                'Expected editor_ids to be list, received %s' % self.editor_ids)
        for editor_id in self.editor_ids:
            if not isinstance(editor_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in editor_ids to '
                    'be string, received %s' % editor_id)

        if not isinstance(self.voice_artist_ids, list):
            raise utils.ValidationError(
                'Expected voice_artist_ids to be list, received %s' % (
                    self.voice_artist_ids))
        for voice_artist_id in self.voice_artist_ids:
            if not isinstance(voice_artist_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in voice_artist_ids to '
                    'be string, received %s' % voice_artist_id)

        if not isinstance(self.viewer_ids, list):
            raise utils.ValidationError(
                'Expected viewer_ids to be list, received %s' % self.viewer_ids)
        for viewer_id in self.viewer_ids:
            if not isinstance(viewer_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in viewer_ids to '
                    'be string, received %s' % viewer_id)

        if not isinstance(self.contributor_ids, list):
            raise utils.ValidationError(
                'Expected contributor_ids to be list, received %s' % (
                    self.contributor_ids))
        for contributor_id in self.contributor_ids:
            if not isinstance(contributor_id, python_utils.BASESTRING):
                raise utils.ValidationError(
                    'Expected each id in contributor_ids to '
                    'be string, received %s' % contributor_id)

        if not isinstance(self.contributors_summary, dict):
            raise utils.ValidationError(
                'Expected contributors_summary to be dict, received %s' % (
                    self.contributors_summary))


    def to_dict(self):
        return {
            'id': self._id,
            'submitter_id': self._submitter_id,
            'created_on': self._created_on.strftime('%d-%m-%y %H:%M:%S'),
            'status': self._status,
            'num_qualified_users': len(self._user_ids)
        }

    @classmethod
    def create_default(cls, query_id, query_params, submitter_id):
        return cls(
            query_id, query_params, submitter_id,
            feconf.USER_QUERY_STATUS_PROCESSING, []
        )

    def archive(self, sent_email_model_id=None):
        if sent_email_model_id:
            self._sent_email_model_id = sent_email_model_id
        self._status = feconf.USER_QUERY_STATUS_ARCHIVED
        self._deleted = True
