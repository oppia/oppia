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

from google.appengine.ext import ndb

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class SkillSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a skill snapshot."""
    pass


class SkillSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a skill snapshot."""
    pass


class SkillModel(base_models.VersionedModel):
    """Model for storing Skills.

    This class should only be imported by the skill domain file, the
    skill services file, and the skill model test file.
    """
    SNAPSHOT_METADATA_CLASS = SkillSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = SkillSnapshotContentModel
    ALLOW_REVERT = False

    # The description of the skill.
    description = ndb.StringProperty(required=True, indexed=True)
    # A list of misconceptions associated with the skill, in which each
    # element is a dict.
    misconceptions = ndb.JsonProperty(repeated=True, indexed=False)
    # The ISO 639-1 code for the language this question is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # The schema version for the skill_contents.
    schema_version = ndb.IntegerProperty(required=True, indexed=True)
    # A dict representing the skill contents.
    skill_contents = ndb.JsonProperty(indexed=False)


class SkillCommitLogEntryModel(base_models.BaseModel):
    """Log of commits to skills.

    A new instance of this model is created and saved every time a commit to
    SkillModel occurs.

    The id for this model is of the form
    'skill-{{SKILL_ID}}-{{SKILL_VERSION}}'.
    """
    # Update superclass model to make these properties indexed.
    created_on = ndb.DateTimeProperty(auto_now_add=True, indexed=True)
    last_updated = ndb.DateTimeProperty(auto_now=True, indexed=True)

    # The id of the user.
    user_id = ndb.StringProperty(indexed=True, required=True)
    # The username of the user, at the time of the edit.
    username = ndb.StringProperty(indexed=True, required=True)
    # The id of the skill being edited.
    skill_id = ndb.StringProperty(indexed=True, required=True)
    # The type of the commit: 'create', 'revert', 'edit', 'delete'.
    commit_type = ndb.StringProperty(indexed=True, required=True)
    # The commit message.
    commit_message = ndb.TextProperty(indexed=False)
    # The commit_cmds dict for this commit.
    commit_cmds = ndb.JsonProperty(indexed=False, required=True)
    # The version number of the skill after this commit.
    version = ndb.IntegerProperty()

    @classmethod
    def get_commit(cls, skill_id, version):
        """Returns the commit corresponding to the given skill id and
        version number.

        Args:
            skill_id: str. The id of the skill being edited.
            version: int. The version number of the skill after the commit.

        Returns:
            The commit with the given skill id and version number.
        """
        return cls.get_by_id('skill-%s-%s' % (skill_id, version))

    @classmethod
    def get_all_commits(cls, page_size, urlsafe_start_cursor):
        """Fetches a list of all the commits sorted by their last updated
        attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.

        Returns:
            3-tuple of (results, cursor, more) as described in fetch_page() at:
            https://developers.google.com/appengine/docs/python/ndb/queryclass,
            where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this might
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """
        return cls._fetch_page_sorted_by_last_updated(
            cls.query(), page_size, urlsafe_start_cursor)


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
    # The ISO 639-1 code for the language this collection is written in.
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
