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

from core.domain import cron_services

period_to_hard_delete_models_in_days = (
    cron_services.PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED.days)

class ModelValidationError(object):

    @property
    def key(self):
        return self.__class__.__name__

    @property
    def message(self):
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


class TimeFieldModelValidationError(ValidationError):

    def __init__(self, model):
        self._message = (
            'Entity ID %s: The created_on field has a value %s which '
            'is greater than the value %s of last_updated field' % (
                model.id, model.created_on, model.last_updated))

    @property
    def message(self):
        return self._message

class CurrentTimeModelValidationError(ValidationError):

    def __init__(self, model):
        self._message = (
            'Entity id %s: The last_updated field has a value %s which '
                'is greater than the time when the job was run'
                % (element.id, element.last_updated))

    @property
    def message(self):
        return self._message

class IdModelValidationError(ValidationError):

    def __init__(self, model):
        self._message = (
            'Entity id %s: Entity id does not match regex pattern' % (
                model.id))

    @property
    def message(self):
        return self._message

class StaleDeletedModelValidationError(ValidationError):

    def __init__(self, model):
        self._message = (
            'Entity id %s: model marked as deleted is older than %s days'
                % (model.id, period_to_hard_delete_models_in_days))

    @property
    def message(self):
        return self._message