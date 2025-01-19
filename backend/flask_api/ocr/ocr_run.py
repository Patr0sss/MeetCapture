def ocr_run(timestamp,video_file,dic_ocr = {}):
    from .moduls.screenshot_capture import capture_screenshot
    from .moduls.crop_based_model import crop_based_on_model
    from .moduls.process_image import process_image
    import logging

    # logger configuration
    logger = logging.getLogger('MAIN')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    status_code_CROP_BASED_ON_MODEL = 404
    # based on timestamp, capture screenshot from video
    name_of_file = capture_screenshot(timestamp,video_file,'flask_api/ocr/photos')
    try:
    # crop image to text area based on model
        crop_based_on_model(f'{name_of_file}','flask_api/ocr/croped_photos')
        status_code_CROP_BASED_ON_MODEL = 200
        logger.info(f"Use of CROP_BASED_ON_MODEL function with status: {status_code_CROP_BASED_ON_MODEL}")
    except:
        logger.error(f"Error while croping image on image: {name_of_file}")
    if status_code_CROP_BASED_ON_MODEL == 200:
        logger.debug(f"Starting PROCESS_IMAGE function on file: {name_of_file}")
        # using OCR on image, correcting text, deciding if image should be showed graphically and saving it to markdown file
        is_graph,text = process_image(f"flask_api/ocr/croped_photos/{name_of_file[:-4]}_cropped.png",timestamp)
        dic_ocr[timestamp] = text
    else:
        logger.error("Use of CROP_BASED_ON_MODEL function went wrong")
    
    return dic_ocr