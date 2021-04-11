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

"""Error classes for model audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import json
import feconf
import python_utils


class BaseAuditError(python_utils.OBJECT):
    """Base class for model audit errors.

    NOTE: Apache Beam will use pickle to serialize/deserialize class instances.
    """

    # BaseAuditError and its subclasses will hold exactly one attribute to
    # minimize their memory footprint.
    __slots__ = '_message',

    def __init__(self, model):
        model_name = model.__class__.__name__
        quoted_model_id = json.dumps(model.id)
        # At first, self._message is a tuple of model identifiers that will be
        # used to annotate the _actual_ message provided by subclasses.
        self._message = (model_name, quoted_model_id)

    def __getstate__(self):
        """Called by pickle to get the value that uniquely defines self."""
        return self.message

    def __setstate__(self, message):
        """Called by pickle to build an instance from __getstate__'s value."""
        self._message = message

    @property
    def message(self):
        """Returns the error message, which includes the erroneous model's id.

        Returns:
            str. The error message.

        Raises:
            NotImplementedError. When self.message was never assigned a value.
        """
        if not python_utils.is_string(self._message):
            raise NotImplementedError(
                'self.message must be assigned a value in __init__')
        return self._message

    @message.setter
    def message(self, message):
        """Sets the error message.

        Args:
            message: str. The error message.

        Raises:
            TypeError. When self.message has already been assigned a value.
            TypeError. When the input message is not a string.
            ValueError. When the input message is empty.
        """
        if python_utils.is_string(self._message):
            raise TypeError('self.message must be assigned to exactly once')
        if not python_utils.is_string(message):
            raise TypeError('self.message must be a string')
        if not message:
            raise ValueError('self.message must be a non-empty string')
        model_name, quoted_model_id = self._message
        self._message = '%s in %s(id=%s): %s' % (
            self.__class__.__name__, model_name, quoted_model_id, message)

    def __repr__(self):
        return '\'%s\'' % self.message.replace('\'', r'\'')

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


class InconsistentTimestampsError(BaseAuditError):
    """Error class for models with inconsistent timestamps."""

    def __init__(self, model):
        super(InconsistentTimestampsError, self).__init__(model)
        self.message = 'created_on=%r is later than last_updated=%r' % (
            model.created_on, model.last_updated)


class InvalidCommitStatusError(BaseAuditError):
    """Error class for commit models with inconsistent status values."""

    def __init__(self, model):
        super(InvalidCommitStatusError, self).__init__(model)
        self.message = (
            'post_commit_status="%s" but post_commit_is_private=%r' % (
                model.post_commit_status, model.post_commit_is_private))


class ModelMutatedDuringJobError(BaseAuditError):
    """Error class for models mutated during a job."""

    def __init__(self, model):
        super(ModelMutatedDuringJobError, self).__init__(model)
        self.message = (
            'last_updated=%r is later than the audit job\'s start time' % (
                model.last_updated))


class ModelIdRegexError(BaseAuditError):
    """Error class for models with ids that fail to match a regex pattern."""

    def __init__(self, model, regex_string):
        super(ModelIdRegexError, self).__init__(model)
        quoted_regex = json.dumps(regex_string)
        self.message = 'id does not match the expected regex=%s' % quoted_regex


class ModelExpiredError(BaseAuditError):
    """Error class for expired models."""

    def __init__(self, model):
        super(ModelExpiredError, self).__init__(model)
        self.message = 'deleted=True when older than %s days' % (
            feconf.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)


class InvalidCommitTypeError(BaseAuditError):
    """Error class for commit_type validation errors."""

    def __init__(self, model):
        super(InvalidCommitTypeError, self).__init__(model)
        self.message = (
            'Commit type %s is not allowed' % model.commit_type)


class ModelExpiringError(BaseAuditError):
    """Error class for models that are expiring."""

    def __init__(self, model):
        super(ModelExpiringError, self).__init__(model)
        self.message = 'mark model as deleted when older than %s days' % (
            feconf.PERIOD_TO_MARK_MODELS_AS_DELETED.days)
