def clear_photos_folder():
    import os
    import shutil

    photos_folder = os.path.join(os.path.dirname(__file__), '..', 'ocr', 'photos')
    
    if not os.path.exists(photos_folder):
        print(f"The folder {photos_folder} does not exist.")
        return
    
    for item in os.listdir(photos_folder):
        item_path = os.path.join(photos_folder, item)
        try:
            if os.path.isfile(item_path) or os.path.islink(item_path):
                os.unlink(item_path) 
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path)  
        except Exception as e:
            print(f"Failed to delete {item_path}. Reason: {e}")