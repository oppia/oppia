from core.domain import widget_domain
from extensions.value_generators.models import generators


class CodeRepl(widget_domain.BaseWidget):
    """Interactive widget that allows programs to be input."""

    # The human-readable name of the widget.
    name = 'Code REPL'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'Programming code widget with read-evaluate-print loop.')

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'language',
        'description': 'Programming language to evaluate the code in.',
        'schema': {
            'type': 'unicode',
            'choices': [
                'coffeescript', 'javascript', 'lua', 'python', 'ruby',
                'scheme',
            ]
        },
        'default_value': 'python'
    }, {
        'name': 'placeholder',
        'description': 'The initial code displayed in the code input field.',
        'schema': {
            'type': 'unicode',
        },
        'default_value': '[Type your code here.]'
    }, {
        'name': 'preCode',
        'description': 'Code to prepend to the reader\'s submission.',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'rows': 6,
            }
        },
        'default_value': ''
    }, {
        'name': 'postCode',
        'description': 'Code to append after the reader\'s submission.',
        'schema': {
            'type': 'unicode',
            'ui_config': {
                'rows': 6,
            }
        },
        'default_value': ''
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'CodeEvaluation'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = ['jsrepl', 'codemirror']
