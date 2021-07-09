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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core import jobs
from core import jobs_registry
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import caching_services
import feconf
import utils


class ReleaseCoordinatorPage(base.BaseHandler):
    """Handler for the release cordinator page."""

    @acl_decorators.can_access_release_coordinator_page
    def get(self):
        """Handles GET requests."""
        self.render_template('release-coordinator-page.mainpage.html')


class JobsHandler(base.BaseHandler):
    """Handler to present/start/stop jobs through release coordinator page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_run_any_job
    def get(self):
        """Handles GET requests."""
        recent_job_data = jobs.get_data_for_recent_jobs()
        unfinished_job_data = jobs.get_data_for_unfinished_jobs()

        for job in unfinished_job_data:
            job['can_be_canceled'] = job['is_cancelable'] and any([
                klass.__name__ == job['job_type']
                for klass in (
                    jobs_registry.ONE_OFF_JOB_MANAGERS + (
                        jobs_registry.AUDIT_JOB_MANAGERS))])

        queued_or_running_job_types = set([
            job['job_type'] for job in unfinished_job_data])
        one_off_job_status_summaries = [{
            'job_type': klass.__name__,
            'is_queued_or_running': (
                klass.__name__ in queued_or_running_job_types)
        } for klass in jobs_registry.ONE_OFF_JOB_MANAGERS]
        audit_job_status_summaries = [{
            'job_type': klass.__name__,
            'is_queued_or_running': (
                klass.__name__ in queued_or_running_job_types)
        } for klass in jobs_registry.AUDIT_JOB_MANAGERS]

        self.render_json({
            'human_readable_current_time': (
                utils.get_human_readable_time_string(
                    utils.get_current_time_in_millisecs())),
            'one_off_job_status_summaries': one_off_job_status_summaries,
            'audit_job_status_summaries': audit_job_status_summaries,
            'recent_job_data': recent_job_data,
            'unfinished_job_data': unfinished_job_data,
        })

    @acl_decorators.can_run_any_job
    def post(self):
        """Handles POST requests."""
        action = self.payload.get('action')
        if action == 'start_new_job':
            for klass in (
                    jobs_registry.ONE_OFF_JOB_MANAGERS + (
                        jobs_registry.AUDIT_JOB_MANAGERS)):
                if klass.__name__ == self.payload.get('job_type'):
                    klass.enqueue(klass.create_new())
                    break
        elif action == 'cancel_job':
            job_id = self.payload.get('job_id')
            job_type = self.payload.get('job_type')
            for klass in (
                    jobs_registry.ONE_OFF_JOB_MANAGERS + (
                        jobs_registry.AUDIT_JOB_MANAGERS)):
                if klass.__name__ == job_type:
                    klass.cancel(job_id, self.user_id)
                    break
        else:
            raise self.InvalidInputException('Invalid action: %s' % action)
        self.render_json({})


class JobOutputHandler(base.BaseHandler):
    """Retrieves job output to show on the release coordinator page."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_run_any_job
    def get(self):
        """Handles GET requests."""
        job_id = self.request.get('job_id')
        self.render_json({
            'output': jobs.get_job_output(job_id)
        })


class MemoryCacheHandler(base.BaseHandler):
    """Handler for memory cache profile."""

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
        caching_services.flush_memory_cache()
        self.render_json({})
