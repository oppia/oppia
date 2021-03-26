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

"""Error classes for model validations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf
import python_utils


class ModelValidationError(python_utils.OBJECT):
    """Base class for model validation errors.

    Attributes:
        message: str. A summary of the issue which includes the erroneous
            model's id.
    """

    def __init__(self, model):
        self._message = None
        self._prefix = '%s(id="%s")' % (model.__class__.__name__, model.id)

    @property
    def message(self):
        """Message property to override in subclasses."""
        if self._message is None:
            raise NotImplementedError(
                'Subclasses must assign to self.message in __init__')
        return self._message

    @message.setter
    def message(self, value):
        """Message property setter for assigning values.

        Args:
            value: str. The message for the error.

        Returns:
            str. The complete newly assigned message.
        """
        if not value:
            raise ValueError('self.message must have a non-empty value')
        self._message = '%s: %s' % (self._prefix, value)
        return self._message

    def __repr__(self):
        return '%s in %s' % (self.__class__.__name__, self.message)

    def __eq__(self, other):
        return (
            self.message == other.message
            if self.__class__ is other.__class__ else NotImplemented)

    def __ne__(self, other):
        return (
            not (self == other)
            if self.__class__ is other.__class__ else NotImplemented)

    def __hash__(self):
        return hash((self.__class__, self.message))


class ModelTimestampRelationshipError(ModelValidationError):
    """Error class for time field model validation errors."""

    def __init__(self, model):
        super(ModelTimestampRelationshipError, self).__init__(model)
        self.message = (
            'created_on=%r is later than last_updated=%r'
            % (model.created_on, model.last_updated))


class ModelInvalidCommitStatusError(ModelValidationError):
    """Error class for commit_status validation errors."""

    def __init__(self, model):
        super(ModelInvalidCommitStatusError, self).__init__(model)
        self.message = (
            'post_commit_status="public" but post_commit_is_private=True'
            if model.post_commit_is_private else
            'post_commit_status="private" but post_commit_is_private=False')


class ModelMutatedDuringJobError(ModelValidationError):
    """Error class for current time model validation errors."""

    def __init__(self, model):
        super(ModelMutatedDuringJobError, self).__init__(model)
        self.message = 'last_updated=%r is later than the job\'s start time' % (
            model.last_updated)


class ModelInvalidIdError(ModelValidationError):
    """Error class for id model validation errors."""

    def __init__(self, model, pattern):
        super(ModelInvalidIdError, self).__init__(model)
        self.message = 'id does not match the expected regex=%r' % pattern


class ModelExpiredError(ModelValidationError):
    """Error class for stale deletion validation errors."""

    def __init__(self, model):
        super(ModelExpiredError, self).__init__(model)
        self.message = 'deleted=True and model is older than %s days' % (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)
