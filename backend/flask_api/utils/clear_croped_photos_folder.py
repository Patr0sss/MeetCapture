def clear_croped_photos_folder():
    import os
    import shutil
    
    croped_photos_folder = os.path.join(os.path.dirname(__file__), '..', 'ocr', 'croped_photos')
    
    if not os.path.exists(croped_photos_folder):
        print(f"The folder {croped_photos_folder} does not exist.")
        return
    
    for item in os.listdir(croped_photos_folder):
        item_path = os.path.join(croped_photos_folder, item)
        try:
            if os.path.isfile(item_path) or os.path.islink(item_path):
                os.unlink(item_path)  
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path) 
            print(f"Deleted: {item_path}")
        except Exception as e:
            print(f"Failed to delete {item_path}. Reason: {e}")