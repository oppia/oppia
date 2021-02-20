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

from core.domain import cron_services
import python_utils

PERIOD_TO_HARD_DELETE_MODEL_IN_DAYS = (
    cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)


class ModelValidationError(python_utils.OBJECT):
    """Base error class for model validations."""

    @property
    def key(self):
        """Property that returns the error class name."""
        return self.__class__.__name__

    @property
    def message(self):
        """Message property to override in subclasses."""
        return None

    def __repr__(self):
        return '%s: %s' % (self.key, self.message) if self.message else self.key

    def __eq__(self, other):
        if self.__class__ is other.__class__:
            return (self.key, self.message) == (other.key, other.message)
        return NotImplemented

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash((self.__class__, self.key, self.message))


class ModelTimestampRelationshipError(ModelValidationError):
    """Error class for time field model validation errors."""

    def __init__(self, model):
        self._message = (
            'Entity ID %s: The created_on field has a value %s which '
            'is greater than the value %s of last_updated field'
            % (model.id, model.created_on, model.last_updated))

    @property
    def message(self):
        return self._message


class ModelMutatedDuringJobError(ModelValidationError):
    """Error class for current time model validation errors."""

    def __init__(self, model):
        self._message = (
            'Entity id %s: The last_updated field has a value %s which '
            'is greater than the time when the job was run'
            % (model.id, model.last_updated))

    @property
    def message(self):
        return self._message


class ModelInvalidIdError(ModelValidationError):
    """Error class for id model validation errors."""

    def __init__(self, model):
        self._message = (
            'Entity id %s: Entity id does not match regex pattern'
            % (model.id))

    @property
    def message(self):
        return self._message


class ModelExpiredError(ModelValidationError):
    """Error class for stale deletion validation errors."""

    def __init__(self, model):
        self._message = (
            'Entity id %s: model marked as deleted is older than %s days'
            % (model.id, PERIOD_TO_HARD_DELETE_MODEL_IN_DAYS))

    @property
    def message(self):
        return self._message
