# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the admin view."""

import logging

import jinja2

from core import counters
from core import jobs
from core import jobs_registry
from core.controllers import base
from core.controllers import editor
from core.domain import collection_services
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_services
from core.domain import recommendations_services
from core.domain import rights_manager
from core.domain import rte_component_registry
from core.platform import models
import feconf
import utils

current_user_services = models.Registry.import_current_user_services()


def require_super_admin(handler):
    """Decorator that checks if the current user is a super admin."""
    def test_super_admin(self, **kwargs):
        """Checks if the user is logged in and is a super admin."""
        if not self.user_id:
            self.redirect(
                current_user_services.create_login_url(self.request.uri))
            return
        if not current_user_services.is_current_user_super_admin():
            raise self.UnauthorizedUserException(
                '%s is not a super admin of this application', self.user_id)
        return handler(self, **kwargs)

    return test_super_admin


class AdminPage(base.BaseHandler):
    """Admin page shown in the App Engine admin console."""
    @require_super_admin
    def get(self):
        """Handles GET requests."""
        self.values['counters'] = [{
            'name': counter.name,
            'description': counter.description,
            'value': counter.value
        } for counter in counters.Registry.get_all_counters()]

        if counters.HTML_RESPONSE_COUNT.value:
            average_time = (
                counters.HTML_RESPONSE_TIME_SECS.value /
                counters.HTML_RESPONSE_COUNT.value)
            self.values['counters'].append({
                'name': 'average-html-response-time-secs',
                'description': 'Average HTML response time in seconds',
                'value': average_time
            })

        if counters.JSON_RESPONSE_COUNT.value:
            average_time = (
                counters.JSON_RESPONSE_TIME_SECS.value /
                counters.JSON_RESPONSE_COUNT.value)
            self.values['counters'].append({
                'name': 'average-json-response-time-secs',
                'description': 'Average JSON response time in seconds',
                'value': average_time
            })

        demo_exploration_ids = feconf.DEMO_EXPLORATIONS.keys()

        recent_job_data = jobs.get_data_for_recent_jobs()
        unfinished_job_data = jobs.get_data_for_unfinished_jobs()
        for job in unfinished_job_data:
            job['can_be_canceled'] = job['is_cancelable'] and any([
                klass.__name__ == job['job_type']
                for klass in jobs_registry.ONE_OFF_JOB_MANAGERS])

        queued_or_running_job_types = set([
            job['job_type'] for job in unfinished_job_data])
        one_off_job_specs = [{
            'job_type': klass.__name__,
            'is_queued_or_running': (
                klass.__name__ in queued_or_running_job_types)
        } for klass in jobs_registry.ONE_OFF_JOB_MANAGERS]

        continuous_computations_data = jobs.get_continuous_computations_info(
            jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS)
        for computation in continuous_computations_data:
            if computation['last_started_msec']:
                computation['human_readable_last_started'] = (
                    utils.get_human_readable_time_string(
                        computation['last_started_msec']))
            if computation['last_stopped_msec']:
                computation['human_readable_last_stopped'] = (
                    utils.get_human_readable_time_string(
                        computation['last_stopped_msec']))
            if computation['last_finished_msec']:
                computation['human_readable_last_finished'] = (
                    utils.get_human_readable_time_string(
                        computation['last_finished_msec']))

        self.values.update({
            'continuous_computations_data': continuous_computations_data,
            'demo_collections': sorted(feconf.DEMO_COLLECTIONS.iteritems()),
            'demo_explorations': sorted(feconf.DEMO_EXPLORATIONS.iteritems()),
            'demo_exploration_ids': demo_exploration_ids,
            'human_readable_current_time': (
                utils.get_human_readable_time_string(
                    utils.get_current_time_in_millisecs())),
            'one_off_job_specs': one_off_job_specs,
            'recent_job_data': recent_job_data,
            'rte_components_html': jinja2.utils.Markup(
                rte_component_registry.Registry.get_html_for_all_components()),
            'unfinished_job_data': unfinished_job_data,
            'value_generators_js': jinja2.utils.Markup(
                editor.get_value_generators_js()),
        })

        self.render_template('admin/admin.html')


class AdminHandler(base.BaseHandler):
    """Handler for the admin page."""
    @require_super_admin
    def get(self):
        """Handles GET requests."""

        self.render_json({
            'config_properties': (
                config_domain.Registry.get_config_property_schemas()),
        })

    @require_super_admin
    def post(self):
        """Handles POST requests."""
        try:
            if self.payload.get('action') == 'reload_exploration':
                exploration_id = self.payload.get('exploration_id')
                logging.info(
                    '[ADMIN] %s reloaded exploration %s' %
                    (self.user_id, exploration_id))
                exp_services.load_demo(unicode(exploration_id))
                rights_manager.release_ownership_of_exploration(
                    feconf.SYSTEM_COMMITTER_ID, unicode(exploration_id))
            elif self.payload.get('action') == 'reload_collection':
                collection_id = self.payload.get('collection_id')
                logging.info(
                    '[ADMIN] %s reloaded collection %s' %
                    (self.user_id, collection_id))
                collection_services.load_demo(unicode(collection_id))
                rights_manager.release_ownership_of_collection(
                    feconf.SYSTEM_COMMITTER_ID, unicode(collection_id))
            elif self.payload.get('action') == 'clear_search_index':
                exp_services.clear_search_index()
            elif self.payload.get('action') == 'save_config_properties':
                new_config_property_values = self.payload.get(
                    'new_config_property_values')
                logging.info('[ADMIN] %s saved config property values: %s' %
                             (self.user_id, new_config_property_values))
                for (name, value) in new_config_property_values.iteritems():
                    config_services.set_property(self.user_id, name, value)
            elif self.payload.get('action') == 'revert_config_property':
                config_property_id = self.payload.get('config_property_id')
                logging.info('[ADMIN] %s reverted config property: %s' %
                             (self.user_id, config_property_id))
                config_services.revert_property(
                    self.user_id, config_property_id)
            elif self.payload.get('action') == 'start_new_job':
                for klass in jobs_registry.ONE_OFF_JOB_MANAGERS:
                    if klass.__name__ == self.payload.get('job_type'):
                        klass.enqueue(klass.create_new())
                        break
            elif self.payload.get('action') == 'cancel_job':
                job_id = self.payload.get('job_id')
                job_type = self.payload.get('job_type')
                for klass in jobs_registry.ONE_OFF_JOB_MANAGERS:
                    if klass.__name__ == job_type:
                        klass.cancel(job_id, self.user_id)
                        break
            elif self.payload.get('action') == 'start_computation':
                computation_type = self.payload.get('computation_type')
                for klass in jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS:
                    if klass.__name__ == computation_type:
                        klass.start_computation()
                        break
            elif self.payload.get('action') == 'stop_computation':
                computation_type = self.payload.get('computation_type')
                for klass in jobs_registry.ALL_CONTINUOUS_COMPUTATION_MANAGERS:
                    if klass.__name__ == computation_type:
                        klass.stop_computation(self.user_id)
                        break
            elif self.payload.get('action') == 'upload_topic_similarities':
                data = self.payload.get('data')
                recommendations_services.update_topic_similarities(data)

            self.render_json({})
        except Exception as e:
            self.render_json({'error': unicode(e)})
            raise


class AdminJobOutput(base.BaseHandler):
    """Retrieves job output to show on the admin page."""
    @require_super_admin
    def get(self):
        """Handles GET requests."""
        job_id = self.request.get('job_id')
        self.render_json({
            'output': jobs.get_job_output(job_id)
        })


class AdminTopicsCsvDownloadHandler(base.BaseHandler):
    """Retrieves topic similarity data for download."""

    @require_super_admin
    def get(self):
        self.response.headers['Content-Type'] = 'text/csv'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=topic_similarities.csv')
        self.response.write(
            recommendations_services.get_topic_similarities_as_csv())
