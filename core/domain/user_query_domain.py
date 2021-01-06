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
