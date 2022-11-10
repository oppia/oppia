# coding: utf-8

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

"""Controllers for the editor view."""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core import utils
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.controllers import domain_objects_validator as objects_validator
from core.domain import email_manager
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import image_validation_services
from core.domain import question_services
from core.domain import rights_manager
from core.domain import search_services
from core.domain import state_domain
from core.domain import stats_domain
from core.domain import stats_services
from core.domain import user_services


def _require_valid_version(version_from_payload, exploration_version):
    """Check that the payload version matches the given exploration version."""

    if version_from_payload != exploration_version:
        raise base.BaseHandler.InvalidInputException(
            'Trying to update version %s of exploration from version %s, '
            'which is too old. Please reload the page and try again.'
            % (exploration_version, version_from_payload))


# Common schemas used in this file.
SCHEMA_FOR_EXPLORATION_ID = {
    'type': 'basestring',
    'validators': [{
        'id': 'is_regex_matched',
        'regex_pattern': constants.ENTITY_ID_REGEX
    }]
}
SCHEMA_FOR_VERSION = {
    'type': 'int',
    'validators': [{
        'id': 'is_at_least',
        # Version must be greater than zero.
        'min_value': 1
    }]
}


class EditorHandler(base.BaseHandler):
    """Base class for all handlers for the editor page."""

    URL_PATH_ARGS_SCHEMAS = {}
    HANDLER_ARGS_SCHEMAS = {}


class ExplorationPage(EditorHandler):
    """The editor page for a single exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_play_exploration
    def get(self, unused_exploration_id):
        """Handles GET requests."""

        self.render_template('exploration-editor-page.mainpage.html')


class ExplorationHandler(EditorHandler):
    """Page with editor data for a single exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': SCHEMA_FOR_VERSION,
                'default_value': None
            },
            'apply_draft': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
            }
        },
        'PUT': {
            'version': {
                'schema': SCHEMA_FOR_VERSION
            },
            'commit_message': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'has_length_at_most',
                        'max_value': constants.MAX_COMMIT_MESSAGE_LENGTH
                    }]
                },
                'default_value': None
            },
            'change_list': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': exp_domain.ExplorationChange
                    }
                }
            }
        },
        'DELETE': {}
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Gets the data for the exploration overview page."""
        # 'apply_draft' and 'v'(version) are optional parameters because the
        # exploration history tab also uses this handler, and these parameters
        # are not used by that tab.
        version = self.normalized_request.get('v')
        apply_draft = self.normalized_request.get('apply_draft')

        user_settings = user_services.get_user_settings(
            self.user_id, strict=False
        )
        has_seen_editor_tutorial = False
        has_seen_translation_tutorial = False
        if user_settings is not None:
            if user_settings.last_started_state_editor_tutorial:
                has_seen_editor_tutorial = True
            if user_settings.last_started_state_translation_tutorial:
                has_seen_translation_tutorial = True

        try:
            exploration_data = exp_services.get_user_exploration_data(
                self.user_id, exploration_id, apply_draft=apply_draft,
                version=version)
            exploration_data['show_state_editor_tutorial_on_load'] = (
                self.user_id and not has_seen_editor_tutorial)
            exploration_data['show_state_translation_tutorial_on_load'] = (
                self.user_id and not has_seen_translation_tutorial)
            exploration_data['exploration_is_linked_to_story'] = (
                exp_services.get_story_id_linked_to_exploration(
                    exploration_id) is not None)
        except Exception as e:
            raise self.PageNotFoundException from e

        self.values.update(exploration_data)
        self.render_json(self.values)

    @acl_decorators.can_save_exploration
    def put(self, exploration_id):
        """Updates properties of the given exploration."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        version = self.normalized_payload.get('version')

        if version > exploration.version:
            raise base.BaseHandler.InvalidInputException(
                'Trying to update version %s of exploration from version %s, '
                'which is not possible. Please reload the page and try again.'
                % (exploration.version, version))
        if not exploration.edits_allowed:
            raise base.BaseHandler.InvalidInputException(
                'This exploration cannot be edited. Please contact the admin.')

        commit_message = self.normalized_payload.get('commit_message')
        change_list = self.normalized_payload.get('change_list')

        changes_are_mergeable = exp_services.are_changes_mergeable(
            exploration_id, version, change_list)
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        can_edit = rights_manager.check_can_edit_activity(
            self.user, exploration_rights)
        can_voiceover = rights_manager.check_can_voiceover_activity(
            self.user, exploration_rights)

        try:
            if can_edit and changes_are_mergeable:
                exp_services.update_exploration(
                    self.user_id, exploration_id, change_list, commit_message)
            elif can_voiceover and changes_are_mergeable:
                exp_services.update_exploration(
                    self.user_id, exploration_id, change_list, commit_message,
                    is_by_voice_artist=True)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        exploration_data = exp_services.get_user_exploration_data(
            self.user_id, exploration_id)

        self.values.update(exploration_data)
        self.render_json(self.values)

    @acl_decorators.can_delete_exploration
    def delete(self, exploration_id):
        """Deletes the given exploration."""

        log_debug_string = '(%s) %s tried to delete exploration %s' % (
            self.roles, self.user_id, exploration_id)
        logging.debug(log_debug_string)

        is_exploration_cloned = rights_manager.is_exploration_cloned(
            exploration_id)
        exp_services.delete_exploration(
            self.user_id, exploration_id, force_deletion=is_exploration_cloned)

        log_info_string = '(%s) %s deleted exploration %s' % (
            self.roles, self.user_id, exploration_id)
        logging.info(log_info_string)
        self.render_json(self.values)


class UserExplorationPermissionsHandler(EditorHandler):
    """Handles user permissions for a particular exploration."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {}
    }

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Gets the user permissions for an exploration."""
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        self.values.update({
            'can_delete': rights_manager.check_can_delete_activity(
                self.user, exploration_rights),
            'can_edit': rights_manager.check_can_edit_activity(
                self.user, exploration_rights),
            'can_modify_roles': (
                rights_manager.check_can_modify_core_activity_roles(
                    self.user, exploration_rights)),
            'can_publish': rights_manager.check_can_publish_activity(
                self.user, exploration_rights),
            'can_release_ownership': (
                rights_manager.check_can_release_ownership(
                    self.user, exploration_rights)),
            'can_voiceover': (
                rights_manager.check_can_voiceover_activity(
                    self.user, exploration_rights)),
            'can_unpublish': rights_manager.check_can_unpublish_activity(
                self.user, exploration_rights),
            'can_manage_voice_artist':
                rights_manager.check_can_manage_voice_artist_in_activity(
                    self.user, exploration_rights),
        })
        self.render_json(self.values)


class ExplorationRightsHandler(EditorHandler):
    """Handles management of exploration editing rights."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'version': {
                'schema': SCHEMA_FOR_VERSION
            },
            'make_community_owned': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
            },
            'new_member_username': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'new_member_role': {
                'schema': {
                    'type': 'basestring',
                    'choices': feconf.ALLOWED_ACTIVITY_ROLES
                },
                'default_value': None
            },
            'viewable_if_private': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': None
            }
        },
        'DELETE': {
            'username': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_modify_exploration_roles
    def put(self, exploration_id):
        """Updates the editing rights for the given exploration."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        version = self.normalized_payload.get('version')
        _require_valid_version(version, exploration.version)

        make_community_owned = (
            self.normalized_payload.get('make_community_owned'))
        new_member_username = self.normalized_payload.get('new_member_username')
        new_member_role = self.normalized_payload.get('new_member_role')
        viewable_if_private = self.normalized_payload.get('viewable_if_private')

        if new_member_username:
            new_member_id = user_services.get_user_id_from_username(
                new_member_username)
            if new_member_id is None:
                raise self.InvalidInputException(
                    'Sorry, we could not find the specified user.')
            if new_member_id == self.user_id:
                raise self.InvalidInputException(
                    'Users are not allowed to assign other roles to themselves')
            rights_manager.assign_role_for_exploration(
                self.user, exploration_id, new_member_id, new_member_role)
            email_manager.send_role_notification_email(
                self.user_id, new_member_id, new_member_role, exploration_id,
                exploration.title)

        elif make_community_owned:
            exploration = exp_fetchers.get_exploration_by_id(exploration_id)
            try:
                exploration.validate(strict=True)
            except utils.ValidationError as e:
                raise self.InvalidInputException(e)

            rights_manager.release_ownership_of_exploration(
                self.user, exploration_id)

        elif viewable_if_private is not None:
            rights_manager.set_private_viewability_of_exploration(
                self.user, exploration_id, viewable_if_private)

        else:
            raise self.InvalidInputException(
                'No change was made to this exploration.')

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })

    @acl_decorators.can_modify_exploration_roles
    def delete(self, exploration_id):
        """Deletes user roles from the exploration."""
        username = self.normalized_request.get('username')
        user_id = user_services.get_user_id_from_username(username)
        if user_id is None:
            raise self.InvalidInputException(
                'Sorry, we could not find the specified user.')
        if self.user.user_id == user_id:
            raise self.InvalidInputException(
                'Sorry, users cannot remove their own roles.')

        rights_manager.deassign_role_for_exploration(
            self.user, exploration_id, user_id)
        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })


class ExplorationStatusHandler(EditorHandler):
    """Handles publishing of an exploration."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'make_public': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
            }
        }
    }

    def _publish_exploration(self, exploration_id):
        """Publish an exploration.

        Args:
            exploration_id: str. Id of the exploration.

        Raises:
            InvalidInputException. Given exploration is invalid.
        """
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        try:
            exploration.validate(strict=True)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        exp_services.publish_exploration_and_update_user_profiles(
            self.user, exploration_id)
        exp_services.index_explorations_given_ids([exploration_id])

    @acl_decorators.can_publish_exploration
    def put(self, exploration_id):
        make_public = self.normalized_payload.get('make_public')

        if make_public:
            self._publish_exploration(exploration_id)

        self.render_json({
            'rights': rights_manager.get_exploration_rights(
                exploration_id).to_dict()
        })


class ExplorationModeratorRightsHandler(EditorHandler):
    """Handles management of exploration rights by moderators."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'email_body': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'version': {
                'schema': SCHEMA_FOR_VERSION
            }
        }
    }

    @acl_decorators.can_access_moderator_page
    def put(self, exploration_id):
        """Unpublishes the given exploration, and sends an email to all its
        owners.
        """
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        email_body = self.normalized_payload.get('email_body')
        version = self.normalized_payload.get('version')
        _require_valid_version(version, exploration.version)

        # If moderator emails can be sent, check that all the prerequisites are
        # satisfied, otherwise do nothing.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            if not email_body:
                raise self.InvalidInputException(
                    'Moderator actions should include an email to the '
                    'recipient.')
            email_manager.require_moderator_email_prereqs_are_satisfied()

        # Unpublish exploration.
        rights_manager.unpublish_exploration(self.user, exploration_id)
        search_services.delete_explorations_from_search_index([exploration_id])
        exp_rights = rights_manager.get_exploration_rights(exploration_id)

        # If moderator emails can be sent, send an email to the all owners of
        # the exploration notifying them of the change.
        if feconf.REQUIRE_EMAIL_ON_MODERATOR_ACTION:
            for owner_id in exp_rights.owner_ids:
                email_manager.send_moderator_action_email(
                    self.user_id, owner_id, 'unpublish_exploration',
                    exploration.title, email_body)

        self.render_json({
            'rights': exp_rights.to_dict(),
        })


class UserExplorationEmailsHandler(EditorHandler):
    """Handles management of user email notification preferences for this
    exploration.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'mute': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': None
            },
            'message_type': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        feconf.MESSAGE_TYPE_FEEDBACK,
                        feconf.MESSAGE_TYPE_SUGGESTION
                    ]
                }
            }
        }
    }

    @acl_decorators.can_edit_exploration
    def put(self, exploration_id):
        """Updates the email notification preferences for the given exploration.

        Args:
            exploration_id: str. The exploration id.

        Raises:
            InvalidInputException. Invalid message type.
        """

        mute = self.normalized_payload.get('mute')
        message_type = self.normalized_payload.get('message_type')

        if message_type == feconf.MESSAGE_TYPE_FEEDBACK:
            user_services.set_email_preferences_for_exploration(
                self.user_id, exploration_id, mute_feedback_notifications=mute)
        elif message_type == feconf.MESSAGE_TYPE_SUGGESTION:
            user_services.set_email_preferences_for_exploration(
                self.user_id, exploration_id,
                mute_suggestion_notifications=mute)

        exploration_email_preferences = (
            user_services.get_email_preferences_for_exploration(
                self.user_id, exploration_id))
        self.render_json({
            'email_preferences': exploration_email_preferences.to_dict()
        })


class ExplorationFileDownloader(EditorHandler):
    """Downloads an exploration as a zip file, or dict of YAML strings
    representing states.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_DOWNLOADABLE
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'v': {
                'schema': SCHEMA_FOR_VERSION,
                'default_value': None
            },
            'output_format': {
                'schema': {
                    'type': 'basestring',
                    'choices': [
                        feconf.OUTPUT_FORMAT_ZIP,
                        feconf.OUTPUT_FORMAT_JSON
                    ]
                },
                'default_value': feconf.OUTPUT_FORMAT_ZIP
            }
        }
    }

    @acl_decorators.can_download_exploration
    def get(self, exploration_id):
        """Handles GET requests."""
        exploration = exp_fetchers.get_exploration_by_id(exploration_id)
        version = self.normalized_request.get('v')
        output_format = self.normalized_request.get('output_format')

        if version is None:
            version = exploration.version

        # If the title of the exploration has changed, we use the new title.
        if not exploration.title:
            init_filename = 'oppia-unpublished_exploration-v%s.zip' % version
        else:
            init_filename = 'oppia-%s-v%s.zip' % (
                exploration.title.replace(' ', ''), version)
        filename = utils.to_ascii(init_filename)

        if output_format == feconf.OUTPUT_FORMAT_ZIP:
            self.render_downloadable_file(
                exp_services.export_to_zip_file(
                    exploration_id, version=version),
                filename, 'text/plain')
        elif output_format == feconf.OUTPUT_FORMAT_JSON:
            self.render_json(exp_services.export_states_to_yaml(
                exploration_id, version=version))


class StateYamlHandler(EditorHandler):
    """Given a representation of a state, converts it to a YAML string.

    Note that this handler is stateless; it does not make use of the storage
    layer.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'state_dict': {
                'schema': {
                    'type': 'object_dict',
                    'validation_method': objects_validator.validate_state_dict
                }
            },
            'width': {
                'schema': {
                    'type': 'int',
                    'validators': [{
                        'id': 'is_at_least',
                        # Width must be greater than zero.
                        'min_value': 1
                    }]
                }
            }
        }
    }

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles POST requests."""
        state_dict = self.normalized_payload.get('state_dict')
        width = self.normalized_payload.get('width')

        self.render_json({
            'yaml': state_domain.State.convert_state_dict_to_yaml(
                state_dict, width),
        })


class ExplorationSnapshotsHandler(EditorHandler):
    """Returns the exploration snapshot history."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests."""

        snapshots = exp_services.get_exploration_snapshots_metadata(
            exploration_id)

        # Patch `snapshots` to use the editor's display name.
        snapshots_committer_ids = [
            snapshot['committer_id'] for snapshot in snapshots]
        committer_usernames = user_services.get_usernames(
            snapshots_committer_ids)
        for index, snapshot in enumerate(snapshots):
            snapshot['committer_id'] = committer_usernames[index]

        self.render_json({
            'snapshots': snapshots,
        })


class ExplorationCheckRevertValidHandler(EditorHandler):
    """Checks if an older version of an exploration is valid."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        },
        'version': {
            'schema': SCHEMA_FOR_VERSION
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_edit_exploration
    def get(self, exploration_id, version):
        """Handles GET requests."""
        info = exp_services.get_exploration_validation_error(
            exploration_id, version)
        self.render_json({'valid': not info, 'details': info})


class ExplorationRevertHandler(EditorHandler):
    """Reverts an exploration to an older version."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'current_version': {
                'schema': SCHEMA_FOR_VERSION
            },
            'revert_to_version': {
                'schema': SCHEMA_FOR_VERSION
            }
        }
    }

    @acl_decorators.can_edit_exploration
    def post(self, exploration_id):
        """Handles POST requests."""
        current_version = self.normalized_payload.get('current_version')
        revert_to_version = self.normalized_payload.get('revert_to_version')

        if revert_to_version >= current_version:
            raise self.InvalidInputException(
                'Cannot revert to version %s from version %s.' %
                (revert_to_version, current_version))

        exp_services.discard_draft(exploration_id, self.user_id)
        exp_services.revert_exploration(
            self.user_id, exploration_id, current_version, revert_to_version)
        self.render_json({})


class ExplorationStatisticsHandler(EditorHandler):
    """Returns statistics for an exploration. This is the handler for the new
    statistics framework.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id):
        """Handles GET requests."""
        current_exploration = exp_fetchers.get_exploration_by_id(
            exploration_id)

        self.render_json(stats_services.get_exploration_stats(
            exploration_id, current_exploration.version).to_frontend_dict())


class StateInteractionStatsHandler(EditorHandler):
    """Returns detailed learner answer statistics for a state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        },
        'state_name': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_view_exploration_stats
    def get(self, exploration_id, state_name):
        """Handles GET requests."""
        current_exploration = exp_fetchers.get_exploration_by_id(
            exploration_id)

        if state_name not in current_exploration.states:
            logging.exception('Could not find state: %s' % state_name)
            logging.exception('Available states: %s' % (
                list(current_exploration.states.keys())))
            raise self.PageNotFoundException

        # TODO(#11475): Return visualizations info based on Apache Beam job.
        self.render_json({'visualizations_info': []})


class FetchIssuesHandler(EditorHandler):
    """Handler used for retrieving the list of unresolved issues in an
    exploration. This removes the invalid issues and returns the remaining
    unresolved ones.
    """

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {
            'exp_version': {
                'schema': SCHEMA_FOR_VERSION
            }
        }
    }

    @acl_decorators.can_view_exploration_stats
    def get(self, exp_id):
        """Handles GET requests."""
        exp_version = self.normalized_request.get('exp_version')
        exp_issues = stats_services.get_exp_issues(
            exp_id, exp_version, strict=False
        )
        if exp_issues is None:
            raise self.PageNotFoundException(
                'Invalid version %s for exploration ID %s'
                % (exp_version, exp_id))
        unresolved_issues = []
        for issue in exp_issues.unresolved_issues:
            if issue.is_valid:
                unresolved_issues.append(issue)
        exp_issues.unresolved_issues = unresolved_issues
        exp_issues_dict = exp_issues.to_dict()
        self.render_json(exp_issues_dict)


class FetchPlaythroughHandler(EditorHandler):
    """Handler used for retrieving a playthrough."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        },
        'playthrough_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_view_exploration_stats
    def get(self, unused_exploration_id, playthrough_id):
        """Handles GET requests."""
        playthrough = stats_services.get_playthrough_by_id(playthrough_id)
        if playthrough is None:
            raise self.PageNotFoundException(
                'Invalid playthrough ID %s' % (playthrough_id))
        self.render_json(playthrough.to_dict())


class ResolveIssueHandler(EditorHandler):
    """Handler used for resolving an issue. Currently, when an issue is
    resolved, the issue is removed from the unresolved issues list in the
    ExplorationIssuesModel instance, and all corresponding playthrough
    instances are deleted.
    """

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'exp_issue_dict': {
                'schema': {
                    'type': 'object_dict',
                    'object_class': stats_domain.ExplorationIssue,
                    'new_key_for_argument': 'exp_issue_object'
                },
                'default_value': None
            },
            'exp_version': {
                'schema': SCHEMA_FOR_VERSION
            }
        }
    }

    @acl_decorators.can_edit_exploration
    def post(self, exp_id):
        """Handles POST requests."""
        exp_issue_object = self.normalized_payload.get('exp_issue_object')
        exp_version = self.normalized_payload.get('exp_version')

        exp_issues = stats_services.get_exp_issues(
            exp_id, exp_version, strict=False
        )
        if exp_issues is None:
            raise self.PageNotFoundException(
                'Invalid exploration ID %s' % (exp_id))

        # Check that the passed in issue actually exists in the exploration
        # issues instance.
        issue_to_remove = None
        for issue in exp_issues.unresolved_issues:
            if issue == exp_issue_object:
                issue_to_remove = issue
                break

        if not issue_to_remove:
            raise self.PageNotFoundException(
                'Exploration issue does not exist in the list of issues for '
                'the exploration with ID %s' % exp_id)

        # Remove the issue from the unresolved issues list.
        exp_issues.unresolved_issues.remove(issue_to_remove)

        # Update the exploration issues instance and delete the playthrough
        # instances.
        stats_services.delete_playthroughs_multi(
            issue_to_remove.playthrough_ids)
        stats_services.save_exp_issues_model(exp_issues)

        self.render_json({})


class ImageUploadHandler(EditorHandler):
    """Handles image uploads."""

    _decorator = None
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {
            'schema': {
                'type': 'basestring'
            }
        },
        'entity_id': {
            'schema': {
                'type': 'basestring'
            }
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {
            'image': {
                'schema': {
                    'type': 'basestring'
                }
            },
            'filename': {
                'schema': {
                    'type': 'basestring',
                    'validators': [{
                        'id': 'is_regex_matched',
                        'regex_pattern': r'\w+[.]\w+'
                    }]
                }
            },
            'filename_prefix': {
                'schema': {
                    'type': 'basestring',
                    'choices': ['thumbnail', 'image']
                },
                'default_value': constants.ASSET_TYPE_IMAGE
            }
        }
    }

    @acl_decorators.can_edit_entity
    def post(self, entity_type, entity_id):
        """Saves an image uploaded by a content creator."""

        raw = self.normalized_request.get('image')
        filename = self.normalized_payload.get('filename')
        filename_prefix = self.normalized_payload.get('filename_prefix')

        try:
            file_format = image_validation_services.validate_image_and_filename(
                raw, filename, entity_type)
        except utils.ValidationError as e:
            raise self.InvalidInputException(e)

        fs = fs_services.GcsFileSystem(entity_type, entity_id)
        filepath = '%s/%s' % (
            filename_prefix, filename)

        if fs.isfile(filepath):
            raise self.InvalidInputException(
                'A file with the name %s already exists. Please choose a '
                'different name.' % filename)
        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            filename, entity_type, entity_id, raw, filename_prefix,
            image_is_compressible)

        self.render_json({'filename': filename})


class StartedTutorialEventHandler(EditorHandler):
    """Records that this user has started the state editor tutorial."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'POST': {}
    }

    @acl_decorators.can_play_exploration
    def post(self, unused_exploration_id):
        """Handles GET requests."""
        user_services.record_user_started_state_editor_tutorial(self.user_id)
        self.render_json({})


class EditorAutosaveHandler(ExplorationHandler):
    """Handles requests from the editor for draft autosave."""

    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'version': {
                'schema': SCHEMA_FOR_VERSION
            },
            'change_list': {
                'schema': {
                    'type': 'list',
                    'items': {
                        'type': 'object_dict',
                        'object_class': exp_domain.ExplorationChange
                    }
                }
            }
        },
        'POST': {},
        # Below two methods are not defined in handler class but they must be
        # present in schema since these two are inherited from its parent class.
        'GET': {
            'v': {
                'schema': SCHEMA_FOR_VERSION,
                'default_value': None
            },
            'apply_draft': {
                'schema': {
                    'type': 'bool'
                },
                'default_value': False
            }
        },
        'DELETE': {}
    }

    @acl_decorators.can_save_exploration
    def put(self, exploration_id):
        """Handles PUT requests for draft updation."""
        # Raise an Exception if the draft change list fails non-strict
        # validation.
        change_list = self.normalized_payload.get('change_list')
        version = self.normalized_payload.get('version')
        exploration_rights = rights_manager.get_exploration_rights(
            exploration_id)
        can_edit = rights_manager.check_can_edit_activity(
            self.user, exploration_rights)
        can_voiceover = rights_manager.check_can_voiceover_activity(
            self.user, exploration_rights)

        try:
            if can_edit:
                exp_services.create_or_update_draft(
                    exploration_id, self.user_id, change_list, version,
                    datetime.datetime.utcnow())
            elif can_voiceover:
                exp_services.create_or_update_draft(
                    exploration_id, self.user_id, change_list, version,
                    datetime.datetime.utcnow(), is_by_voice_artist=True)
        except utils.ValidationError as e:
            # We leave any pre-existing draft changes in the datastore.
            raise self.InvalidInputException(e)

        exp_user_data = exp_services.get_user_exploration_data(
            self.user_id, exploration_id)
        # If the draft_change_list_id is False, have the user discard the draft
        # changes. We save the draft to the datastore even if the changes are
        # not mergeable, so that it is available for recovery later.
        self.render_json({
            'draft_change_list_id': exp_user_data['draft_change_list_id'],
            'is_version_of_draft_valid': exp_services.is_version_of_draft_valid(
                exploration_id, version),
            'changes_are_mergeable': exp_services.are_changes_mergeable(
                exploration_id, version, change_list)})

    @acl_decorators.can_save_exploration
    def post(self, exploration_id):
        """Handles POST request for discarding draft changes."""
        exp_services.discard_draft(exploration_id, self.user_id)
        self.render_json({})


class StateAnswerStatisticsHandler(EditorHandler):
    """Returns basic learner answer statistics for a state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_view_exploration_stats
    def get(self, unused_exploration_id):
        """Handles GET requests."""
        # TODO(#11475): Return visualizations info based on Apache Beam job.
        self.render_json({'answers': {}, 'interaction_ids': {}})


class TopUnresolvedAnswersHandler(EditorHandler):
    """Returns a list of top N unresolved answers."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {'GET': {}}

    @acl_decorators.can_edit_exploration
    def get(self, unused_exploration_id):
        """Handles GET requests for unresolved answers."""
        # TODO(#11475): Return visualizations info based on Apache Beam job.
        self.render_json({'unresolved_answers': []})


class ExplorationEditsAllowedHandler(EditorHandler):
    """Toggles whether exploration can be edited."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'PUT': {
            'edits_are_allowed': {
                'schema': {
                    'type': 'bool',
                }
            }
        }
    }

    @acl_decorators.can_access_admin_page
    def put(self, exploration_id):
        """Handles PUT request to set whether exploration can be edited."""
        exp_services.set_exploration_edits_allowed(
            exploration_id,
            self.normalized_payload.get('edits_are_allowed'))
        self.render_json({})


class LearnerAnswerInfoHandler(EditorHandler):
    """Handles the learner answer info for an exploration state."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'entity_type': {
            'schema': {
                'type': 'basestring',
                'choices': [
                    feconf.ENTITY_TYPE_EXPLORATION,
                    feconf.ENTITY_TYPE_QUESTION
                ]
            }
        },
        'entity_id': {
            'schema': SCHEMA_FOR_EXPLORATION_ID
        }
    }
    HANDLER_ARGS_SCHEMAS = {
        'GET': {},
        'DELETE': {
            'state_name': {
                'schema': {
                    'type': 'basestring'
                },
                'default_value': None
            },
            'learner_answer_info_id': {
                'schema': {
                    'type': 'basestring'
                }
            }
        }
    }

    @acl_decorators.can_play_entity
    def get(self, entity_type, entity_id):
        """Handles the GET requests for learner answer info for an
        exploration state.
        """
        if not constants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE:
            raise self.PageNotFoundException

        learner_answer_info_data = []

        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            exp = exp_fetchers.get_exploration_by_id(entity_id)
            for state_name in exp.states:
                state_reference = (
                    stats_services.get_state_reference_for_exploration(
                        entity_id, state_name))
                learner_answer_details = (
                    stats_services.get_learner_answer_details(
                        feconf.ENTITY_TYPE_EXPLORATION, state_reference))
                if learner_answer_details is not None:
                    learner_answer_info_data.append({
                        'state_name': state_name,
                        'interaction_id': learner_answer_details.interaction_id,
                        'customization_args': exp.states[state_name].interaction
                                              .to_dict()['customization_args'],
                        'learner_answer_info_dicts': [
                            learner_answer_info.to_dict() for
                            learner_answer_info in
                            learner_answer_details.learner_answer_info_list]
                    })
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            question = question_services.get_question_by_id(entity_id)
            state_reference = stats_services.get_state_reference_for_question(
                entity_id)
            learner_answer_details = stats_services.get_learner_answer_details(
                feconf.ENTITY_TYPE_QUESTION, state_reference)
            if learner_answer_details is not None:
                learner_answer_info_dicts = [
                    learner_answer_info.to_dict() for learner_answer_info in
                    learner_answer_details.learner_answer_info_list]
            learner_answer_info_data = {
                'interaction_id': learner_answer_details.interaction_id,
                'customization_args': question.question_state_data.interaction
                                      .to_dict()['customization_args'],
                'learner_answer_info_dicts': learner_answer_info_dicts
            }

        self.render_json({
            'learner_answer_info_data': learner_answer_info_data
        })

    @acl_decorators.can_edit_entity
    def delete(self, entity_type, entity_id):
        """Deletes the learner answer info by the given id."""

        if not constants.ENABLE_SOLICIT_ANSWER_DETAILS_FEATURE:
            raise self.PageNotFoundException

        if entity_type == feconf.ENTITY_TYPE_EXPLORATION:
            state_name = self.normalized_request.get('state_name')
            if not state_name:
                raise self.InvalidInputException
            state_reference = (
                stats_services.get_state_reference_for_exploration(
                    entity_id, state_name))
        elif entity_type == feconf.ENTITY_TYPE_QUESTION:
            state_reference = (
                stats_services.get_state_reference_for_question(
                    entity_id))
        learner_answer_info_id = (
            self.normalized_request.get('learner_answer_info_id'))

        stats_services.delete_learner_answer_info(
            entity_type, state_reference, learner_answer_info_id)
        self.render_json({})
