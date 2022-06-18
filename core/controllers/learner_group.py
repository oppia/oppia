# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Controllers for the learner groups."""

from __future__ import annotations
from typing import List

from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import learner_group_domain
from core.domain import learner_group_services
from core.domain import user_services


class LearnerGroupHandler(base.BaseHandler):
    """Handles operations related to the learner groups."""

    @acl_decorators.can_access_learner_dashboard
    def get(self, learner_group_id):
        """Handles GET requests for facilitator's view of learner group."""

        learner_group = (
            learner_group_services.get_facilitator_view_of_learner_group(
                learner_group_id))

        if learner_group is not None:
            self.render_json({
                'learner_group_id': learner_group.id,
                'title': learner_group.title,
                'description': learner_group.description,
                'facilitator': learner_group.facilitator,
                'members': learner_group.members,
                'invitations': learner_group.invitations,
                'subtopic_ids': learner_group.subtopic_ids,
                'stoty_ids': learner_group.story_ids
            })
        else:
            raise self.PageNotFoundException

    @acl_decorators.can_access_teacher_dashboard
    def post(self):
        """Creates a new learner group."""

        title = self.payload.get('group_title')
        description = self.payload.get('group_description')
        members_usernames = self.payload.get('members_usernames')
        invitations_usernames = self.payload.get('invitations_usernames')
        subtopic_ids = self.payload.get('subtopic_ids')
        story_ids = self.payload.get('story_ids')

        members: user_services.get_multi_user_ids_from_usernames(
            members_usernames)
        invitations: user_services.get_multi_user_ids_from_usernames(
            invitations_usernames)

        learner_group_id = learner_group_services.create_learner_group(
            self.user_id, title, description, members,
            invitations, subtopic_ids, story_ids)

        self.values.update({
            'group_id': learner_group_id
        })

        self.render_json(self.values)

    @acl_decorators.can_access_teacher_dashboard
    def put(self, learner_group_id):
        """Updates an existing learner group."""

        title = self.payload.get('group_title')
        description = self.payload.get('group_description')
        members_usernames = self.payload.get('members_usernames')
        invitations_usernames = self.payload.get('invitations_usernames')
        subtopic_ids = self.payload.get('subtopic_ids')
        story_ids = self.payload.get('story_ids')

        is_valid_request = learner_group_services.is_user_a_facilitator(
            self.user_id, learner_group_id)

        if is_valid_request:
            members: user_services.get_multi_user_ids_from_usernames(
                members_usernames)
            invitations: user_services.get_multi_user_ids_from_usernames(
                invitations_usernames)

            learner_group_services.update_learner_group(
                learner_group_id,
                title,
                description,
                self.user_id,
                members,
                invitations,
                subtopic_ids,
                story_ids)
        else:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        self.render_json(self.values)

    @acl_decorators.can_access_teacher_dashboard
    def delete(self, learner_group_id):
        """Deletes a learner group."""

        is_valid_request = learner_group_services.is_user_a_facilitator(
            self.user_id, learner_group_id)

        if is_valid_request:
            learner_group_deleted = (
                learner_group_services.remove_learner_group(learner_group_id))
        else:
            raise self.UnauthorizedUserException(
                'You are not a facilitator of this learner group.')

        self.render_json({
            'learner_group_deleted': learner_group_deleted
        })


class LearnerGroupUserProgressHandler(base.BaseHandler):
    """Handles operations related to the learner group users progress."""

    @acl_decorators.can_access_learner_dashboard
    def get(self, learner_group_id):
        """Handles GET requests for facilitator's view of users progress
        through learner group syllabus.
        """

        learner_group = (
            learner_group_services.get_facilitator_view_of_learner_group(
                learner_group_id))

        if learner_group is not None:
            self.render_json({
                'learner_group_id': learner_group.id,
                'title': learner_group.title,
                'description': learner_group.description,
                'facilitator': learner_group.facilitator,
                'members': learner_group.members,
                'invitations': learner_group.invitations,
                'syllabus': learner_group.syllabus
            })
        else:
            raise self.PageNotFoundException


class LearnerGroupSyllabusHandler(base.BaseHandler):
    """Handles operations related to the learner group syllabus."""

    @acl_decorators.can_access_learner_dashboard
    def get(self, learner_group_id):
        """Handles GET requests for facilitator's view of learner group
        syllabus.
        """

        filter_args = self.payload.get('filter_args')
        filtered_syllabus = (
            learner_group_services.get_filtered_learner_group_syllabus(
                learner_group_id,
                filter_args))

        if filtered_syllabus is not None:
            self.render_json({
                'learner_group_id': learner_group_id,
                'subtopic_summaries': filtered_syllabus.subtopic_summaries,
                'story_summaries': filtered_syllabus.story_summaries
            })
        else:
            raise self.PageNotFoundException
