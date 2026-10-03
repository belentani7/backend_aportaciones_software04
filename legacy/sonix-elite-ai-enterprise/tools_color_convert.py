import math

colors = {
    'obsidian': '#0b0d12',
    'ink': '#11151d',
    'slate-premium': '#1a2230',
    'slate-elevated': '#242e3d',
    'champagne': '#e7c88f',
    'champagne-soft': '#f3e2be',
    'teal-smoke': '#86b9b0',
    'mist': '#f3f0e8',
    'fog': '#a9b2c0',
    'danger-soft': '#d98b8b',
}

def srgb_to_linear(value):
    value = value / 255
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

def rgb_to_oklch(hex_value):
    rgb = [srgb_to_linear(int(hex_value[i:i+2], 16)) for i in (1, 3, 5)]
    r, g, b = rgb
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_
    a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_
    bb = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    C = math.sqrt(a*a + bb*bb)
    h = (math.degrees(math.atan2(bb, a)) % 360) if C > 1e-8 else 0
    return f"oklch({L:.4f} {C:.4f} {h:.1f})"

for name, value in colors.items():
    print(f"{name}: {rgb_to_oklch(value)}")
