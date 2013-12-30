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

import imghdr
import logging

from core.controllers import base
from core.domain import config_domain
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import rights_manager
from core.domain import obj_services
from core.domain import stats_services
from core.domain import user_services
from core.domain import value_generators_domain
from core.platform import models
current_user_services = models.Registry.import_current_user_services()
import feconf
import utils

import jinja2

# The number of exploration history snapshots to show by default.
DEFAULT_NUM_SNAPSHOTS = 10


def get_value_generators_js():
    all_value_generators = (
        value_generators_domain.Registry.get_all_generator_classes())
    value_generators_js = ''
    for gid, generator_cls in all_value_generators.iteritems():
        value_generators_js += generator_cls.get_js_template()
    return value_generators_js

VALUE_GENERATORS_JS = config_domain.ComputedProperty(
    'value_generators_js', 'UnicodeString',
    'JavaScript code for the value generators', get_value_generators_js)

OBJECT_EDITORS_JS = config_domain.ComputedProperty(
    'object_editors_js', 'UnicodeString',
    'JavaScript code for the object editors',
    obj_services.get_all_object_editor_js_templates)

EDITOR_PAGE_ANNOUNCEMENT = config_domain.ConfigProperty(
    'editor_page_announcement', 'Html',
    'A persistent announcement to display on top of all editor pages.',
    default_value='')


def _require_valid_version(version_from_payload, exploration_version):
    if version_from_payload is None:
        raise base.BaseHandler.InvalidInputException(
            'Invalid POST request: a version must be specified.')

    if version_from_payload != exploration_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_version, version_from_payload))


def require_editor(handler):
    """Decorator that checks if the user can edit the given entity."""
    def test_editor(self, exploration_id, escaped_state_name=None, **kwargs):
        """Gets the user and exploration id if the user can edit it.

        Args:
            self: the handler instance
            exploration_id: the exploration id
            escaped_state_name: the URL-escaped state name, if it exists
            **kwargs: any other arguments passed to the handler

        Returns:
            The relevant handler, if the user is authorized to edit this
            exploration.

        Raises:
            self.PageNotFoundException: if no such exploration or state exists.
            self.UnauthorizedUserException: if the user exists but does not
                have the right credentials.
        """
        if not self.user_id:
            self.redirect(current_user_services.create_login_url(
                self.request.uri))
            return

        redirect_url = feconf.EDITOR_PREREQUISITES_URL

        if not user_services.has_user_registered_as_editor(self.user_id):
            redirect_url = utils.set_url_query_parameter(
                redirect_url, 'return_url', self.request.uri)
            self.redirect(redirect_url)
            return

        try:
            exploration = exp_services.get_exploration_by_id(exploration_id)
        except:
            raise self.PageNotFoundException

        if not rights_manager.Actor(self.user_id).can_edit(exploration_id):
            raise self.UnauthorizedUserException(
                'You do not have the credentials to edit this exploration.',
                self.user_id)

        if not escaped_state_name:
            return handler(self, exploration_id, **kwargs)

        state_name = self.unescape_state_name(escaped_state_name)
        if state_name not in exploration.states:
            logging.error('Could not find state: %s' % state_name)
            logging.error('Available states: %s' % exploration.states.keys())
            raise self.PageNotFoundException

        return handler(self, exploration_id, state_name, **kwargs)

    return test_editor


class EditorHandler(base.BaseHandler):
    """Base class for all handlers for the editor page."""

    # The page name to use as a key for generating CSRF tokens.
    PAGE_NAME_FOR_CSRF = 'editor'


class ExplorationPage(EditorHandler):
    """Page describing a single exploration."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        # TODO(sll): Consider including the obj_generator html in a ng-template
        # to remove the need for an additional RPC?
        object_editors_js = OBJECT_EDITORS_JS.value
        value_generators_js = VALUE_GENERATORS_JS.value

        self.values.update({
            'announcement': jinja2.utils.Markup(
                EDITOR_PAGE_ANNOUNCEMENT.value),
            'can_publish': rights_manager.Actor(self.user_id).can_publish(
                exploration_id),
            'nav_mode': feconf.NAV_MODE_EDITOR,
            'object_editors_js': jinja2.utils.Markup(object_editors_js),
            'value_generators_js': jinja2.utils.Markup(value_generators_js),
        })
        self.render_template('editor/editor_exploration.html')


class ExplorationHandler(EditorHandler):
    """Page with editor data for a single exploration."""

    PAGE_NAME_FOR_CSRF = 'editor'

    def _get_exploration_data(self, exploration_id):
        """Returns a description of the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)

        states = {}
        for state_name in exploration.states:
            state_frontend_dict = exploration.export_state_to_frontend_dict(
                state_name)
            state_frontend_dict['unresolved_answers'] = (
                stats_services.get_unresolved_answers_for_default_rule(
                    exploration_id, state_name))
            states[state_name] = state_frontend_dict

        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)

        # TODO(sll): Tidy this up; show owners, editors and viewers.
        editor_ids = (
            exploration_rights.owner_ids + exploration_rights.editor_ids)
        editors = user_services.get_human_readable_user_ids(editor_ids)

        return {
            'exploration_id': exploration_id,
            'init_state_name': exploration.init_state_name,
            'is_public': rights_manager.is_exploration_public(exploration_id),
            'is_cloned': rights_manager.is_exploration_cloned(exploration_id),
            'category': exploration.category,
            'title': exploration.title,
            'editors': editors,
            'states': states,
            'param_changes': exploration.param_change_dicts,
            'param_specs': exploration.param_specs_dict,
            'version': exploration.version
        }

    @require_editor
    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        self.values.update(self._get_exploration_data(exploration_id))
        self.render_json(self.values)

    @require_editor
    def put(self, exploration_id):
        """Updates properties of the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        commit_message = self.payload.get('commit_message')
        change_list = self.payload.get('change_list')

        try:
            exp_services.update_exploration(
                self.user_id, exploration_id, change_list, commit_message)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        self.values.update(self._get_exploration_data(exploration_id))
        self.render_json(self.values)

    @require_editor
    def delete(self, exploration_id):
        """Deletes the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        can_delete = rights_manager.Actor(self.user_id).can_delete(
            exploration.id)
        if not can_delete:
            raise self.UnauthorizedUserException(
                'User %s does not have permissions to delete exploration %s' %
                (self.user_id, exploration_id))

        exp_services.delete_exploration(self.user_id, exploration_id)


class ExplorationRightsHandler(EditorHandler):
    """Handles management of exploration editing rights."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def put(self, exploration_id):
        """Updates the editing rights for the given exploration."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        version = self.payload.get('version')
        _require_valid_version(version, exploration.version)

        is_public = self.payload.get('is_public')
        new_editor_email = self.payload.get('new_editor_email')

        if new_editor_email:
            if not rights_manager.Actor(self.user_id).can_modify_roles(
                    exploration_id):
                raise self.UnauthorizedUserException(
                    'Only an owner of this exploration can add new editors.')

            new_editor_id = user_services.get_user_id_from_email(
                new_editor_email)

            if new_editor_id is None:
                raise Exception(
                    'Sorry, we could not find a user with this email address.')

            rights_manager.assign_role(
                self.user_id, exploration_id, new_editor_id,
                rights_manager.ROLE_EDITOR)

        elif is_public:
            exploration = exp_services.get_exploration_by_id(exploration_id)
            try:
                exploration.validate(strict=True)
            except utils.ValidationError as e:
                raise self.InvalidInputException(e)

            rights_manager.publish_exploration(self.user_id, exploration_id)
        else:
            raise self.InvalidInputException(
                'No change was made to this exploration.')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        editors = []
        for editor_id in (
                exploration_rights.owner_ids + exploration_rights.editor_ids):
            username = user_services.get_username(editor_id)
            if username:
                editors.append(username)
            else:
                editors.append('[Awaiting response]')

        # TODO(sll): Also add information about is_public.
        self.render_json({
            'version': exploration.version,
            'editors': editors,
        })


class ResolvedAnswersHandler(EditorHandler):
    """Allows readers' answers for a state to be marked as resolved."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def put(self, exploration_id, state_name):
        """Marks readers' answers as resolved."""
        resolved_answers = self.payload.get('resolved_answers')

        if not isinstance(resolved_answers, list):
            raise self.InvalidInputException(
                'Expected a list of resolved answers; received %s.' %
                resolved_answers)

        if 'resolved_answers' in self.payload:
            stats_services.EventHandler.resolve_answers_for_default_rule(
                exploration_id, state_name, 'submit', resolved_answers)

        self.render_json({})


class ResolvedFeedbackHandler(EditorHandler):
    """Allows readers' feedback for a state to be resolved."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def put(self, exploration_id, state_name):
        """Marks readers' feedback as resolved."""
        feedback_id = self.payload.get('feedback_id')
        new_status = self.payload.get('new_status')

        if not feedback_id:
            raise self.InvalidInputException(
                'Invalid feedback resolution request: no feedback_id given')

        stats_services.EventHandler.resolve_feedback(feedback_id, new_status)

        self.render_json({})


class ExplorationDownloadHandler(EditorHandler):
    """Downloads an exploration as a YAML file."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        exploration = exp_services.get_exploration_by_id(exploration_id)
        filename = 'oppia-%s-v%s' % (
            utils.to_ascii(exploration.title), exploration.version)

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Content-Disposition'] = (
            'attachment; filename=%s.zip' % filename)

        self.response.write(exp_services.export_to_zip_file(exploration_id))


class ExplorationResourcesHandler(EditorHandler):
    """Manages assets associated with an exploration."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        dir_list = fs.listdir('')

        self.render_json({'filepaths': dir_list})


class ExplorationSnapshotsHandler(EditorHandler):
    """Returns the exploration snapshot history."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        snapshots = exp_services.get_exploration_snapshots_metadata(
            exploration_id, DEFAULT_NUM_SNAPSHOTS)

        # Patch `snapshots` to use the editor's display name.
        for snapshot in snapshots:
            if snapshot['committer_id'] != 'admin':
                snapshot['committer_id'] = user_services.get_username(
                    snapshot['committer_id'])

        self.render_json({
            'snapshots': snapshots,
        })


class ExplorationStatisticsHandler(EditorHandler):
    """Returns statistics for an exploration."""

    @require_editor
    def get(self, exploration_id):
        """Handles GET requests."""
        self.render_json({
            'num_visits': stats_services.get_exploration_visit_count(
                exploration_id),
            'num_completions': stats_services.get_exploration_completed_count(
                exploration_id),
            'state_stats': stats_services.get_state_stats_for_exploration(
                exploration_id),
            'imp': stats_services.get_top_improvable_states(
                [exploration_id], 10),
        })


class StateRulesStatsHandler(EditorHandler):
    """Returns detailed reader answer statistics for a state."""

    @require_editor
    def get(self, exploration_id, state_name):
        """Handles GET requests."""
        self.render_json({
            'rules_stats': stats_services.get_state_rules_stats(
                exploration_id, state_name)
        })


class ImageUploadHandler(EditorHandler):
    """Handles image uploads."""

    PAGE_NAME_FOR_CSRF = 'editor'

    @require_editor
    def post(self, exploration_id):
        """Saves an image uploaded by a content creator."""

        raw = self.request.get('image')
        filename = self.payload.get('filename')
        if not raw:
            raise self.InvalidInputException('No image supplied')

        file_format = imghdr.what(None, h=raw)
        if file_format not in feconf.ACCEPTED_IMAGE_FORMATS:
            allowed_formats = ', '.join(feconf.ACCEPTED_IMAGE_FORMATS)
            raise Exception('Image file not recognized: it should be in '
                            'one of the following formats: %s.' %
                            allowed_formats)

        if not filename:
            raise self.InvalidInputException('No filename supplied')
        if '/' in filename or '..' in filename:
            raise self.InvalidInputException(
                'Filenames should not include slashes (/) or consecutive dot '
                'characters.')
        if '.' in filename:
            dot_index = filename.rfind('.')
            primary_name = filename[:dot_index]
            extension = filename[dot_index+1:]
            if extension != file_format:
                raise self.InvalidInputException(
                    'Expected a filename ending in .%s; received %s' %
                    (file_format, filename))
        else:
            primary_name = filename

        filepath = '%s.%s' % (primary_name, file_format)

        fs = fs_domain.AbstractFileSystem(
            fs_domain.ExplorationFileSystem(exploration_id))
        if fs.isfile(filepath):
            raise self.InvalidInputException(
                'A file with the name %s already exists. Please choose a '
                'different name.' % filepath)
        fs.save(self.user_id, filepath, raw)

        self.render_json({'filepath': filepath})


class ChangeListSummaryHandler(EditorHandler):
    """Returns a summary of a changelist applied to a given exploration."""

    @require_editor
    def post(self, exploration_id):
        """Handles POST requests."""
        change_list = self.payload.get('change_list')
        version = self.payload.get('version')
        current_exploration = exp_services.get_exploration_by_id(
            exploration_id)

        if version != current_exploration.version:
            # TODO(sll): Improve this.
            self.render_json({
                'error': (
                    'Sorry! Someone else has edited and committed changes to '
                    'this exploration while you were editing it. We suggest '
                    'opening another browser tab -- which will load the new '
                    'version of the exploration -- then transferring your '
                    'changes there. We will try to make this easier in the '
                    'future -- we have not done it yet because figuring out '
                    'how to merge different people\'s changes is hard. '
                    '(Trying to edit version %s, but the current version is '
                    '%s.).' % (version, current_exploration.version)
                )
            })
        else:
            summary = exp_services.get_summary_of_change_list(
                exploration_id, change_list)
            updated_exploration = exp_services.apply_change_list(
                exploration_id, change_list)
            warning_message = ''
            try:
                updated_exploration.validate(strict=True)
            except utils.ValidationError as e:
                warning_message = str(e)

            self.render_json({
                'summary': summary,
                'warning_message': warning_message
            })


class NewStateTemplateHandler(EditorHandler):
    """Returns the template for a newly-added state."""

    @require_editor
    def post(self, exploration_id):
        """Handles POST requests."""
        new_state_name = self.payload.get('state_name')

        exploration = exp_services.get_exploration_by_id(exploration_id)
        exploration.add_states([new_state_name])
        new_state = exploration.export_state_to_frontend_dict(new_state_name)
        new_state['unresolved_answers'] = {}
        self.render_json({
            'new_state': new_state
        })
