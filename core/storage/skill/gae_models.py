# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Models for storing the skill data models."""

from core.platform import models
import feconf

from google.appengine.ext import ndb

(base_models, user_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.user])


class SkillSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a skill snapshot."""
    pass


class SkillSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a skill snapshot."""
    pass


class SkillModel(base_models.VersionedModel):
    """Model for storing Skills.

    This class should only be imported by the skill services file
    and the skill model test file.
    """
    SNAPSHOT_METADATA_CLASS = SkillSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = SkillSnapshotContentModel
    ALLOW_REVERT = False

    # The description of the skill.
    description = ndb.StringProperty(required=True, indexed=True)
    # The schema version for each of the misconception dicts.
    misconceptions_schema_version = ndb.IntegerProperty(
        required=True, indexed=True)
    # A list of misconceptions associated with the skill, in which each
    # element is a dict.
    misconceptions = ndb.JsonProperty(repeated=True, indexed=False)
    # The ISO 639-1 code for the language this skill is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # The schema version for the skill_contents.
    skill_contents_schema_version = ndb.IntegerProperty(
        required=True, indexed=True)
    # A dict representing the skill contents.
    skill_contents = ndb.JsonProperty(indexed=False)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        super(SkillModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        committer_user_settings_model = (
            user_models.UserSettingsModel.get_by_id(committer_id))
        committer_username = (
            committer_user_settings_model.username
            if committer_user_settings_model else '')

        skill_commit_log_entry = SkillCommitLogEntryModel.create(
            self.id, self.version, committer_id, committer_username,
            commit_type, commit_message, commit_cmds,
            feconf.ACTIVITY_STATUS_PUBLIC, False
        )
        skill_commit_log_entry.skill_id = self.id
        skill_commit_log_entry.put()


class SkillCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to skills.

    A new instance of this model is created and saved every time a commit to
    SkillModel occurs.

    The id for this model is of the form
    'skill-{{SKILL_ID}}-{{SKILL_VERSION}}'.
    """
    # The id of the skill being edited.
    skill_id = ndb.StringProperty(indexed=True, required=True)

    @classmethod
    def _get_instance_id(cls, skill_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            skill_id: str. The id of the skill being edited.
            version: int. The version number of the skill after the commit.

        Returns:
            str. The commit id with the skill id and version number.
        """
        return 'skill-%s-%s' % (skill_id, version)


class SkillSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia Skill.

    This should be used whenever the content blob of the skill is not
    needed (e.g. search results, etc).

    A SkillSummaryModel instance stores the following information:

        id, description, language_code, last_updated, created_on, version.

    The key of each instance is the skill id.
    """

    # The description of the skill.
    description = ndb.StringProperty(required=True, indexed=True)
    # The number of misconceptions associated with the skill.
    misconception_count = ndb.IntegerProperty(required=True, indexed=True)
    # The ISO 639-1 code for the language this skill is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Time when the skill model was last updated (not to be
    # confused with last_updated, which is the time when the
    # skill *summary* model was last updated).
    skill_model_last_updated = ndb.DateTimeProperty(required=True, indexed=True)
    # Time when the skill model was created (not to be confused
    # with created_on, which is the time when the skill *summary*
    # model was created).
    skill_model_created_on = ndb.DateTimeProperty(required=True, indexed=True)
    version = ndb.IntegerProperty(required=True)


class SkillsMasteryModel(base_models.BaseModel):
    """Mastery model of a user for Oppia Skill.

    This model stores progress of each skill for a given user
    and returns skill id.
    """

    # The user id of the currently logged in user.
    user_id = ndb.StringProperty(required=True, indexed=True)
    # The skill id for which degree of mastery is stored.
    skill_id = ndb.StringProperty(required=True, indexed=True)
    # The degree of mastery of the user in a skill.
    degree_of_mastery = ndb.FloatProperty(required=True, indexed=True)

    @classmethod
    def get_something(cls, USER_ID):
        return SkillSummaryModel.query().filter(cls.user_id == USER_ID)
