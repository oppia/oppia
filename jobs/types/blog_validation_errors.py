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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import feconf
from jobs.types import base_validation_errors


class ValidateTitleIsUniqueError(base_validation_errors.BaseAuditError):
    """Error class for invalid title in BlogModels."""

    def __init__(self, model, model_name, duplicate_title_model_ids):
        message = (
            'Title of the %s model is not unique, Entity id %s:'
            ' title %s matches with title of models with '
            'ids %s' % (model_name, model.id, model.title,
            duplicate_title_model_ids))
        super(ValidateTitleIsUniqueError, self).__init__(message, model)


class ValidateUrlIsUniqueError(base_validation_errors.BaseAuditError):
    """Error class for invalid url in BlogModels."""

    def __init__(self, model, model_name, duplicate_url_model_ids):
        message = (
            'Url of the %s  model is not unique, Entity id %s:'
            ' url %s matches with url blog post models with '
            'ids %s' % (model_name, model.id, model.url,
            duplicate_url_model_ids))
        super(ValidateUrlIsUniqueError, self).__init__(message, model)


class ValidateTitleMatchesSummaryTitleError(
    base_validation_errors.BaseAuditError):
    """Error class for invalid url in BlogModels."""

    def __init__(self, model, summary_model):
        message = (
            'Title for both blog post and its summary model should be same.
            ' Recieved: %s and %s.' % (model.title, summary_model.title))
        super(ValidateTitleMatchesSummaryTitleError, self).__init__(message, model)