"""Split the flat 3D icon renders into animatable layers.

Colour/geometry rules pick each element, then every remaining pixel — the
anti-aliased outline, which is semi-transparent and so fails every threshold —
is handed to its nearest layer. That keeps the stack recomposing to the
original instead of leaving hairline gaps between layers.
"""
import numpy as np, json, cv2
from PIL import Image
from scipy import ndimage

SRC, OUT = "public/figma/3d", "public/figma/3d/layers"

def hsv(a):
    rgb = a[...,:3]; mx, mn = rgb.max(-1), rgb.min(-1); d = mx-mn+1e-6
    r,g,b = rgb[...,0],rgb[...,1],rgb[...,2]
    h = np.where(mx==r, ((g-b)/d)%6, np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    s = np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    return h, s, mx

def clean(m, k=2):
    m = ndimage.binary_closing(m, np.ones((k,k)))
    m = ndimage.binary_opening(m, np.ones((k,k)))
    return ndimage.binary_fill_holes(m)

meta = {}

def emit(name, arr, layers):
    a8 = (arr*255).astype(np.uint8)
    any_alpha = arr[...,3] > 0

    lab = np.zeros(arr.shape[:2], np.int32)
    assigned = np.zeros(arr.shape[:2], bool)
    for i,(label,m) in enumerate(layers, start=1):
        m = m & ~assigned
        assigned |= m
        lab[m] = i

    # soft outline pixels -> nearest layer
    hole = any_alpha & (lab == 0)
    if hole.any():
        _, idx = ndimage.distance_transform_edt(lab == 0, return_indices=True)
        lab = np.where(hole, lab[idx[0], idx[1]], lab)

    info = {}
    for i,(label,_) in enumerate(layers, start=1):
        m = (lab == i) & any_alpha
        out = a8.copy(); out[...,3] = np.where(m, a8[...,3], 0)
        Image.fromarray(out).save(f"{OUT}/{name}_{label}.png")
        ys, xs = np.where(m)
        info[label] = {"bbox":[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1],
                       "px":int(m.sum())}
    info["_size"] = list(arr.shape[1::-1])
    meta[name] = info

def load(n):
    a = np.asarray(Image.open(f"{SRC}/{n}.png").convert("RGBA")).astype(np.float32)/255
    return a, *hsv(a), a[...,3] > 0.5

# rainbow: saturated arc vs white clouds
a,h,s,v,op = load("rainbow")
arc = clean(op & (s>0.28))
emit("rainbow", a, [("arc",arc),("clouds",op & ~arc)])

# home: green foliage vs house
a,h,s,v,op = load("home")
plants = clean(op & (h>=70)&(h<175)&(s>0.18))
emit("home", a, [("plants",plants),("house",op & ~plants)])

# snapmap: bar resolved first, so its magnifier isn't stolen by the globe
a,h,s,v,op = load("snapmap")
H,Wd = op.shape
pin = clean(op & (((h<20)|(h>340)) & (s>0.30)))
globe0 = clean(op & (h>=70)&(h<260)&(s>0.25))
white = op & ~pin & ~globe0
lbl,n = ndimage.label(clean(white,3))
bar = np.zeros_like(white)
for i in range(1,n+1):
    comp = lbl==i; ys,xs = np.where(comp)
    if ys.mean() > H*0.78 and (xs.max()-xs.min()) > Wd*0.5: bar |= comp
if bar.any():
    ys,_ = np.where(bar)
    band = np.zeros_like(bar); band[ys.min():, :] = True
    bar = bar | (op & band & ~pin)
globe = globe0 & ~bar
emit("snapmap", a, [("pin",pin),("globe",globe),("bar",bar),
                    ("clouds", op & ~pin & ~globe & ~bar)])

# docvault: convex hull of the light front face is the door
a,h,s,v,op = load("docvault")
m = ndimage.binary_closing(op & (s<0.50) & (v>0.40), np.ones((5,5)))
lbl,n = ndimage.label(m)
sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1,n+1))
face = (lbl == int(np.argmax(sizes))+1).astype(np.uint8)
cnts,_ = cv2.findContours(face, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
solid = np.zeros_like(face); cv2.fillPoly(solid,[hull],1)
door = (solid>0) & op
emit("docvault", a, [("door",door),("body",op & ~door)])

json.dump(meta, open(f"{OUT}/layers.json","w"), indent=2)
for k,v in meta.items():
    print(k, {a:b["px"] for a,b in v.items() if a!="_size"})
