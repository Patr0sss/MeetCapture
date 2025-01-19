def sorting_timestamps(timestamps_ocr,timestamps_whisper,dic_ocr,dic_whisper):
    from .time_format import format_to_seconds
    # timestamps ocr and timestamps whispers are in increasing order in format "HH:MM:SS"
    i=0 # for ocr
    j=0 # for whisper
    overall_text = ""
    while i < len(timestamps_ocr) and j < len(timestamps_whisper):
        if format_to_seconds(timestamps_ocr[i]) < timestamps_whisper[j]:
            overall_text += dic_ocr[timestamps_ocr[i]]
            i+=1
        else:
            overall_text += dic_whisper[timestamps_whisper[j]]
            j+=1
    while i < len(timestamps_ocr):
        overall_text += dic_ocr[timestamps_ocr[i]]
        i+=1
    while j < len(timestamps_whisper):
        overall_text += dic_whisper[timestamps_whisper[j]]
        j+=1
    return overall_text