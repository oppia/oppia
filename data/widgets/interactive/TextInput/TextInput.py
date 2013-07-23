from data.objects.models import objects
from oppia.apps.widget import widget_domain


class TextInput(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
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
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.NormalizedString
    }]
