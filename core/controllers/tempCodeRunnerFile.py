

"""Tests for the skill editor page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import caching_services
from core.domain import role_services
from core.domain import skill_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import utils

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class BaseSkillEditorControllerTests(test_utils.GenericTestBase):

    def setUp(self):
        """Completes the sign-up process for the various users."""
        super(BaseSkillEditorControllerTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.set_admins([self.ADMIN_USERNAME])

        self.admin = user_services.UserActionsInfo(self.admin_id)
        self.skill_id = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id, self.admin_id, description='Description')
        self.skill_id_2 = skill_services.get_new_skill_id()
        self.save_new_skill(
            self.skill_id_2, self.admin_id, description='Description')
        self.topic_id = topic_services.get_new_topic_id()
        subtopic = topic_domain.Subtopic.create_default_subtopic(
            1, 'Subtopic1')
        subtopic.skill_ids = [self.skill_id]
        self.save_new_topic(
            self.topic_id, self.admin_id, name='Name',
            abbreviated_name='name', url_fragment='name',
            description='Description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[subtopic], next_subtopic_id=2)

    def delete_skill_model_and_memcache(self, user_id, skill_id):
        """Deletes skill model and memcache corresponding to the given skill
        id.
        """
        skill_model = skill_models.SkillModel.get(skill_id)
        skill_model.delete(user_id, 'Delete skill model.')
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_SKILL, None, [skill_id])

    def _mock_update_skill_raise_exception(
            self, unused_committer_id, unused_skill_id, unused_change_list,
            unused_commit_message):
        """Mocks skill updates. Always fails by raising a validation error."""
        raise utils.ValidationError()
