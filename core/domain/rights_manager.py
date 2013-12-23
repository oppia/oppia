# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Domain objects and functions that manage rights for various user actions."""

__author__ = 'Sean Lip'


from core.platform import models
current_user_services = models.Registry.import_current_user_services()
(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


EXPLORATION_STATUS_PRIVATE = 'private'
EXPLORATION_STATUS_TENTATIVELY_PUBLIC = 'tentatively_public'
EXPLORATION_STATUS_PUBLIC = 'public'
EXPLORATION_STATUS_PUBLICIZED = 'publicized'


class Actor(object):
    """Domain object for a user with various rights.

    Due to GAE limitations, this class should only ever be invoked with a
    user_id that is equal to the user_id of the current request.
    """

    def __init__(self, user_id):
        self.user_id = user_id

    def _get_exp_rights_model(self, exploration_id):
        return exp_models.ExplorationRightsModel.get_by_id(exploration_id)

    def _is_super_admin(self):
        return current_user_services.is_current_user_admin(None)

    def _is_admin(self):
        return self._is_super_admin()

    def _is_moderator(self):
        return self._is_admin()

    def _is_owner(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.owners:
            return True
        return False

    def _is_editor(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.editors:
            return True
        return False

    def _is_viewer(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if exp_rights.community_owned or self.user_id in exp_rights.viewers:
            return True
        return False

    def can_edit(self, exploration_id):
        return (self._is_editor(exploration_id) or
                self._is_owner(exploration_id) or self._is_admin())

    def can_view(self, exploration_id):
        return (self._is_viewer(exploration_id) or
                self._is_editor(exploration_id) or
                self._is_viewer(exploration_id) or self._is_admin())

    def can_delete(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = self._get_exp_rights_model(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_PRIVATE and
                self._is_owner(exploration_id))

    def can_publish(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = self._get_exp_rights_model(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_PRIVATE and
                self._is_owner(exploration_id))

    def can_unpublish(self, exploration_id):
        if self._is_admin():
            return True

        exp_rights = self._get_exp_rights_model(exploration_id)
        return (exp_rights.status == EXPLORATION_STATUS_TENTATIVELY_PUBLIC and
                self._is_owner(exploration_id))

    def can_modify_roles(self, exploration_id):
        return self._is_admin() or self._is_owner(exploration_id)

    def can_accept_submitted_change(self, exploration_id):
        return (self._is_admin() or self._is_editor(exploration_id) or
                self._is_owner(exploration_id))

    def can_submit_change_for_review(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if exp_rights.status == EXPLORATION_STATUS_PRIVATE:
            return self.can_edit(exploration_id)
        return True

    def can_make_minor_edit(self, exploration_id):
        return self.can_submit_change_for_review(exploration_id)

    def can_send_feedback(self, exploration_id):
        return True

    def can_publicize(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if (exp_rights.status == EXPLORATION_STATUS_PRIVATE or
                exp_rights.status == EXPLORATION_STATUS_PUBLICIZED):
            return False
        return self._is_admin()

    def can_unpublicize(self, exploration_id):
        exp_rights = self._get_exp_rights_model(exploration_id)
        if exp_rights.status != EXPLORATION_STATUS_PUBLICIZED:
            return False
        return self._is_admin()
