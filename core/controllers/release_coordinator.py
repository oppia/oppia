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

"""Controllers for the release coordinator page."""

from __future__ import annotations

from core import feconf
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import caching_services


class MemoryCacheHandler(base.BaseHandler):
    """Handler for memory cache profile."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'DELETE': {}
    }

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_manage_memcache
    def get(self):
        cache_stats = caching_services.get_memory_cache_stats()
        self.render_json({
            'total_allocation': cache_stats.total_allocated_in_bytes,
            'peak_allocation': cache_stats.peak_memory_usage_in_bytes,
            'total_keys_stored': cache_stats.total_number_of_keys_stored
        })

    @acl_decorators.can_manage_memcache
    def delete(self):
        caching_services.flush_memory_caches()
        self.render_json({})
