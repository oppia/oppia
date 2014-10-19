from core.domain import widget_domain


class MultipleChoiceInput(widget_domain.BaseWidget):
    """Interactive widget for multiple choice input."""

    # The human-readable name of the widget.
    name = 'Multiple Choice'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = 'A multiple-choice input widget.'

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'choices',
        'description': 'The options that the learner can select from.',
        'schema': {
            'type': 'list',
            'items': {
                'type': 'html',
                'ui_config': {
                    'size': 'small',
                }
            },
            'ui_config': {
                'add_element_text': 'Add multiple choice option',
            }
        },
        'default_value': ['Default choice'],
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'NonnegativeInt'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
