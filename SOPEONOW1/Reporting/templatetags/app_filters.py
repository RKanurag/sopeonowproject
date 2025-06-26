from django import template

register = template.Library()

@register.filter(name='seconds_to_hhmm')
def seconds_to_hhmm(seconds):
    """
    Converts a duration in seconds to a string formatted as HH:MM.
    """
    if seconds is None: # Allow float 0.0
        return '00:00'
    if not isinstance(seconds, (int, float)):
        try:
            seconds = int(seconds) # try to convert if it's a string number
        except (ValueError, TypeError):
            return '00:00' # or some other default/error indication
    
    seconds = int(seconds) # Ensure it's an integer for calculations
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    
    return f'{hours:02}:{minutes:02}'