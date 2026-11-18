"""Extract supplied vector logos and project Natural Earth country outlines.

Input: /tmp/monitor-logo.svg (pdftocairo conversion) and /tmp/countries.geojson
Natural Earth 1:50m admin_0 countries is public-domain geographic data.
"""
import json
import math
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
assets = root / "artifacts/monitor/public/assets"
svg = pathlib.Path("/tmp/monitor-logo.svg").read_text()
for name, box in [
    ("monitor-official", "226 77 134 47"),
    ("monitor-official-light", "226 193 134 47"),
]:
    logo = re.sub(
        r'width="612pt" height="792pt" viewBox="0 0 612 792"',
        f'width="268" height="94" viewBox="{box}"',
        svg,
    )
    if name.endswith("light"):
        # Remove only the solid presentation rectangle behind the supplied white logo.
        logo = re.sub(r'<path[^>]*d="M 373\.675781 253\.25 [^"]*"[^>]*/>', "", logo)
    (assets / f"{name}.svg").write_text(logo)

def project(lon, lat):
    x = (lon + 120) * 15
    y = (math.log(math.tan(math.pi / 4 + math.radians(35) / 2))
         - math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))) * 15 * 180 / math.pi
    return [round(x, 2), round(y, 2)]

countries = json.loads(pathlib.Path("/tmp/countries.geojson").read_text())
shapes = {}
for feature in countries["features"]:
    code = feature["properties"]["ADM0_A3"]
    if code not in ["MEX", "USA"]:
        continue
    geometry = feature["geometry"]
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    paths = []
    for polygon in polygons:
        if code == "USA" and not any(-125 < p[0] < -66 and 24 < p[1] < 50 for p in polygon[0]):
            continue
        for ring in polygon:
            points = [project(*p[:2]) for p in ring]
            paths.append("M" + "L".join(f"{x},{y}" for x, y in points) + "Z")
    shapes[code] = "".join(paths)

(root / "artifacts/monitor/src/lib/mexico-geography.json").write_text(json.dumps({
    "source": "Natural Earth, 1:50m admin_0 countries, public domain",
    "sourceUrl": "https://www.naturalearthdata.com/",
    "paths": shapes,
}))
