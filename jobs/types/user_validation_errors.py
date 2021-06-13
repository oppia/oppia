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

"""Error classes for user model audits."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf
from jobs.types import base_validation_errors


class ModelIncorrectKeyError(base_validation_errors.BaseAuditError):
    """Error class for incorrect key in PendingDeletionRequestModel."""

    def __init__(self, model, incorrect_keys):
        super(ModelIncorrectKeyError, self).__init__(model)
        self.message = 'contains keys %s are not allowed' % (incorrect_keys)


class ModelExpiringError(base_validation_errors.BaseAuditError):
    """Error class for models that are expiring."""

    def __init__(self, model):
        super(ModelExpiringError, self).__init__(model)
        self.message = 'mark model as deleted when older than %s days' % (
            feconf.PERIOD_TO_MARK_MODELS_AS_DELETED.days)


class DraftChangeListLastUpdatedNoneError(
        base_validation_errors.BaseAuditError):
    """Error class for models with draft change list but draft change list
    last_updated is None.
    """

    def __init__(self, model):
        super(DraftChangeListLastUpdatedNoneError, self).__init__(model)
        self.message = (
            'draft change list %s exists but draft change list '
            'last updated is None' % model.draft_change_list)


class DraftChangeListLastUpdatedInvalidError(
        base_validation_errors.BaseAuditError):
    """Error class for models with invalid draft change list last_updated."""

    def __init__(self, model):
        super(DraftChangeListLastUpdatedInvalidError, self).__init__(model)
        self.message = (
            'draft change list last updated %s is greater than the time '
            'when job was run' % model.draft_change_list_last_updated)


class ArchivedModelNotMarkedDeletedError(
        base_validation_errors.BaseAuditError):
    """Error class for models which are archived but not deleted."""

    def __init__(self, model):
        super(ArchivedModelNotMarkedDeletedError, self).__init__(model)
        self.message = 'model is archived but not marked as deleted'
