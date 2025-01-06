
def capture_screenshot(timestamp,video_file,output_folder):
    import cv2
    import logging

    # logging configuration
    logger = logging.getLogger('CAPTURE_SCREENSHOT')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    
    video = cv2.VideoCapture(video_file)
    number_of_frames = video.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = video.get(cv2.CAP_PROP_FPS)
    timestamp_list = timestamp.split(':')
    timestamp_list_floats = [float(part) for part in timestamp_list]
    hours, minutes, seconds = timestamp_list_floats
    frame_nr = hours * 3600 * fps + minutes * 60 * fps + seconds * fps 
    video.set(1,frame_nr)
    success,frame = video.read()
    logger.debug(f"Framing success: {success}")

    try:
        cv2.imwrite(f'{output_folder}/Ss_{timestamp.replace(":", "_")}.png', frame)
        logger.info(f"Properly cut image from video {video_file} based on timestamp {timestamp}")
    except:
        logger.error(f'Failed to write file: ')
    name_of_file = f'Ss_{timestamp.replace(":", "_")}.png'
    logger.debug(f"Returning with filename: {name_of_file}")
    return name_of_file