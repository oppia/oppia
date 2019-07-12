# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

from core.controllers import acl_decorators
from core.controllers import base
from core.platform import models

import feconf

app_identity_services = models.Registry.import_app_identity_services()

class AppIdentityHandler(base.BaseHandler):
    """Provides app identity data."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_create_exploration
    def get(self):
        """Handles GET requests."""
        self.render_json({
            'GCS_RESOURCE_BUCKET_NAME': (
                app_identity_services.get_gcs_resource_bucket_name()),
        })
