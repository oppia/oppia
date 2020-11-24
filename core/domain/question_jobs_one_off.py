# coding: utf-8
#
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

"""One-off jobs for questions."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import logging

from core import jobs
from core.domain import question_domain
from core.domain import question_services
from core.platform import models
import feconf
import python_utils

(question_models,) = models.Registry.import_models([models.NAMES.question])


class QuestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """A reusable one-time job that may be used to migrate question schema
    versions. This job will load all existing questions from the data store
    and immediately store them back into the data store. The loading process of
    a question in question_services automatically performs schema updating.
    This job persists that conversion work, keeping questions up-to-date and
    improving the load time of new questions.
    """

    _DELETED_KEY = 'question_deleted'
    _ERROR_KEY = 'validation_error'
    _MIGRATED_KEY = 'question_migrated'

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            yield (QuestionMigrationOneOffJob._DELETED_KEY, 1)
            return

        # Note: the read will bring the question up to the newest version.
        question = question_services.get_question_by_id(item.id)
        try:
            question.validate()
        except Exception as e:
            logging.error(
                'Question %s failed validation: %s' % (item.id, e))
            yield (
                QuestionMigrationOneOffJob._ERROR_KEY,
                'Question %s failed validation: %s' % (item.id, e))
            return

        # Write the new question into the datastore if it's different from
        # the old version.
        if (item.question_state_data_schema_version <=
                feconf.CURRENT_STATE_SCHEMA_VERSION):
            commit_cmds = [question_domain.QuestionChange({
                'cmd': question_domain.CMD_MIGRATE_STATE_SCHEMA_TO_LATEST_VERSION, # pylint: disable=line-too-long
                'from_version': item.question_state_data_schema_version,
                'to_version': feconf.CURRENT_STATE_SCHEMA_VERSION
            })]
            question_services.update_question(
                feconf.MIGRATION_BOT_USERNAME, item.id, commit_cmds,
                'Update question state schema version to %d.' % (
                    feconf.CURRENT_STATE_SCHEMA_VERSION))
            yield (QuestionMigrationOneOffJob._MIGRATED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == QuestionMigrationOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted questions.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == QuestionMigrationOneOffJob._MIGRATED_KEY:
            yield (key, ['%d questions successfully migrated.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class RegenerateQuestionSummaryOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """One-off job to regenerate question summaries."""

    _DELETED_KEY = 'question_deleted'
    _PROCESSED_KEY = 'question_processed'
    _ERROR_KEY = 'question_errored'

    @classmethod
    def _pre_start_hook(cls, job_id):
        """A hook or a callback function triggered before marking a job
        as started.

        Args:
            job_id: str. The unique ID of the job to be marked as started.
        """
        pass

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(question_model):
        if question_model.deleted:
            yield (RegenerateQuestionSummaryOneOffJob._DELETED_KEY, 1)
            return
        try:
            question_services.create_question_summary(question_model.id)
        except Exception as e:
            yield (
                RegenerateQuestionSummaryOneOffJob._ERROR_KEY,
                'Failed to create question summary %s: %s' % (
                    question_model.id, e))
            return

        yield (RegenerateQuestionSummaryOneOffJob._PROCESSED_KEY, 1)

    @staticmethod
    def reduce(key, values):
        if key == RegenerateQuestionSummaryOneOffJob._DELETED_KEY:
            yield (key, ['Encountered %d deleted questions.' % (
                sum(ast.literal_eval(v) for v in values))])
        elif key == RegenerateQuestionSummaryOneOffJob._PROCESSED_KEY:
            yield (key, ['Successfully processed %d questions.' % (
                sum(ast.literal_eval(v) for v in values))])
        else:
            yield (key, values)


class DeleteInvalidQuestionModelsOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """This job is used to delete invalid question models and its linked models.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        snapshot_model_ids = [
            '%s-%d' % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]
        commit_log_model_ids = [
            'question-%s-%s'
            % (item.id, version) for version in python_utils.RANGE(
                1, item.version + 1)]

        # In the Audit job, the version 1 model for the 3 models below were
        # absent. So, if they are absent, delete all versions and the linked
        # QuestionModel. (This issue does not exist anymore)
        first_commit_log_model = (
            question_models.QuestionCommitLogEntryModel.get(
                commit_log_model_ids[0], strict=False))
        first_snapshot_content_model = (
            question_models.QuestionSnapshotContentModel.get(
                snapshot_model_ids[0], strict=False))
        first_snapshot_metadata_model = (
            question_models.QuestionSnapshotMetadataModel.get(
                snapshot_model_ids[0], strict=False))
        if (
                first_commit_log_model is None or
                first_snapshot_content_model is None or
                first_snapshot_metadata_model is None):
            for entity_id in commit_log_model_ids:
                model = question_models.QuestionCommitLogEntryModel.get(
                    entity_id, strict=False)
                if model is not None:
                    model.delete()
            for entity_id in snapshot_model_ids:
                content_model = (
                    question_models.QuestionSnapshotContentModel.get(
                        entity_id, strict=False))
                if content_model is not None:
                    content_model.delete()
                metadata_model = (
                    question_models.QuestionSnapshotMetadataModel.get(
                        entity_id, strict=False))
                if metadata_model is not None:
                    metadata_model.delete()
            item.delete(None, None, force_deletion=True)
            yield ('QUESTION_MODELS_DELETED_FOR_ID', item.id)

    @staticmethod
    def reduce(key, values):
        yield (key, values)


class MissingQuestionMigrationOneOffJob(jobs.BaseMapReduceOneOffJobManager):
    """This job is used to delete question commit log models for which question
    models are missing.

    NOTE TO DEVELOPERS: Do not delete this job until issue #10808 is fixed.
    """

    @classmethod
    def entity_classes_to_map_over(cls):
        return [question_models.QuestionCommitLogEntryModel]

    @staticmethod
    def map(item):
        if item.deleted:
            return

        question = question_services.get_question_by_id(
            item.question_id, strict=False)
        if question is None:
            yield ('Question Commit Model deleted', item.id)
            item.delete()

    @staticmethod
    def reduce(key, values):
        yield (key, values)
