def format_to_seconds(time):
    # time is in format "HH:MM:SS"
    time = time.split(":")
    return int(time[0])*3600 + int(time[1])*60 + int(time[2])