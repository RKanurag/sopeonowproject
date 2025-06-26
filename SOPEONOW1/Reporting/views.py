from django.shortcuts import render
import json
from django.conf import settings
import os

def format_time_data(data_dict, key, default_value='00:00'):
    """Helper to safely access time and format it (not used directly for template filters)"""
    # This function is more for internal pre-processing if needed,
    # but template filters are preferred for direct display.
    # For now, we'll pass raw seconds and let the template filter handle it.
    return data_dict.get(key, 0) # Return raw seconds or 0

def dashboard(request):
    json_path = os.path.join(settings.MEDIA_ROOT, 'management.json')
    data = {}
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {json_path} not found.")
        # Handle error appropriately, maybe pass an error message to the template
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {json_path}.")
        # Handle error
    
    # Calculate total IP transfers count for convenience in template
    if 'key_metrics' in data and 'ip_transfers' in data['key_metrics']:
        completed_count = data['key_metrics']['ip_transfers'].get('completed', {}).get('count', 0)
        inprogress_count = data['key_metrics']['ip_transfers'].get('inprogress', {}).get('count', 0)
        data['key_metrics']['ip_transfers']['total_count'] = completed_count + inprogress_count
    else:
        if 'key_metrics' not in data:
            data['key_metrics'] = {}
        if 'ip_transfers' not in data['key_metrics']:
             data['key_metrics']['ip_transfers'] = {}
        data['key_metrics']['ip_transfers']['total_count'] = 0

    context = {
        'data': data,
        'json_data_for_js': json.dumps(data) # For passing to JavaScript
    }
    return render(request, 'Reporting/personal.html', context)