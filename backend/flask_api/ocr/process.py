def process_timestamps(timestamps,video_file):
    print("Timestamps: ",timestamps)
    print("Video file: ",video_file)
    from .moduls.process_output import process_markdown
    from .ocr_run import run_ocr
    for timestamp in timestamps:
        run_ocr(timestamp,video_file)
    process_markdown('notes.md','',"output.pdf",max_width=600)