"""
Download dark map tiles from CartoDB and composite them into a single high-res image.
Covers the Middle East region (lon 29-56, lat 24-42) for the missile video background.
"""
import math
import os
import urllib.request
from PIL import Image

ZOOM = 6
TILE_SIZE = 512  # @2x tiles

# Region bounds
LON_MIN, LON_MAX = 29, 56
LAT_MIN, LAT_MAX = 24, 42

def lat_lon_to_tile(lat, lon, zoom):
    n = 2 ** zoom
    x = int((lon + 180) / 360 * n)
    lat_rad = math.radians(lat)
    y = int((1 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2 * n)
    return x, y

def tile_to_lat_lon(x, y, zoom):
    n = 2 ** zoom
    lon = x / n * 360 - 180
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
    lat = math.degrees(lat_rad)
    return lat, lon

# Calculate tile range
x_min, y_max_tile = lat_lon_to_tile(LAT_MIN, LON_MIN, ZOOM)
x_max, y_min_tile = lat_lon_to_tile(LAT_MAX, LON_MAX, ZOOM)

print(f"Zoom {ZOOM}: tiles x=[{x_min}..{x_max}], y=[{y_min_tile}..{y_max_tile}]")
print(f"Total tiles: {(x_max - x_min + 1) * (y_max_tile - y_min_tile + 1)}")

# Download tiles
tiles_dir = os.path.join(os.path.dirname(__file__), "tiles_tmp")
os.makedirs(tiles_dir, exist_ok=True)

for x in range(x_min, x_max + 1):
    for y in range(y_min_tile, y_max_tile + 1):
        url = f"https://basemaps.cartocdn.com/light_all/{ZOOM}/{x}/{y}@2x.png"
        path = os.path.join(tiles_dir, f"{ZOOM}_{x}_{y}.png")
        if not os.path.exists(path):
            print(f"  Downloading tile {x},{y}...")
            urllib.request.urlretrieve(url, path)
        else:
            print(f"  Tile {x},{y} cached")

# Composite tiles
cols = x_max - x_min + 1
rows = y_max_tile - y_min_tile + 1
composite = Image.new("RGB", (cols * TILE_SIZE, rows * TILE_SIZE))

for x in range(x_min, x_max + 1):
    for y in range(y_min_tile, y_max_tile + 1):
        path = os.path.join(tiles_dir, f"{ZOOM}_{x}_{y}.png")
        tile = Image.open(path)
        px = (x - x_min) * TILE_SIZE
        py = (y - y_min_tile) * TILE_SIZE
        composite.paste(tile, (px, py))

# Now we need to crop to exact lon/lat bounds and resize to 1920x1080
# Calculate pixel positions of our exact bounds within the composite
n = 2 ** ZOOM

def lon_to_px(lon):
    tile_x = (lon + 180) / 360 * n
    return (tile_x - x_min) * TILE_SIZE

def lat_to_px(lat):
    lat_rad = math.radians(lat)
    tile_y = (1 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2 * n
    return (tile_y - y_min_tile) * TILE_SIZE

left = int(lon_to_px(LON_MIN))
right = int(lon_to_px(LON_MAX))
top = int(lat_to_px(LAT_MAX))
bottom = int(lat_to_px(LAT_MIN))

print(f"Crop: left={left}, top={top}, right={right}, bottom={bottom}")
cropped = composite.crop((left, top, right, bottom))

# Resize to 1920x1080
final = cropped.resize((1920, 1080), Image.LANCZOS)

# Apply slight color grading - make it more blue/military tint
from PIL import ImageEnhance
# Slight brightness boost
enhancer = ImageEnhance.Brightness(final)
final = enhancer.enhance(1.05)
# Slightly more saturated
enhancer = ImageEnhance.Color(final)
final = enhancer.enhance(0.8)

output_path = os.path.join(os.path.dirname(__file__), "public", "map-light.png")
final.save(output_path, "PNG", optimize=True)
print(f"Saved to {output_path}")
print(f"Size: {final.size}")

# Cleanup tiles
import shutil
shutil.rmtree(tiles_dir)
print("Cleaned up temporary tiles")
