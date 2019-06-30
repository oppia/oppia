# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to upgrade draft to newer Exploration versions."""
import logging

from core.domain import exp_domain
from core.platform import models
import utils

(exp_models, feedback_models, user_models) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.user
])


def try_upgrade_from_version_to_version(
        draft_change_list, current_draft_version, to_exp_version, exp_id):
    """Try upgrading a list of ExplorationChange domain objects.

    For now, this handles only the scenario where all commits between
    current_draft_version and to_exp_version are that migrate the state schema.

    Args:
        draft_change_list: list(ExplorationChange). The list of
            ExplorationChange domain objects to upgrade.
        current_draft_version: int. Current draft version.
        to_exp_version: int. Target exploration version.
        exp_id: str. Exploration id.

    Returns:
        list(ExplorationChange) or None. A list of ExplorationChange domain
        objects after upgrade or None if upgrade fails.

    Raises:
        InvalidInputException.
    """
    if current_draft_version > to_exp_version:
        raise utils.InvalidInputException(
            'Current draft version is greater than the exploration version.')
    if current_draft_version == to_exp_version:
        return

    exp_versions = range(current_draft_version + 1, to_exp_version + 1)
    commits_list = (
        exp_models.ExplorationCommitLogEntryModel.get_multi(
            exp_id, exp_versions))
    upgrade_times = 0
    while current_draft_version + upgrade_times < to_exp_version:
        commit = commits_list[upgrade_times]
        if (
                len(commit.commit_cmds) == 1 and
                commit.commit_cmds[0]['cmd'] ==
                exp_domain.CMD_MIGRATE_STATES_SCHEMA_TO_LATEST_VERSION):

            conversion_fn_name = '_convert_v%s_dict_to_v%s_dict' % (
                (current_draft_version + upgrade_times),
                (current_draft_version + upgrade_times + 1))
            if not hasattr(DraftUpgradeUtil, conversion_fn_name):
                logging.warning('%s is not implemented' % conversion_fn_name)
                return
            conversion_fn = getattr(DraftUpgradeUtil, conversion_fn_name)
            draft_change_list = conversion_fn(draft_change_list)
        else:
            return
        upgrade_times += 1
    return draft_change_list


class DraftUpgradeUtil(object):
    """Wrapper class that contains util functions to upgrade drafts."""
    pass
