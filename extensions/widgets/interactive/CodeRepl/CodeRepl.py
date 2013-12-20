from core.domain import widget_domain
from extensions.objects.models import objects
from extensions.value_generators.models import generators


class CodeRepl(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
    """

    # The human-readable name of the widget.
    name = 'Code REPL'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'Programming code widget with read-evaluate-print loop.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'language',
        'description': 'Programming language to evaluate the code in.',
        'generator': generators.RestrictedCopier,
        'init_args': {
            'choices': [
                'bloop', 'brainfuck', 'coffeescript', 'emoticon', 'forth',
                'javascript', 'kaffeine', 'lolcode', 'lua', 'move', 'python',
                'qbasic', 'roy', 'ruby', 'scheme', 'traceur', 'unlambda'
            ]
        },
        # These are the default args.
        'customization_args': {
            'value': 'coffeescript'
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'placeholder',
        'description': 'The placeholder for the code input field.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 'Type your code here.'
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'rows',
        'description': 'The number of rows for the text input field.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 10
        },
        'obj_type': 'Int',
    }, {
        'name': 'columns',
        'description': 'The number of columns for the text input field.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 60
        },
        'obj_type': 'Int',
    }, {
        'name': 'preCode',
        'description': 'Code to prepend to the reader\'s submission.',
        'generator': generators.Copier,
        'init_args': {
            'largeInput': True
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString'
    }, {
        'name': 'postCode',
        'description': 'Code to append after the reader\'s submission.',
        'generator': generators.Copier,
        'init_args': {
            'largeInput': True
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString'
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.CodeEvaluation
    }]
