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

"""Service functions relating to email models."""

from core.domain import email_domain
from core.platform import models

(email_models,) = models.Registry.import_models([models.NAMES.email])


def get_feedback_thread_reply_info_from_model(model):
    """Converts GeneralFeedbackEmailReplyToIdModel to a FeedbackThreadReplyInfo.

    Args:
        model: GeneralFeedbackEmailReplyToIdModel. The model to be converted.

    Returns:
        FeedbackThreadReplyInfo. The resulting domain object.
    """
    return email_domain.FeedbackThreadReplyInfo(
        model.id, model.reply_to_id)


def get_feedback_thread_reply_info_by_reply_to_id(reply_to_id):
    """Gets the domain object corresponding to the model which is fetched by
    reply-to-id field.

    Args:
        reply_to_id: str. The reply_to_id to search for.

    Returns:
        FeedbackThreadReplyInfo or None. The corresponding domain object.
    """
    model = email_models.GeneralFeedbackEmailReplyToIdModel.get_by_reply_to_id(
        reply_to_id)
    if model is None:
        return None
    return get_feedback_thread_reply_info_from_model(model)


def get_feedback_thread_reply_info_by_user_and_thread_ids(user_id, thread_id):
    """Gets the domain object corresponding to the model which is fetched by
    user_id and thread_id.

    Args:
        user_id: str. The ID of the user.
        thread_id: str. The ID of the thread.

    Returns:
        FeedbackThreadReplyInfo or None. The corresponding domain object.
    """
    model = email_models.GeneralFeedbackEmailReplyToIdModel.get(
        user_id, thread_id, strict=False)
    if model is None:
        return None
    return get_feedback_thread_reply_info_from_model(model)
