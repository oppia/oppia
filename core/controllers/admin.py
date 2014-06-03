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

__author__ = 'sll@google.com (Sean Lip)'

import logging
import time

from core import counters
from core import jobs
from core import jobs_registry
from core.controllers import base
from core.controllers import editor
from core.domain import config_domain
from core.domain import config_services
from core.domain import exp_services
from core.domain import user_services
from core.domain import widget_registry
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
# This is temporary.
(feedback_models, stats_models,) = models.Registry.import_models([
    models.NAMES.feedback, models.NAMES.statistics])
# End of temporary code.
import feconf

import jinja2


def require_super_admin(handler):
    """Decorator that checks if the current user is a super admin."""
    def test_super_admin(self, **kwargs):
        """Checks if the user is logged in and is a super admin."""
        if not self.user_id:
            self.redirect(
                current_user_services.create_login_url(self.request.uri))
            return
        if not user_services.is_super_admin(self.user_id, self.request):
            raise self.UnauthorizedUserException(
                '%s is not a super admin of this application', self.user_id)
        return handler(self, **kwargs)

    return test_super_admin


class AdminPage(base.BaseHandler):
    """Admin page shown in the App Engine admin console."""

    PAGE_NAME_FOR_CSRF = 'admin'

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

        demo_explorations = [
            (unicode(ind), exp[0]) for ind, exp in
            enumerate(feconf.DEMO_EXPLORATIONS)]

        new_job_types = [
            klass.__name__ for klass in
            jobs_registry.JOB_MANAGER_CLASSES]

        job_data = jobs.get_data_for_recent_jobs()
        for job in job_data:
            job['human_readable_time_started'] = time.strftime(
                '%B %d %H:%M:%S',
                time.gmtime(job['time_started']))
            job['human_readable_time_finished'] = time.strftime(
                '%B %d %H:%M:%S',
                time.gmtime(job['time_finished']))

        self.values.update({
            'demo_explorations': demo_explorations,
            'object_editors_js': jinja2.utils.Markup(
                editor.OBJECT_EDITORS_JS.value),
            'value_generators_js': jinja2.utils.Markup(
                editor.VALUE_GENERATORS_JS.value),
            'widget_js_directives': jinja2.utils.Markup(
                widget_registry.Registry.get_noninteractive_widget_js()),
            'new_job_types': new_job_types,
            'job_data': job_data,
        })

        # This is temporary.
        self.values.update({
            'old_feedback_items_count': (
                stats_models.FeedbackItemModel.get_all().count()),
            'new_feedback_threads_count': (
                feedback_models.FeedbackThreadModel.get_all().count()),
            'new_feedback_messages_count': (
                feedback_models.FeedbackMessageModel.get_all().count()),
        })
        # End of temporary code.

        self.render_template('admin/admin.html')


class AdminHandler(base.BaseHandler):
    """Handler for the admin page."""

    PAGE_NAME_FOR_CSRF = 'admin'

    def _migrate_feedback(self):
        old_feedback_items = stats_models.FeedbackItemModel.get_all()
        for item in old_feedback_items.fetch(10):
            target_id = item.target_id
            content = item.content
            # additional_data = item.additional_data
            submitter_id = item.submitter_id
            status = item.status

            if not target_id.startswith('state:'):
                raise Exception('Invalid target id: %s' % target_id)
            target_id = item.target_id[len('state:'):]
            exploration_id = target_id[:target_id.find('.')]
            state_name = target_id[target_id.find('.') + 1:]

            # Create a feedback thread for (exp_id, state_id) with content.
            # This thread is created by submitter_id. The status is set as:
            # new --> open, will_not_fix --> ignored, fixed --> fixed.
            STATUS_MAPPING = {
                'new': feedback_models.STATUS_CHOICES_OPEN,
                'will_not_fix': feedback_models.STATUS_CHOICES_IGNORED,
                'fixed': feedback_models.STATUS_CHOICES_FIXED,
            }

            thread_id = (
                feedback_models.FeedbackThreadModel.generate_new_thread_id(
                    exploration_id))
            thread = feedback_models.FeedbackThreadModel.create(
                exploration_id, thread_id)
            thread.exploration_id = exploration_id
            thread.state_name = state_name
            thread.original_author_id = submitter_id
            thread.status = STATUS_MAPPING[status]
            thread.subject = 'Feedback from a reader'
            thread.put()

            message_id = 0
            msg = feedback_models.FeedbackMessageModel.create(
                thread.id, message_id)
            msg.thread_id = thread.id
            msg.message_id = message_id
            msg.author_id = submitter_id
            msg.updated_status = thread.status
            msg.updated_subject = thread.subject
            msg.text = content
            msg.put()

            item.delete()

    @require_super_admin
    def get(self):
        """Handles GET requests."""

        self.render_json({
            'config_properties': (
                config_domain.Registry.get_config_property_schemas()),
            'computed_properties': (
                config_domain.Registry.get_computed_property_names()),
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
                exp_services.delete_demo(unicode(exploration_id))
                exp_services.load_demo(unicode(exploration_id))
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
            elif self.payload.get('action') == 'refresh_computed_property':
                computed_property_name = self.payload.get(
                    'computed_property_name')
                config_domain.Registry.get_config_property(
                    computed_property_name).refresh_default_value()
            elif self.payload.get('action') == 'start_new_job':
                for klass in jobs_registry.JOB_MANAGER_CLASSES:
                    if klass.__name__ == self.payload.get('job_type'):
                        klass.enqueue(klass.create_new())
                        break
            elif self.payload.get('action') == 'cancel_job':
                job_id = self.payload.get('job_id')
                job_type = self.payload.get('job_type')
                for klass in jobs_registry.JOB_MANAGER_CLASSES:
                    if klass.__name__ == self.payload.get('job_type'):
                        klass.cancel(job_id, self.user_id)
                        break
            elif self.payload.get('action') == 'migrate_feedback':
                self._migrate_feedback()

            self.render_json({})
        except Exception as e:
            self.render_json({'error': unicode(e)})
            raise
