from core.domain import widget_domain


class Math(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Math'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = 'Widget for rendering math formulas as LaTeX.'

    # Customization args and their descriptions, schemas and default
    # values.
    _customization_arg_specs = [{
        'name': 'raw_latex',
        'description': 'The raw string to be displayed as LaTeX.',
        'custom_editor': 'MathLatexString',
        'default_value': '\\frac{x}{y}'
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'math'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert mathematical formula'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqA'
        'AAAAmJLR0QAAKqNIzIAAAAJcEhZcwAA%0AB2EAAAdhAZXDuLYAAAC8SURBVCjPxdG/SoJ'
        'hAIXx3/t9Gd%2BfSKVosYbACIJwa%2BkGhAa7hu6vyc0p%0AcG0RmhoiLKihIi0rjd4aC'
        'oK6AJ/xcODhcJg/wapgpOLDEpgZI1P3qBBSh7bdOFCxomNm3ZUodyTa%0AFBLPJkq5Rae'
        'iS1VtLbu62oYGiU9Vdec2fgRThaEntx7skCgseJPqy%2BRyUcO%2Bay3Htuyllt3h3oWa'
        '%0AdyNrJk401ZwZK8O/VR2lgaael%2B/gbyETBNHrvB/45QtenC6SdQpRRwAAACV0RVh0'
        'ZGF0ZTpjcmVh%0AdGUAMjAxMi0xMC0wNlQxODo0ODozOCswMjowMBG0RI8AAAAldEVYdG'
        'RhdGU6bW9kaWZ5ADIwMTAt%0AMTEtMTRUMDU6NTg6MDErMDE6MDCLUujdAAAAMnRFWHRM'
        'aWNlbnNlAGh0dHA6Ly9lbi53aWtpcGVk%0AaWEub3JnL3dpa2kvUHVibGljX2RvbWFpbj'
        '/96s8AAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2Fw%0AZS5vcmeb7jwaAAAAGHRFWHRT'
        'b3VyY2UAV2lraW1lZGlhIENvbW1vbnPSwlOaAAAANnRFWHRTb3Vy%0AY2VfVVJMAGh0dH'
        'A6Ly9jb21tb25zLndpa2ltZWRpYS5vcmcvd2lraS9NYWluX1BhZ2US/BctAAAA%0AAElF'
        'TkSuQmCC%0A'
    )
