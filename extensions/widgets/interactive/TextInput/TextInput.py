from core.domain import widget_domain
from extensions.objects.models import objects


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
    _params = [{
        'name': 'placeholder',
        'description': 'The placeholder for the text input field.',
        'obj_type': 'UnicodeString',
        'values': ['Type your answer here.']
    }, {
        'name': 'rows',
        'description': 'The number of rows for the text input field.',
        # TODO(sll): This is wrong; change it.
        'obj_type': 'UnicodeString',
        'values': ['1']
    }, {
        'name': 'columns',
        'description': 'The number of columns for the text input field.',
        # TODO(sll): This is wrong; change it.
        'obj_type': 'UnicodeString',
        'values': ['60']
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.NormalizedString
    }]
