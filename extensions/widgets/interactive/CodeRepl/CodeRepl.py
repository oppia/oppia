from core.domain import widget_domain
from extensions.objects.models import objects


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
        'description': 'Programming language to evalue the code in.',
        'obj_type': 'UnicodeString',
        'values': ['coffeescript'],
        'choices': [
            'bloop', 'brainfuck', 'coffeescript', 'emoticon', 'forth',
            'javascript', 'kaffeine', 'lolcode', 'lua', 'move', 'python',
            'qbasic', 'roy', 'ruby', 'scheme', 'traceur', 'unlambda'
        ]
    }, {
        'name': 'placeholder',
        'description': 'The placeholder for the text input field.',
        'obj_type': 'UnicodeString',
        'values': ['Type your code here.']
    }, {
        'name': 'rows',
        'description': 'The number of rows for the text input field.',
        'obj_type': 'UnicodeString',
        'values': ['1']
    }, {
        'name': 'columns',
        'description': 'The number of columns for the text input field.',
        'obj_type': 'UnicodeString',
        'values': ['60']
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.CodeEvaluation
    }]
