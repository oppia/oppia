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

import feconf
from jobs import job_utils
import python_utils


class BaseAuditError(python_utils.OBJECT):
    """Base class for model audit errors.

    NOTE: Apache Beam will use pickle to serialize/deserialize class instances.
    """

    # BaseAuditError and its subclasses will hold exactly one attribute to
    # minimize their memory footprint.
    __slots__ = ('_message',)

    def __init__(self, model_or_kind, model_id=None):
        """Initializes a new audit error.

        Args:
            model_or_kind: Model|bytes. If model_id is not provided, then this
                is a model (type: BaseModel).
                Otherwise, this is a model's kind (type: bytes).
            model_id: bytes|None. The model's ID, or None when model_or_kind is
                a model.
        """
        if model_id is not None:
            model_kind = model_or_kind
        else:
            model_id = job_utils.get_model_id(model_or_kind)
            model_kind = job_utils.get_model_kind(model_or_kind)
        # At first, self._message is a tuple of model identifiers that will be
        # used to annotate the _actual_ message provided by subclasses.
        self._message = (model_kind, model_id)

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
        model_kind, model_id = self._message
        self._message = '%s in %s(id=%r): %s' % (
            self.__class__.__name__, model_kind, model_id, message)

    def __repr__(self):
        return repr(self.message)

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


class ModelIncorrectKeyError(BaseAuditError):
    """Error class for incorrect key in PendingDeletionRequestModel."""

    def __init__(self, model, incorrect_keys):
        super(ModelIncorrectKeyError, self).__init__(model)
        self.message = 'contains keys %s are not allowed' % (incorrect_keys)


class ModelExpiringError(BaseAuditError):
    """Error class for models that are expiring."""

    def __init__(self, model):
        super(ModelExpiringError, self).__init__(model)
        self.message = 'mark model as deleted when older than %s days' % (
            feconf.PERIOD_TO_MARK_MODELS_AS_DELETED.days)


class ModelIdRegexError(BaseAuditError):
    """Error class for models with ids that fail to match a regex pattern."""

    def __init__(self, model, regex_string):
        super(ModelIdRegexError, self).__init__(model)
        self.message = 'id does not match the expected regex=%r' % regex_string


class DraftChangeListLastUpdatedNoneError(BaseAuditError):
    """Error class for models with draft change list but draft change list
    last_updated is None.
    """

    def __init__(self, model):
        super(DraftChangeListLastUpdatedNoneError, self).__init__(model)
        self.message = (
            'draft change list %s exists but draft change list '
            'last updated is None' % model.draft_change_list)


class DraftChangeListLastUpdatedInvalidError(BaseAuditError):
    """Error class for models with invalid draft change list last_updated."""

    def __init__(self, model):
        super(DraftChangeListLastUpdatedInvalidError, self).__init__(model)
        self.message = (
            'draft change list last updated %s is greater than the time '
            'when job was run' % model.draft_change_list_last_updated)
