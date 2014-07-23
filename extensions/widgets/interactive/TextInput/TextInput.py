from core.domain import widget_domain
from extensions.value_generators.models import generators


class TextInput(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Text input'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'A text input widget that can accept and classify strings.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    # NB: There used to be an integer-typed parameter here called 'columns'
    # that was removed in revision 628942010573. Some text widgets in
    # older explorations may have this customization parameter still set
    # in the exploration definition, so, in order to minimize the possibility
    # of collisions, do not add a new parameter with this name to this list.
    # TODO(sll): Migrate old definitions which still contain the 'columns'
    # parameter.
    _params = [{
        'name': 'placeholder',
        'description': 'The placeholder for the text input field.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 'Type your answer here.'
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'rows',
        'description': 'The number of rows for the text input field.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 1
        },
        'obj_type': 'Int',
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'obj_type': 'NormalizedString'
    }]

    # Additional JS library dependencies that should be loaded in pages
    # containing this widget. These should correspond to names of files in
    # feconf.DEPENDENCIES_TEMPLATES_DIR.
    _dependency_ids = []
