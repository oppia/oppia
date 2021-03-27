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

import json
import feconf
import python_utils


class ModelValidationError(python_utils.OBJECT):
    """Base class for model validation errors.

    NOTE: Apache Beam will use pickle to serialize/deserialize error instances.
    """

    # ModelValidationError and its subclasses will hold exactly one attribute to
    # minimize their memory footprint.
    __slots__ = '_message',

    def __init__(self, model):
        # At first, self._message is a tuple of model identifiers that will be
        # used to annotate the actual message provided by subclasses.
        model_name = model.__class__.__name__
        # We use json.dumps to get a quote-escaped string.
        model_id = json.dumps(model.id)
        self._message = (model_name, model_id)

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self."""
        return self.message

    def __setstate__(self, message):
        """Called by pickle to build an instance from the __getstate__ value."""
        self._message = message

    @property
    def message(self):
        """Returns the error's message, which includes the erroneous model's id.

        Returns:
            str. The message.

        Raises:
            NotImplementedError. If message was never assigned a value.
        """
        if not python_utils.is_string(self._message):
            raise NotImplementedError(
                'self.message must be assigned a value in __init__')
        return self._message

    @message.setter
    def message(self, value):
        """Assigns a value to self.message.

        Args:
            value: str. The message.

        Raises:
            TypeError. When the message has already been assigned a value.
            TypeError. When the value is not a string.
            ValueError. When the value is empty.
        """
        if python_utils.is_string(self._message):
            raise TypeError('self.message must be assigned to exactly once')
        if not python_utils.is_string(value):
            raise TypeError('self.message must be a string')
        if not value:
            raise ValueError('self.message must be a non-empty string')
        model_name, model_id = self._message
        self._message = '%s(id=%s): %s' % (model_name, model_id, value)

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


class InconsistentTimestampsError(ModelValidationError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model):
        super(InconsistentTimestampsError, self).__init__(model)
        self.message = (
            'created_on=%r is later than last_updated=%r'
            % (model.created_on, model.last_updated))


class InvalidCommitStatusError(ModelValidationError):
    """Error class for commit models with inconsistent status values."""

    def __init__(self, model):
        super(InvalidCommitStatusError, self).__init__(model)
        self.message = (
            'post_commit_status="public" but post_commit_is_private=True'
            if model.post_commit_is_private else
            'post_commit_status="private" but post_commit_is_private=False')


class ModelMutatedDuringJobError(ModelValidationError):
    """Error class for models mutated during a job."""

    def __init__(self, model):
        super(ModelMutatedDuringJobError, self).__init__(model)
        self.message = 'last_updated=%r is later than the job\'s start time' % (
            model.last_updated)


class InvalidIdError(ModelValidationError):
    """Error class for models with invalid ids."""

    def __init__(self, model, pattern):
        super(InvalidIdError, self).__init__(model)
        self.message = 'id does not match the expected regex=%r' % pattern


class ModelExpiredError(ModelValidationError):
    """Error class for stale models."""

    def __init__(self, model):
        super(ModelExpiredError, self).__init__(model)
        self.message = 'deleted=True when older than %s days' % (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)
