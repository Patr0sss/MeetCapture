def crop_based_on_model(image_name,output_folder):
    import logging
    import requests
    import os
    from collections import defaultdict
    from PIL import Image
    from dotenv import load_dotenv
    load_dotenv()

    logger = logging.getLogger('CROP_BASED_ON_MODEL')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    url_with_api_key = os.environ.get("URL_AND_API_KEY")

    CONFIDENCE_LEVEL = 40
    url = f"{url_with_api_key}&confidence={CONFIDENCE_LEVEL}"


    # load images
    try:
        image_path = f'flask_api/ocr/photos/{image_name}'
        with open(image_path, "rb") as f:
            response = requests.post(
                url,
                files={"file": f},
            )
        logger.info("Loaded image correctly to model")
    except:
        logger.error(f"Failed loading image from {image_path} to model")

    if response.status_code != 200:
        logger.error(f"Error: {response.status_code}")
        logger.error(response.text)
        exit()
    dic = response.json()
    prepared_map = defaultdict(list)  # Format: {class: [(confidence, (x, y, width, height))]}

    # dictionary of predictions with coordinates and class names
    for dictionary in dic['predictions']:
        if dictionary['class'] not in prepared_map:
            prepared_map[dictionary['class']].append([dictionary['confidence'],(dictionary['x'],dictionary['y'],dictionary['width'],dictionary['height'])])

    # crop based on the picked coordinates
    def crop_image(image_path, bbox, output_path=f"{output_folder}/{image_name[:-4]}_cropped.png"):
        logger.debug(f"Started crop_image function on {image_path}")
        x, y, width, height = bbox
        left = x - width // 2
        top = y - height // 2
        right = x + width // 2
        bottom = y + height // 2
        
        try:
            with Image.open(image_path) as img:
                cropped = img.crop((left, top, right, bottom))
                cropped.save(output_path)
            logger.info(f"Properly cropped {image_path} and saved image in {output_path}")
        except:
            logger.error(f"Failed to crop and save image: {image_path}")

    # decide which approach to use depending on the model's prediction threshold
    if "shared_area" in prepared_map and prepared_map["shared_area"][0][0] > 0.4:
        logger.debug(f"Started cropping image {image_name} with option ONLY_SHARED")
        shared_area = max(prepared_map["shared_area"], key=lambda x: x[0])
        confidence, bbox = shared_area
        crop_image(image_path, bbox, output_path=f"{output_folder}/{image_name[:-4]}_cropped.png")
    else:
        logger.debug(f"Started cropping image {image_name} with option EVERYTHING_EXCEPT_SHARED")
        image = Image.open(f'flask_api/ocr/photos/{image_name}')

        # all possible classes
        ui_classes = ["participants_sidebar", "participants_topbar", "toolbar", "teams_window"]
        remaining_bboxes = []

        # collecting all shapes to crop from image 
        for ui_class in ui_classes:
            if ui_class in prepared_map:
                remaining_bboxes.append(prepared_map[ui_class][0][1])
        cropped_image = image.copy()
        for bbox in remaining_bboxes:
            x, y, width, height = bbox
            x1 = int(x - width // 2)
            y1 = int(y - height // 2)
            x2 = int(x + width // 2)
            y2 = int(y + height // 2)

            transparent_part = Image.new("RGBA", (x2 - x1, y2 - y1), (255, 255, 255, 0)) 

            cropped_image.paste(transparent_part, (x1, y1))
        try:
            cropped_image.save(f"{output_folder}/{image_name[:-4]}_cropped.png")
            logger.info(f"Properly saved {image_name}")
        except:
            logger.error(f"Failed to save {image_name}")

