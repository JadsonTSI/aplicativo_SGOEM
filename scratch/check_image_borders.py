from PIL import Image
import os

files = [
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\blog\static\img\galeria1.jpg",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\blog\static\img\galeria2.jpg",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\blog\static\img\galeria3.jpg",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\blog\static\img\galeria4.jpeg",
]

for f in files:
    if not os.path.exists(f):
        print(f"{f} not found")
        continue
    try:
        with Image.open(f) as img:
            width, height = img.size
            print(f"\nImage: {os.path.basename(f)}")
            print(f"  Dimensions: {width}x{height}")
            
            # Let's inspect the color of the corners and borders
            # We check a few pixels on the left border (x=5) and right border (x=width-6)
            left_pixels = [img.getpixel((5, y)) for y in range(0, height, height // 10)]
            right_pixels = [img.getpixel((width - 6, y)) for y in range(0, height, height // 10)]
            
            print(f"  Left border sample colors: {left_pixels[:5]}")
            print(f"  Right border sample colors: {right_pixels[:5]}")
            
            # Check if they are mostly black/near-black (R,G,B < 15)
            is_left_black = all(sum(c[:3]) < 45 for c in left_pixels if isinstance(c, tuple))
            is_right_black = all(sum(c[:3]) < 45 for c in right_pixels if isinstance(c, tuple))
            print(f"  Is left border black? {is_left_black}")
            print(f"  Is right border black? {is_right_black}")
    except Exception as e:
        print(f"Error inspecting {f}: {e}")
