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

"""Models for Oppia Android feedback reports."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import core.storage.base_model.gae_models as base_models

datastore_services = models.Registry.import_datastore_services()

class AndroidFeedbackReportModel(base_models.VersionedModel):
    """A class for the versioned storage model maintaingin individual Oppia
    Android feedback reports.
    """
    
    #
    report_id = datastore_services.StringProperty(required=True, indexed=True)
    #
    ticket_id = datastore_services.StringProperty(required=True, indexed=True)
    #
    report_creation_timestamp = datastore_services.DateTimeProperty(
        required=True, indexed=True)
    #
    report_type = datastore_services.StringProperty(required=True, indexed=True)
    #
    package_version_name = datastore_services.StringProperty(
        required = True, indexed = True)
    #
    package_version_code = datastore_services.IntegerProperty(
        required=True, indexed=True)
    #
    country_locale = datastore_services.StringProperty(required=True, indexed=True)
    #
    language_locale = datastore_services.StringProperty(
        required=True, indexed=True)
    #
    device_model = datastore_services.StringProperty(
        required=True, indexed=True)
    #
    sdk_version = datastore_services.IntegerProperty(required=True, indexed=True)
    #
    device_brand = datastore_services.StringProperty(
        required=True, indexed=True)
    #
    entry_point = datastore_services.StringProperty(required=True, indexed=True)
    #
    text_language = datastore_services.StringProperty(
        required=True, indexed=True)
    #
    audio_language = datastore_services.StringProperty(
        required=True, indexed=True)
    # All other report info that the model is not queried on. (e.g. the report
    # category, logs, etc.)
    report_info = datastore_services.JsonProperty(required=True, indexed=False)
