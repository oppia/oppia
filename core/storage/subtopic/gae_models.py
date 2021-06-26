# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Models for subtopics and related constructs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.platform import models

(base_models,) = models.Registry.import_models([models.NAMES.base_model])
datastore_services = models.Registry.import_datastore_services()


class SubtopicPageSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for a subtopic page snapshot."""

    pass


class SubtopicPageCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to subtopic pages.

    A new instance of this model is created and saved every time a commit to
    SubtopicPageModel occurs.

    The id for this model is of the form
    'subtopicpage-[subtopic_page_id]-[version]'.
    """

    # The id of the subtopic page being edited.
    subtopic_page_id = (
        datastore_services.StringProperty(indexed=True, required=True))

    @classmethod
    def get_instance_id(cls, subtopic_page_id, version):
        """This function returns the generated id for the get_commit function
        in the parent class.

        Args:
            subtopic_page_id: str. The id of the subtopic page being edited.
            version: int. The version number of the subtopic page after the
                commit.

        Returns:
            str. The commit id with the subtopic page id and version number.
        """
        return 'subtopicpage-%s-%s' % (subtopic_page_id, version)

    @staticmethod
    def get_model_association_to_user():
        """The history of commits is not relevant for the purposes of Takeout
        since commits don't contain relevant data corresponding to users.
        """
        return base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER

    @classmethod
    def get_export_policy(cls):
        """Model contains data corresponding to a user, but this isn't exported
        because the history of commits isn't deemed as useful for users since
        commit logs don't contain relevant data corresponding to those users.
        """
        return dict(super(cls, cls).get_export_policy(), **{
            'subtopic_page_id': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })


class SubtopicPageSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of a subtopic page snapshot."""

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE


class SubtopicPageModel(base_models.VersionedModel):
    """Model for storing Subtopic pages.

    This stores the HTML data for a subtopic page.
    """

    SNAPSHOT_METADATA_CLASS = SubtopicPageSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = SubtopicPageSnapshotContentModel
    COMMIT_LOG_ENTRY_CLASS = SubtopicPageCommitLogEntryModel
    ALLOW_REVERT = False

    # The topic id that this subtopic is a part of.
    topic_id = datastore_services.StringProperty(required=True, indexed=True)
    # The json data of the subtopic consisting of subtitled_html,
    # recorded_voiceovers and written_translations fields.
    page_contents = datastore_services.JsonProperty(required=True)
    # The schema version for the page_contents field.
    page_contents_schema_version = datastore_services.IntegerProperty(
        required=True, indexed=True)
    # The ISO 639-1 code for the language this subtopic page is written in.
    language_code = (
        datastore_services.StringProperty(required=True, indexed=True))

    @staticmethod
    def get_deletion_policy():
        """Model doesn't contain any data directly corresponding to a user."""
        return base_models.DELETION_POLICY.NOT_APPLICABLE

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
        super(SubtopicPageModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        subtopic_page_commit_log_entry = SubtopicPageCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, constants.ACTIVITY_STATUS_PUBLIC, False
        )
        subtopic_page_commit_log_entry.subtopic_page_id = self.id
        subtopic_page_commit_log_entry.update_timestamps()
        subtopic_page_commit_log_entry.put()

    @classmethod
    def get_export_policy(cls):
        """Model doesn't contain any data directly corresponding to a user."""
        return dict(super(cls, cls).get_export_policy(), **{
            'topic_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'page_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'page_contents_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE
        })
