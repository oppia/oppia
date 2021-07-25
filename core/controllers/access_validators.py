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

"""Controllers for the validating access."""

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import user_services

class SplashPageAccessValidationHandler(base.BaseHandler):
    """When a request is made to '/', check the user's login status, and
    redirect them appropriately.
    """

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.open_access # type: ignore[misc]
    def get(self):
        # type: () -> None
        if self.user_id and user_services.has_fully_registered_account( # type: ignore[no-untyped-call]
                self.user_id):
            user_settings = user_services.get_user_settings(self.user_id) # type: ignore[no-untyped-call]
            default_dashboard = user_settings.default_dashboard
            self.render_json({ 'valid': False, 'default_dashboard': default_dashboard })
        else:
            self.render_json({ 'valid': True }) # type: ignore[no-untyped-call]
