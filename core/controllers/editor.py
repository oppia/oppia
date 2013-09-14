# Copyright 2012 Google Inc. All Rights Reserved.
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

"""Controllers for the editor view."""

__author__ = 'sll@google.com (Sean Lip)'

from core.controllers import base
from core.domain import exp_services
from core.domain import param_domain
from core.domain import stats_services
from core.domain import value_generators_domain
import utils

import jinja2

EDITOR_MODE = 'editor'
# The maximum number of exploration history snapshots to show by default.
DEFAULT_NUM_SNAPSHOTS = 10


class ExplorationPage(base.BaseHandler):
    """Page describing a single exploration."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        all_value_generators = (
            value_generators_domain.Registry.get_all_generator_classes())

        value_generators_js = ''
        for gid, generator_cls in all_value_generators.iteritems():
            value_generators_js += generator_cls.get_js_template()

        self.values.update({
            'nav_mode': EDITOR_MODE,
            'value_generators_js': jinja2.utils.Markup(value_generators_js)
        })
        self.render_template('editor/editor_exploration.html')


class ExplorationHandler(base.BaseHandler):
    """Page with editor data for a single exploration."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_editor
    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        exploration = exp_services.get_exploration_by_id(exploration_id)

        state_list = {}
        for state_id in exploration.state_ids:
            state_list[state_id] = exp_services.export_state_to_verbose_dict(
                exploration_id, state_id)

        self.values.update({
            'exploration_id': exploration_id,
            'init_state_id': exploration.init_state_id,
            'is_public': exploration.is_public,
            'image_id': exploration.image_id,
            'category': exploration.category,
            'title': exploration.title,
            'editors': exploration.editor_ids,
            'states': state_list,
            'param_changes': exploration.param_change_dicts,
            'param_specs': exploration.param_specs_dict,
            'version': exploration.version,
            # Add information about the most recent versions.
            'snapshots': exp_services.get_exploration_snapshots_metadata(
                exploration_id, DEFAULT_NUM_SNAPSHOTS),
            # Add information for the exploration statistics page.
            'num_visits': stats_services.get_exploration_visit_count(
                exploration_id),
            'num_completions': stats_services.get_exploration_completed_count(
                exploration_id),
            'state_stats': stats_services.get_state_stats_for_exploration(
                exploration_id),
            'imp': stats_services.get_top_improvable_states(
                [exploration_id], 10),
        })
        self.render_json(self.values)

    @base.require_editor
    def post(self, exploration_id):
        """Adds a new state to the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload['version']
        if version != exploration.version:
            raise Exception(
                'Trying to update version %s of exploration from version %s, '
                'which is too old. Please reload the page and try again.'
                % (exploration.version, version))

        state_name = self.payload.get('state_name')
        if not state_name:
            raise self.InvalidInputException('Please specify a state name.')

        exp_services.add_state(self.user_id, exploration_id, state_name)
        state_id = exp_services.convert_state_name_to_id(
            exploration_id, state_name)

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.render_json({
            'version': exploration.version,
            'stateData': exp_services.export_state_to_verbose_dict(
                exploration_id, state_id)
        })

    @base.require_editor
    def put(self, exploration_id):
        """Updates properties of the given exploration."""

        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload['version']
        if version != exploration.version:
            raise Exception(
                'Trying to update version %s of exploration from version %s, '
                'which is too old. Please reload the page and try again.'
                % (exploration.version, version))

        is_public = self.payload.get('is_public')
        category = self.payload.get('category')
        title = self.payload.get('title')
        image_id = self.payload.get('image_id')
        editors = self.payload.get('editors')
        param_specs = self.payload.get('param_specs')
        param_changes = self.payload.get('param_changes')

        if is_public:
            exploration.is_public = True
        if category:
            exploration.category = category
        if title:
            exploration.title = title
        if 'image_id' in self.payload:
            exploration.image_id = None if image_id == 'null' else image_id
        if editors:
            if (exploration.editor_ids and
                    self.user_id == exploration.editor_ids[0]):
                exploration.editor_ids = []
                for email in editors:
                    exploration.add_editor(email)
            else:
                raise self.UnauthorizedUserException(
                    'Only the exploration owner can add new collaborators.')
        if param_specs is not None:
            exploration.param_specs = {
                ps_name: param_domain.ParamSpec.from_dict(ps_val)
                for (ps_name, ps_val) in param_specs.iteritems()
            }
        if param_changes is not None:
            exploration.param_changes = [
                param_domain.ParamChange.from_dict(param_change)
                for param_change in param_changes
            ]

        exp_services.save_exploration(self.user_id, exploration)

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.render_json({
            'version': exploration.version
        })

    @base.require_editor
    def delete(self, exploration_id):
        """Deletes the given exploration."""
        exp_services.delete_exploration(self.user_id, exploration_id)


class StateHandler(base.BaseHandler):
    """Handles state transactions."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @base.require_editor
    def put(self, exploration_id, state_id):
        """Saves updates to a state."""

        if 'resolved_answers' in self.payload:
            stats_services.EventHandler.resolve_answers_for_default_rule(
                exploration_id, state_id, 'submit',
                self.payload.get('resolved_answers'))

        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload['version']
        if version != exploration.version:
            raise Exception(
                'Trying to update version %s of exploration from version %s, '
                'which is too old. Please reload the page and try again.'
                % (exploration.version, version))

        state_name = self.payload.get('state_name')
        param_changes = self.payload.get('param_changes')
        interactive_widget = self.payload.get('interactive_widget')
        interactive_params = self.payload.get('interactive_params')
        interactive_rulesets = self.payload.get('interactive_rulesets')
        sticky_interactive_widget = self.payload.get(
            'sticky_interactive_widget')
        content = self.payload.get('content')

        exp_services.update_state(
            self.user_id, exploration_id, state_id, state_name, param_changes,
            interactive_widget, interactive_params, interactive_rulesets,
            sticky_interactive_widget, content
        )

        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.render_json({
            'version': exploration.version,
            'stateData': exp_services.export_state_to_verbose_dict(
                exploration_id, state_id)
        })

    @base.require_editor
    def delete(self, exploration_id, state_id):
        """Deletes the state with id state_id."""
        # TODO(sll): Add a version check here. This probably involves NOT using
        # delete(), but regarding this as an exploration put() instead. Or the
        # param can be passed via the URL.

        exp_services.delete_state(self.user_id, exploration_id, state_id)
        exploration = exp_services.get_exploration_by_id(exploration_id)
        self.render_json({
            'version': exploration.version
        })


class ExplorationDownloadHandler(base.BaseHandler):
    """Downloads an exploration as a YAML file."""

    @base.require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        filename = 'oppia-%s-v%s' % (
            utils.to_ascii(exploration.title), exploration.version)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.yaml' % filename)

        self.response.write(exp_services.export_to_yaml(exploration_id))
