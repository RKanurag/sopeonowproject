from django import template

register = template.Library()

@register.filter(name='seconds_to_hhmm')
def seconds_to_hhmm(seconds):
    """
    Converts a duration in seconds to a string formatted as MM:SS or HH:MM:SS.
    """
    if seconds is None:
        return '00:00'
    if not isinstance(seconds, (int, float)):
        try:
            seconds = int(seconds)
        except (ValueError, TypeError):
            return '00:00'
    
    seconds = int(seconds)
    
    # If seconds exceed 1 hour, show HH:MM:SS format
    if seconds >= 3600:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        return f'{hours:02}:{minutes:02}:{secs:02}'
    else:
        # For less than an hour, show MM:SS format
        minutes = seconds // 60
        secs = seconds % 60
        return f'{minutes:02}:{secs:02}'

@register.filter(name='get_time_class')
def get_time_class(seconds):
    """
    Returns appropriate CSS class based on time duration.
    """
    if seconds is None:
        return 'text-secondary'
    
    if not isinstance(seconds, (int, float)):
        try:
            seconds = int(seconds)
        except (ValueError, TypeError):
            return 'text-secondary'
    
    seconds = int(seconds)
    
    # Less than 30 minutes - green
    if seconds < 1800:
        return 'text-success'
    # Between 30 minutes and 1 hour - warning (orange)
    elif seconds < 3600:
        return 'text-warning'
    # More than 1 hour - danger (red)
    else:
        return 'text-danger'