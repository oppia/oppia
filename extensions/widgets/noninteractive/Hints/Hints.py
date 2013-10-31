from core.domain import widget_domain
from extensions.value_generators.models import generators


class Hints(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Hints'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Hints widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'hint_placeholder',
        'description': 'The placeholder for the text for hint box.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'low_hint',
        'description': 'The low level hint.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'medium_hint',
        'description': 'The medium level hint',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }, {
        'name': 'high_hint',
        'description': 'The high level hint',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }]
