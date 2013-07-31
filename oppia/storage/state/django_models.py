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

"""Model for an Oppia state."""

__author__ = 'Sean Lip'

import feconf
import oppia.storage.base_model.models as base_models
import oppia.storage.parameter.models as param_models
import utils

from django.db import models
from oppia.django_utils import JSONField


class Content(base_models.BaseModel):
    """Non-interactive content in a state."""
    type = models.CharField(max_length=100, choices=[
        ('text', 'text'),
        ('image', 'image'),
        ('video', 'video'),
        ('widget', 'widget')
    ])
    # TODO(sll): Generalize this so the value can be a dict (for a widget).
    value = models.TextField(default='')


class RuleSpec(base_models.BaseModel):
    """A rule."""
    # TODO(sll): Ensure the types for param_changes are consistent.

    # The name of the rule.
    name = models.CharField(max_length=100)
    # Parameters for the classification rule. TODO(sll): Make these the actual params.
    inputs = JSONField(default={}, isdict=True)
    # The id of the destination state.
    dest = models.CharField(max_length=100, blank=True)
    # Feedback to give the reader if this rule is triggered.
    feedback = JSONField(default=[], schema=[basestring], primitivelist=True)
    # State-level parameter changes to make if this rule is triggered.
    param_changes = JSONField(default=[], schema=[param_models.ParamChange])

    @property
    def is_default(self):
        """Returns True if this spec corresponds to the default rule."""
        return self.name == 'Default'

    def get_feedback_string(self):
        """Returns a (possibly empty) string with feedback for this rule."""
        return utils.get_random_choice(self.feedback) if self.feedback else ''

    def __str__(self):
        """Returns a string representation of a rule (for the stats log)."""
        param_list = [
            utils.to_ascii(self.inputs[key]) for key in self.inputs]
        return '%s(%s)' % (self.name, ','.join(param_list))


DEFAULT_RULESPEC_STR = str(RuleSpec(name='Default'))


class AnswerHandlerInstance(base_models.BaseModel):
    """An answer event stream (submit, click, drag, etc.)."""
    name = models.CharField(max_length=100, default='submit')
    rule_specs = JSONField(default=[], schema=[RuleSpec])

    @property
    def default_rule_spec(self):
        """The default rule spec."""
        assert self.rule_specs[-1].is_default
        return self.rule_specs[-1]


class WidgetInstance(base_models.BaseModel):
    """An instance of a widget."""
    # The id of the interactive widget class for this state.
    widget_id = models.CharField(max_length=100, default='Continue')
    # Parameters for the interactive widget view, stored as key-value pairs.
    # Each parameter is single-valued. The values may be Jinja templates that
    # refer to state parameters.
    params = JSONField(default={}, blank=True, isdict=True)
    # If true, keep the widget instance from the previous state if both are of
    # the same type.
    sticky = models.BooleanField(default=False)
    # Answer handlers and rule specs.
    handlers = JSONField(default=[], schema=[AnswerHandlerInstance], blank=True)


class State(base_models.IdModel):
    """A state which forms part of an exploration."""

    def get_default_rule_spec(self):
        return RuleSpec(name='Default', dest=self.id)

    def get_default_handler(self):
        return AnswerHandlerInstance(rule_specs=[self.get_default_rule_spec()])

    def get_default_widget(self):
        widget = WidgetInstance(handlers=[self.get_default_handler()])
        widget.put()
        return widget

    def _pre_put_hook(self):
        """Ensures that the widget and at least one handler for it exists."""
        # Every state should have an interactive widget.
        if not self.widget:
            self.widget = self.get_default_widget()
        elif not self.widget.handlers:
            self.widget.handlers = [self.get_default_handler()]
        self.widget.put()

        # TODO(sll): Do other validation.

    # Human-readable name for the state.
    name = models.CharField(max_length=100, default=feconf.DEFAULT_STATE_NAME)
    # The content displayed to the reader in this state.
    content = JSONField(default=[], schema=[Content], blank=True)
    # Parameter changes associated with this state.
    param_changes = JSONField(default=[], schema=[param_models.ParamChange], blank=True)
    # The interactive widget associated with this state. Set to be the default
    # widget if not explicitly specified by the caller.
    widget = models.ForeignKey('WidgetInstance', blank=True, null=True)
