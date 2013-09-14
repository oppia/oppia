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

"""Domain objects for an exploration, its states, and their constituents.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used."""

__author__ = 'Sean Lip'

import re

from core.domain import param_domain
from core.domain import rule_domain
from core.platform import models
(base_models, exp_models,) = models.Registry.import_models([
    models.NAMES.base_model, models.NAMES.exploration
])
import feconf
import utils


class Content(object):
    """Value object representing non-interactive content."""

    def to_dict(self):
        return {'type': self.type, 'value': self.value}

    @classmethod
    def from_dict(cls, content_dict):
        return cls(content_dict['type'], content_dict['value'])

    def __init__(self, content_type, value=''):
        if content_type not in ['text', 'image', 'video', 'widget']:
            raise ValueError('Invalid content type: %s' % content_type)
        self.type = content_type
        # TODO(sll): Generalize this so the value can be a dict (for a widget).
        self.value = value


class RuleSpec(object):
    """Value object representing a rule specification."""

    def to_dict(self):
        return {
            'definition': self.definition,
            'dest': self.dest,
            'feedback': self.feedback,
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes]
        }

    @classmethod
    def from_dict(cls, rulespec_dict):
        return cls(
            rulespec_dict['definition'],
            rulespec_dict['dest'],
            rulespec_dict['feedback'],
            [param_domain.ParamChange(
                 param_change['name'], param_change['generator_id'],
                 param_change['customization_args'])
             for param_change in rulespec_dict['param_changes']],
        )

    def __init__(self, definition, dest, feedback, param_changes):
        if not dest:
            raise ValueError('No dest specified for rule spec')

        # TODO(sll): Add validation for the rule definition.

        # A dict specifying the rule definition. E.g.
        #
        #   {rule_type: 'default'}
        #
        # or
        #
        #   {
        #     'rule_type': 'atomic',
        #     'name': 'LessThan',
        #     'subject': 'answer',
        #     'inputs': {'x': 5}}
        #   }
        #
        self.definition = definition
        # Id of the destination state.
        # TODO(sll): Check that this state is END_DEST or actually exists.
        self.dest = dest
        # Feedback to give the reader if this rule is triggered.
        self.feedback = feedback or []
        # Exploration-level parameter changes to make if this rule is
        # triggered.
        self.param_changes = param_changes or []

    @property
    def is_default(self):
        """Returns True if this spec corresponds to the default rule."""
        return self.definition['rule_type'] == 'default'

    def get_feedback_string(self):
        """Returns a (possibly empty) string with feedback for this rule."""
        return utils.get_random_choice(self.feedback) if self.feedback else ''

    def __str__(self):
        """Returns a string representation of a rule (for the stats log)."""
        if self.definition['rule_type'] == rule_domain.DEFAULT_RULE_TYPE:
            return 'Default'
        else:
            # TODO(sll): Treat non-atomic rules too.
            param_list = [utils.to_ascii(val) for
                          (key, val) in self.definition['inputs'].iteritems()]
            return '%s(%s)' % (self.definition['name'], ','.join(param_list))

    @classmethod
    def get_default_rule_spec(cls, state_id):
        return RuleSpec({'rule_type': 'default'}, state_id, [], [])


DEFAULT_RULESPEC = RuleSpec.get_default_rule_spec(feconf.END_DEST)
DEFAULT_RULESPEC_STR = str(DEFAULT_RULESPEC)


class AnswerHandlerInstance(object):
    """Value object for an answer event stream (submit, click ,drag, etc.)."""

    def to_dict(self):
        return {
            'name': self.name,
            'rule_specs': [rule_spec.to_dict()
                           for rule_spec in self.rule_specs]
        }

    @classmethod
    def from_dict(cls, handler_dict):
        return cls(
            handler_dict['name'],
            [RuleSpec.from_dict(rs) for rs in handler_dict['rule_specs']],
        )

    def __init__(self, name, rule_specs=None):
        if not name:
            raise ValueError('No name specified for answer handler instance')
        if rule_specs is None:
            rule_specs = []

        self.name = name
        self.rule_specs = [RuleSpec(
            rule_spec.definition, rule_spec.dest, rule_spec.feedback,
            rule_spec.param_changes
        ) for rule_spec in rule_specs]

    @property
    def default_rule_spec(self):
        """The default rule spec."""
        assert self.rule_specs[-1].is_default
        return self.rule_specs[-1]

    @classmethod
    def get_default_handler(cls, state_id):
        return cls('submit', [RuleSpec.get_default_rule_spec(state_id)])


class WidgetInstance(object):
    """Value object for a widget instance."""

    def to_dict(self):
        return {
            'widget_id': self.widget_id,
            'customization_args': self.customization_args,
            'handlers': [handler.to_dict() for handler in self.handlers],
            'sticky': self.sticky
        }

    @classmethod
    def from_dict(cls, widget_dict):
        return cls(
            widget_dict['widget_id'],
            widget_dict['customization_args'],
            [AnswerHandlerInstance.from_dict(h)
             for h in widget_dict['handlers']],
            widget_dict['sticky'],
        )

    def __init__(self, widget_id, customization_args, handlers, sticky=False):
        if not widget_id:
            raise ValueError('No id specified for widget instance')
        # TODO(sll): Check whether the widget_id is valid.
        if not handlers:
            raise ValueError('No handlers specified for widget instance')

        self.widget_id = widget_id
        # Customization args for the interactive widget view. Parts of these
        # args may be Jinja templates that refer to state parameters.
        self.customization_args = customization_args
        # Answer handlers and rule specs.
        self.handlers = [AnswerHandlerInstance(
            handler.name, handler.rule_specs
        ) for handler in handlers]
        # If true, keep the widget instance from the previous state if both are
        # of the same type.
        self.sticky = sticky

    @classmethod
    def create_default_widget(cls, state_id):
        return cls('Continue', {},
                   [AnswerHandlerInstance.get_default_handler(state_id)])


class State(object):
    """Domain object for a state."""

    def validate(self):
        for c in feconf.INVALID_NAME_CHARS:
            if c in self.name:
                raise utils.ValidationError(
                    'Invalid character %s in state name %s' % (c, self.name))

        if self.name == feconf.END_DEST:
            raise utils.ValidationError(
                'Invalid state name: %s' % feconf.END_DEST)

        # TODO(sll): This needs lots more validation.
        pass

    def to_dict(self):
        return {
            'name': self.name,
            'content': [item.to_dict() for item in self.content],
            'param_changes': [param_change.to_dict()
                              for param_change in self.param_changes],
            'widget': self.widget.to_dict()
        }

    @classmethod
    def from_dict(cls, state_id, state_dict):
        if state_dict['widget']:
            widget = WidgetInstance.from_dict(state_dict['widget'])
        else:
            widget = WidgetInstance.create_default_widget(state_id)

        return cls(
            state_id,
            state_dict.get('name', feconf.DEFAULT_STATE_NAME),
            [Content.from_dict(item) for item in state_dict['content']],
            [param_domain.ParamChange.from_dict(param)
             for param in state_dict['param_changes']],
            widget
        )

    def __init__(self, id, name, content, param_changes, widget):
        # Id of the state.
        self.id = id
        # Human-readable name for the state.
        self.name = name or feconf.DEFAULT_STATE_NAME
        # The content displayed to the reader in this state.
        self.content = [Content(item.type, item.value) for item in content]
        # Parameter changes associated with this state.
        self.param_changes = [param_domain.ParamChange(
            param_change.name, param_change.generator.id,
            param_change.customization_args)
        for param_change in param_changes]
        # The interactive widget instance associated with this state. Set to be
        # the default widget if not explicitly specified by the caller.
        if widget is None:
            self.widget = WidgetInstance.create_default_widget(self.id)
        else:
            self.widget = WidgetInstance(
                widget.widget_id, widget.customization_args, widget.handlers,
                widget.sticky)


class Exploration(object):
    """Domain object for an Oppia exploration."""
    def __init__(self, exploration_model):
        self.id = exploration_model.id
        self.category = exploration_model.category
        self.title = exploration_model.title
        self.state_ids = exploration_model.state_ids
        self.param_specs = {
            ps_name: param_domain.ParamSpec.from_dict(ps_val)
            for (ps_name, ps_val) in exploration_model.param_specs.iteritems()
        }
        self.param_changes = [
            param_domain.ParamChange.from_dict(param_change_dict)
            for param_change_dict in exploration_model.param_changes]
        self.is_public = exploration_model.is_public
        self.image_id = exploration_model.image_id
        self.editor_ids = exploration_model.editor_ids
        self.default_skin = exploration_model.default_skin
        self.version = exploration_model.version

    def validate(self):
        """Validates the exploration before it is committed to storage."""
        if not self.state_ids:
            raise utils.ValidationError('This exploration has no states.')

        # TODO(sll): Check that the template path pointed to by default_skin
        # exists.

        # TODO(sll): We may not need this once appropriate tests are in
        # place and all state deletion operations are guarded against. Then
        # we can remove it if speed becomes an issue.
        for state_id in self.state_ids:
            # This raises an exception if the state_id does not exist.
            try:
                exp_models.StateModel.get(self.id, state_id)
            except base_models.BaseModel.EntityNotFoundError:
                raise utils.ValidationError('Invalid state_id %s' % state_id)

        if not self.editor_ids:
            raise utils.ValidationError('This exploration has no editors.')

        for c in feconf.INVALID_NAME_CHARS:
            if c in self.title:
                raise utils.ValidationError(
                    'Invalid character %s in exploration title %s'
                    % (c, self.title))

        for param_name in self.param_specs:
            if not re.compile('^[a-zA-Z0-9]+$').match(param_name):
                raise ValueError(
                    'Only parameter names with characters in [a-zA-Z0-9] are '
                    'accepted.')

    # Derived attributes of an exploration.
    @property
    def init_state_id(self):
        """The id of the starting state of this exploration."""
        return self.state_ids[0]

    @property
    def states(self):
        """A list of states for this exploration."""
        return [State.from_dict(
            state_id, exp_models.StateModel.get(self.id, state_id).value
        ) for state_id in self.state_ids]

    @property
    def init_state(self):
        """The state which forms the start of this exploration."""
        return self.states[0]

    @property
    def param_specs_dict(self):
        """A dict of param specs, each represented as Python dicts."""
        return {ps_name: ps_val.to_dict()
                for (ps_name, ps_val) in self.param_specs.iteritems()}

    @property
    def param_change_dicts(self):
        """A list of param changes, represented as JSONifiable Python dicts."""
        return [param_change.to_dict() for param_change in self.param_changes]

    def get_obj_type_for_param(self, param_name):
        """Returns the obj_type for the given parameter."""
        try:
            return self.param_specs[param_name].obj_type
        except:
            raise Exception('Exploration %s has no parameter named %s' %
                            (self.title, param_name))

    @property
    def is_demo(self):
        """Whether the exploration is one of the demo explorations."""
        return self.id.isdigit() and (
            0 <= int(self.id) < len(feconf.DEMO_EXPLORATIONS))

    # Methods relating to owners and editors.
    def is_forkable_by(self, user_id):
        """Whether the given user has rights to fork this exploration.

        This is a policy decision, and the criterion here can be changed.
        For example, it may depend on whether the user has completed the
        exploration or earned admin credentials.
        """
        return self.is_demo or self.is_editable_by(user_id)

    def is_owned_by(self, user_id):
        """Whether the given user owns the exploration."""
        return user_id == self.editor_ids[0]

    def is_editable_by(self, user_id):
        """Whether the given user has rights to edit this exploration."""
        return user_id in self.editor_ids

    def is_deletable_by(self, user_id):
        """Whether the given user has rights to delete this exploration."""
        return self.is_owned_by(user_id)

    def add_editor(self, editor_id):
        """Adds a new editor. Does not commit changes."""
        self.editor_ids.append(editor_id)

    # Methods relating to states comprising this exploration.
    def has_state_named(self, state_name):
        """Whether the exploration contains a state with the given name."""
        return any([state.name == state_name for state in self.states])
