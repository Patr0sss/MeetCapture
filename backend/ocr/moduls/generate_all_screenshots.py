def capture_screenshots_from_video(video_file, interval=1):
    from moduls.screenshot_capture import capture_screenshot
    import cv2
    video = cv2.VideoCapture(video_file)
    video_length = video.get(cv2.CAP_PROP_FRAME_COUNT) / video.get(cv2.CAP_PROP_FPS)
    
    print(f"Video length: {video_length:.2f} seconds")
    fps = video.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * interval)  
    
    timestamps = []
    
    for i in range(0, int(video_length * fps), frame_interval):  
        seconds = i // fps
        minutes = (seconds // 60)
        hours = minutes // 60
        seconds = seconds % 60
        minutes = minutes % 60
        
        timestamp = f"{hours:02}:{minutes:02}:{seconds:02}"
        timestamps.append(timestamp)
        capture_screenshot(timestamp, video_file)
