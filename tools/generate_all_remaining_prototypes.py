from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from generate_young_sports_ui import cut_poly, font, mix, paste_center, text_center
from pixel_street_theme import pixel_finish


ROOT = Path(r"D:\篮球")
PROJECT = ROOT / "篮球CocosProject"
SRC = ROOT / "新设计" / "游戏界面截图"
OUT = ROOT / "新设计" / "新原型图"
QUALITY = ROOT / "新设计" / "品质素材_9档"
PORTRAITS = PROJECT / "assets" / "resources" / "images" / "头像"
UI = PROJECT / "assets" / "resources" / "images" / "UI"

W, H = 1080, 2160
NAVY = (8, 35, 102)
DEEP = (2, 17, 52)
BLUE = (18, 83, 218)
CYAN = (49, 193, 247)
LIME = (214, 242, 27)
ORANGE = (247, 106, 30)
RED = (219, 47, 43)
WHITE = (241, 248, 250)
ICE = (218, 237, 245)
TEXT = (8, 37, 96)
TEAL = (4, 126, 134)
GOLD = (246, 188, 42)
GRAY = (84, 105, 140)


def ensure() -> None:
    OUT.mkdir(parents=True, exist_ok=True)


def open_source(name: str) -> Image.Image:
    return Image.open(SRC / f"{name}.png").convert("RGB")


def crop_source(name: str, box: tuple[float, float, float, float]) -> Image.Image:
    im = open_source(name)
    x0, y0, x1, y1 = box
    return im.crop((round(im.width*x0), round(im.height*y0), round(im.width*x1), round(im.height*y1))).convert("RGBA")


def cover(img: Image.Image, size: tuple[int, int], nearest=False) -> Image.Image:
    scale = max(size[0] / img.width, size[1] / img.height)
    resample = Image.Resampling.NEAREST if nearest else Image.Resampling.LANCZOS
    out = img.resize((max(1, round(img.width*scale)), max(1, round(img.height*scale))), resample)
    left = (out.width-size[0])//2
    top = (out.height-size[1])//2
    return out.crop((left, top, left+size[0], top+size[1]))


def street_background(seed: int = 0, light=True) -> Image.Image:
    img = Image.new("RGBA", (W, H), (*DEEP, 255))
    px = img.load()
    top = (2, 22, 62) if light else (1, 13, 40)
    bottom = (8, 65, 145) if light else (4, 40, 102)
    for y in range(H):
        t = y/(H-1)
        c = mix(top, bottom, t*.78)
        for x in range(W):
            px[x, y] = (*c, 255)
    overlay=Image.new("RGBA",(W,H),(0,0,0,0))
    d = ImageDraw.Draw(overlay, "RGBA")
    # Approved-master motifs: deep street court, halftone pixels, diagonal speed lanes.
    d.polygon([(0,0),(740,0),(0,720)],fill=(14,78,170,34))
    d.polygon([(1080,2160),(390,2160),(1080,1430)],fill=(*LIME,20))
    for offset,color in ((0,(31,121,220,80)),(18,(65,196,244,45)),(38,(211,242,27,48))):
        d.polygon([(0,420+offset),(0,455+offset),(360,125+offset),(392,125+offset)],fill=color)
        d.polygon([(1080,390+offset),(1080,425+offset),(770,735+offset),(738,735+offset)],fill=color)
    # Pixel halftone clusters.
    for gy in range(70,520,18):
        for gx in range(60,340,18):
            if ((gx//18)+(gy//18)+seed)%3==0 and gx+gy<520:
                d.rectangle((gx,gy,gx+6,gy+6),fill=(*CYAN,45))
    for gy in range(120,570,20):
        for gx in range(790,1040,20):
            if ((gx//20)+(gy//20)+seed)%4==0:
                d.rectangle((gx,gy,gx+7,gy+7),fill=(*BLUE,50))
    # Court fence and perspective floor lines.
    horizon=1320
    d.line((0,horizon,W,horizon),fill=(*CYAN,70),width=4)
    for x in range(-240,1320,90):
        d.line((x,horizon,x-260,H),fill=(124,203,246,36),width=3)
    for y in range(horizon,2160,72):
        d.line((0,y,W,y),fill=(92,169,225,32),width=3)
    d.arc((220,1510,860,2150),180,360,fill=(196,227,245,50),width=6)
    d.line((540,1510,540,2160),fill=(196,227,245,44),width=5)
    # Hard scanlines/noise pixels—no smooth texture.
    for y in range(0,H,8): d.line((0,y,W,y),fill=(0,8,30,18),width=2)
    for y in range(42,2110,94):
        x=18+((y//94+seed)%3)*8
        d.rectangle((x,y,x+5,y+30),fill=(255,255,255,45))
        d.rectangle((W-x-5,y+26,W-x,y+54),fill=(*LIME,32))
    img.alpha_composite(overlay)
    return img


def modal_background(source_name: str, seed: int) -> Image.Image:
    base=street_background(seed,light=False)
    source=cover(open_source(source_name),(W,H),nearest=True).convert("RGBA")
    source.putalpha(38)
    base.alpha_composite(source)
    base.alpha_composite(Image.new("RGBA",(W,H),(1,12,42,90)))
    return base


def panel(img: Image.Image, box, fill=WHITE, border=BLUE, cut=24, shadow=True, inner=True) -> None:
    x0,y0,x1,y1=map(int,box)
    d=ImageDraw.Draw(img,"RGBA")
    if shadow:
        d.polygon(cut_poly((x0+12,y0+18,x1+12,y1+18),cut),fill=(0,8,28,180))
    p=cut_poly((x0,y0,x1,y1),cut)
    d.polygon(p,fill=(*NAVY,255))
    q0=cut_poly((x0+5,y0+5,x1-5,y1-5),max(4,cut-5))
    d.polygon(q0,fill=(*border,255))
    q1=cut_poly((x0+10,y0+10,x1-10,y1-10),max(4,cut-10))
    d.polygon(q1,fill=(*fill,255))
    d.line(p+[p[0]],fill=(2,16,55,255),width=4)
    if inner:
        q=cut_poly((x0+15,y0+15,x1-15,y1-15),max(4,cut-14))
        d.line(q+[q[0]],fill=(*mix(border,WHITE,.65),255),width=3)
        d.line((x0+cut+10,y0+12,x1-cut-10,y0+12),fill=(255,255,255,210),width=3)


def header(img: Image.Image, title: str, y0=35, y1=190, back=False, right_label: str | None=None) -> None:
    d=ImageDraw.Draw(img,"RGBA")
    # Offset neon-yellow pixel shadow, like the approved recruitment-result banner.
    shadow=cut_poly((45,y0+18,1035,y1+18),30)
    d.polygon(shadow,fill=(*LIME,235))
    panel(img,(35,y0,1045,y1),fill=BLUE,border=CYAN,cut=30)
    d=ImageDraw.Draw(img,"RGBA")
    d.polygon([(50,y0+16),(920,y0+16),(875,y1-18),(50,y1-18)],fill=(*BLUE,255))
    d.line((110,y0+18,890,y0+18),fill=(255,255,255,220),width=4)
    d.polygon([(900,y0+12),(1015,y0+12),(1015,y0+42),(875,y0+42)],fill=(*LIME,255))
    d.polygon([(65,y1-44),(105,y1-44),(83,y1-20),(48,y1-20)],fill=(*WHITE,240))
    d.polygon([(950,y1-45),(1008,y1-45),(988,y1-20),(928,y1-20)],fill=(*WHITE,240))
    if back:
        d.polygon([(70,(y0+y1)//2),(115,y0+42),(115,y0+72),(162,y0+72),(162,y1-42),(115,y1-42),(115,y1-22)],fill=(*WHITE,255))
    text_center(d,(540,(y0+y1)//2),title,font(72,True),WHITE,5,DEEP)
    if right_label:
        d.polygon(cut_poly((780,y0+45,1010,y1-40),14),fill=(*LIME,255))
        text_center(d,(895,(y0+y1)//2),right_label,font(34,True),TEXT,2,WHITE)


def button(img: Image.Image, box, label: str, kind="primary", icon: str | None=None, fs=52) -> None:
    x0,y0,x1,y1=map(int,box)
    colors={"primary":(LIME,NAVY),"blue":(BLUE,WHITE),"cyan":(CYAN,NAVY),"orange":(ORANGE,WHITE),"danger":(RED,WHITE),"white":(WHITE,TEXT)}
    fill,fg=colors[kind]
    d=ImageDraw.Draw(img,"RGBA")
    shadow=cut_poly((x0+7,y0+9,x1+7,y1+9),18)
    d.polygon(shadow,fill=(0,7,26,210))
    p=cut_poly((x0,y0,x1,y1),18)
    d.polygon(p,fill=(*NAVY,255))
    p1=cut_poly((x0+5,y0+5,x1-5,y1-5),14); d.polygon(p1,fill=(*fill,255))
    p2=cut_poly((x0+10,y0+10,x1-10,y1-10),10)
    d.line(p2+[p2[0]],fill=(*mix(fill,WHITE,.62),255),width=3)
    d.line((x0+28,y0+11,x1-28,y0+11),fill=(255,255,255,145),width=3)
    if icon:
        ix,iy=x0+55,(y0+y1)//2
        if icon == "▶":
            d.polygon([(ix-25,iy-24),(ix+2,iy),(ix-25,iy+24)],fill=(*fg,255))
            d.polygon([(ix+3,iy-24),(ix+30,iy),(ix+3,iy+24)],fill=(*fg,255))
        elif icon == "▣":
            d.rounded_rectangle((ix-34,iy-25,ix+34,iy+25),7,outline=(*fg,255),width=5)
            d.polygon([(ix-8,iy-15),(ix+18,iy),(ix-8,iy+15)],fill=(*fg,255))
        elif icon == "●":
            d.ellipse((ix-24,iy-24,ix+24,iy+24),fill=(*GOLD,255),outline=(*fg,255),width=4)
            d.arc((ix-15,iy-15,ix+15,iy+15),20,205,fill=(*ORANGE,255),width=3)
        else:
            text_center(d,(ix,iy),icon,font(max(30,fs-10),True),fg,2,NAVY if fg==WHITE else WHITE)
        cx=(x0+x1)//2+25
    else:
        cx=(x0+x1)//2
    text_center(d,(cx,(y0+y1)//2),label,font(fs,True),fg,3,NAVY if fg==WHITE else WHITE)


def divider(draw: ImageDraw.ImageDraw, y: int, color=CYAN) -> None:
    draw.line((100,y,980,y),fill=(*NAVY,90),width=3)
    draw.rectangle((520,y-5,560,y+5),fill=(*color,255))


def portrait_paths() -> list[Path]:
    return sorted([p for p in PORTRAITS.iterdir() if p.suffix.lower() in {".png",".webp"}],key=lambda p:p.name)


PORTRAIT_FILES = portrait_paths()


def portrait(index: int, size: tuple[int,int]) -> Image.Image:
    p=PORTRAIT_FILES[index % len(PORTRAIT_FILES)]
    im=Image.open(p).convert("RGBA")
    bbox=im.getchannel("A").getbbox()
    if bbox: im=im.crop(bbox)
    return cover(im,size,nearest=True)


def quality_file(index: int, stem: str) -> Path:
    folder=next(QUALITY.glob(f"{index:02d}_*"))
    return folder / stem.format(index=index)


def qframe(index: int, size: tuple[int,int], round_frame=False) -> Image.Image:
    stem="头像框{index}-圆.png" if round_frame else "头像框{index}-方.png"
    return Image.open(quality_file(index,stem)).convert("RGBA").resize(size,Image.Resampling.LANCZOS)


def slot(img: Image.Image, box, player_index: int, quality_index: int, ovr: str, round_frame=False) -> None:
    x0,y0,x1,y1=map(int,box); w=x1-x0; h=y1-y0
    panel(img,(x0,y0,x1,y1),fill=WHITE,border=mix(BLUE,(255,255,255),.08),cut=14,shadow=False,inner=False)
    face=portrait(player_index,(w-18,h-34))
    img.alpha_composite(face,(x0+9,y0+6))
    frame=qframe(quality_index,(w,h),round_frame)
    img.alpha_composite(frame,(x0,y0))
    d=ImageDraw.Draw(img,"RGBA")
    d.polygon([(x0+12,y1-43),(x1-12,y1-43),(x1-22,y1-8),(x0+22,y1-8)],fill=(*NAVY,235))
    text_center(d,((x0+x1)//2,y1-25),ovr,font(max(22,min(40,w//4)),True),WHITE,2,(0,0,0,255))


def court_panel(img: Image.Image, source_name: str, crop_box, target_box) -> None:
    x0,y0,x1,y1=map(int,target_box)
    panel(img,(x0,y0,x1,y1),fill=WHITE,border=CYAN,cut=20)
    court=crop_source(source_name,crop_box)
    court=cover(court,(x1-x0-24,y1-y0-24),nearest=True)
    court=ImageEnhance.Brightness(court).enhance(1.12)
    court=ImageEnhance.Color(court).enhance(1.18)
    img.alpha_composite(court,(x0+12,y0+12))


def management_icon(name: str, size=(84,84)) -> Image.Image | None:
    p=UI / "管理层" / f"{name}.webp"
    if not p.exists(): return None
    im=Image.open(p).convert("RGBA"); im.thumbnail(size,Image.Resampling.NEAREST)
    return im


def draw_coin(d: ImageDraw.ImageDraw, cx: int, cy: int, r: int=25) -> None:
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=(*GOLD,255),outline=(*NAVY,255),width=4)
    d.arc((cx-r+7,cy-r+7,cx+r-7,cy+r-7),20,200,fill=(*ORANGE,255),width=3)
    d.line((cx,cy-r+7,cx,cy+r-7),fill=(*NAVY,255),width=3)


def draw_gear(d: ImageDraw.ImageDraw, cx: int, cy: int, color=NAVY) -> None:
    for i in range(8):
        a=math.radians(i*45)
        x1=cx+math.cos(a)*34; y1=cy+math.sin(a)*34
        x2=cx+math.cos(a)*49; y2=cy+math.sin(a)*49
        d.line((x1,y1,x2,y2),fill=(*color,255),width=12)
    d.ellipse((cx-34,cy-34,cx+34,cy+34),fill=(*color,255))
    d.ellipse((cx-13,cy-13,cx+13,cy+13),fill=(*WHITE,255))


def draw_stadium(d: ImageDraw.ImageDraw, cx: int, cy: int, color=BLUE) -> None:
    d.polygon([(cx-50,cy-20),(cx-32,cy-42),(cx+32,cy-42),(cx+50,cy-20),(cx+42,cy+34),(cx-42,cy+34)],outline=(*color,255),fill=(0,0,0,0))
    d.arc((cx-28,cy-12,cx+28,cy+36),180,360,fill=(*color,255),width=5)
    d.line((cx-42,cy-5,cx+42,cy-5),fill=(*color,255),width=5)


def draw_trophy_icon(d: ImageDraw.ImageDraw, cx: int, cy: int, color=BLUE) -> None:
    d.polygon([(cx-28,cy-35),(cx+28,cy-35),(cx+20,cy+5),(cx+8,cy+18),(cx-8,cy+18),(cx-20,cy+5)],fill=(*color,255))
    d.arc((cx-48,cy-32,cx-15,cy+2),70,285,fill=(*color,255),width=6)
    d.arc((cx+15,cy-32,cx+48,cy+2),-105,110,fill=(*color,255),width=6)
    d.rectangle((cx-5,cy+16,cx+5,cy+35),fill=(*color,255))
    d.rectangle((cx-25,cy+34,cx+25,cy+43),fill=(*color,255))


def approved_yao(size: tuple[int,int]) -> Image.Image:
    approved=OUT/"招募结果_街球竞技_MT品质_GOAT_v5_恢复图标.png"
    im=Image.open(approved).convert("RGBA")
    # Approved card portrait region, preserving the confirmed Yao identity and pixel treatment.
    crop=im.crop((365,320,715,790))
    return cover(crop,size,nearest=True)


def make_home() -> Image.Image:
    img=street_background(1,True); d=ImageDraw.Draw(img,"RGBA")
    header(img,"球队名称",35,225,False,None)
    d.ellipse((62,65,170,173),fill=(*NAVY,255),outline=(*LIME,255),width=7)
    text_center(d,(116,119),"我",font(48,True),LIME)
    d.text((195,185),"球队总评 12.35B",font=font(31),fill=(*WHITE,255),anchor="lm")
    draw_gear(d,900,130,NAVY)
    panel(img,(55,245,1025,345),fill=WHITE,border=CYAN,cut=18)
    text_center(d,(540,295),"主场连胜中 · 完成招募后继续征战",font(38),TEXT)
    court_panel(img,"主页",(.035,.18,.965,.445),(45,365,1035,990))
    panel(img,(45,1010,1035,1155),fill=WHITE,border=BLUE,cut=18)
    text_center(d,(325,1055),"球队等级 12",font(34,True),TEXT)
    text_center(d,(650,1055),"斗志 20 / 30",font(34,True),TEXT)
    d.rounded_rectangle((75,1090,805,1132),18,fill=(192,217,240,255),outline=(*NAVY,255),width=4)
    d.rounded_rectangle((78,1093,560,1129),15,fill=(*CYAN,255))
    button(img,(830,1078,1005,1138),"升级","primary",fs=32)
    panel(img,(35,1175,1045,1815),fill=ICE,border=NAVY,cut=24)
    xs=[55,215,375,535]
    for row in range(3):
        for col,x in enumerate(xs):
            slot(img,(x,1205+row*195,x+140,1375+row*195),row*4+col,1+(row+col)%4,str(72-row*3-col))
    managers=[("运营",0,55),("教练",1,215),("球探",2,375),("队医",3,535)]
    for name,idx,x in managers:
        bx=705+(idx%2)*160; by=1205+(idx//2)*195
        panel(img,(bx,by,bx+140,by+170),fill=WHITE,border=GOLD,cut=14,shadow=False)
        icon=management_icon(name,(92,92))
        if icon: paste_center(img,icon,bx+70,by+62)
        text_center(d,(bx+70,by+137),f"{name}\nLv.3",font(26,True),TEXT)
    panel(img,(705,1595,1005,1785),fill=WHITE,border=GOLD,cut=16,shadow=False)
    icon=management_icon("媒体",(110,110))
    if icon: paste_center(img,icon,855,1650)
    text_center(d,(855,1740),"媒体团队 Lv.3",font(28,True),TEXT)
    panel(img,(25,1840,1055,2115),fill=WHITE,border=NAVY,cut=24)
    nav=["联盟","球馆","招募球员","赛季","更多"]
    for i,label in enumerate(nav):
        cx=110+i*215
        if i==2:
            d.ellipse((cx-103,1835,cx+103,2041),fill=(*LIME,255),outline=(*NAVY,255),width=9)
            d.polygon([(cx,1867),(cx+14,1896),(cx+46,1900),(cx+22,1921),(cx+29,1952),(cx,1935),(cx-29,1952),(cx-22,1921),(cx-46,1900),(cx-14,1896)],fill=(*TEXT,255))
            text_center(d,(cx,1982),label,font(34,True),TEXT)
        else:
            if i in (0,3): draw_trophy_icon(d,cx,1907,BLUE if i==0 else ORANGE)
            elif i==1: draw_stadium(d,cx,1907,BLUE)
            else:
                for yy in (-24,0,24): d.rectangle((cx-34,1907+yy-4,cx+34,1907+yy+4),fill=(*BLUE,255))
            text_center(d,(cx,2000),label,font(32,True),TEXT)
    text_center(d,(540,2080),"预算 136",font(32,True),TEAL)
    return img


def make_prematch() -> Image.Image:
    img=street_background(2,True); d=ImageDraw.Draw(img,"RGBA")
    header(img,"常规赛 第24场",30,175,True)
    text_center(d,(540,150),"比赛准备",font(28),TEXT)
    for left,team,color,mark in [(45,"大王篮球俱乐部",CYAN,"我"),(550,"深圳篮球俱乐部",ORANGE,"敌")]:
        panel(img,(left,195,left+485,365),fill=WHITE,border=color,cut=18)
        d.polygon([(left+8,203),(left+145,203),(left+115,357),(left+8,357)],fill=(*color,235))
        text_center(d,(left+60,280),mark,font(45,True),NAVY if color==CYAN else WHITE)
        text_center(d,(left+300,245),team,font(27,True),TEXT)
        text_center(d,(left+300,315),"OVR 12.35B",font(39,True),NAVY if color==CYAN else ORANGE)
    for row in range(10):
        y=385+row*128
        for col in range(2):
            x=45+col*505; accent=CYAN if col==0 else ORANGE
            panel(img,(x,y,x+485,y+112),fill=WHITE,border=accent,cut=12,shadow=False,inner=False)
            face=portrait(row+col*10,(90,90)); img.alpha_composite(face,(x+14,y+10))
            d.polygon([(x+110,y+8),(x+475,y+8),(x+455,y+104),(x+110,y+104)],fill=(*ICE,255))
            text_center(d,(x+270,y+38),"这是球员名字",font(28,True),TEXT)
            text_center(d,(x+270,y+79),str(123456-row*913-col*777),font(26,True),accent,2,WHITE)
            text_center(d,(x+447,y+56),"我" if col==0 else "敌",font(22,True),NAVY if col==0 else WHITE,1,accent)
    text_center(d,(540,1698),"管理层加成",font(34,True),TEXT)
    for i,(name,x) in enumerate([("运营",70),("教练",555)]):
        panel(img,(x,1730,x+455,1900),fill=WHITE,border=CYAN if i==0 else ORANGE,cut=18)
        icon=management_icon(name,(88,88))
        if icon: paste_center(img,icon,x+72,1814)
        text_center(d,(x+180,1775),name,font(33,True),TEXT)
        text_center(d,(x+285,1845),"球队预算 +12%" if i==0 else "球队总评 +8%",font(27),TEAL if i==0 else ORANGE)
    button(img,(135,1950,945,2080),"开始比赛","primary",fs=60)
    return img


def make_match() -> Image.Image:
    img=street_background(3,True); d=ImageDraw.Draw(img,"RGBA")
    text_center(d,(540,55),"常规赛  第05场",font(35,True),TEXT)
    for x0,x1,label,color,mark in [(40,520,"大王篮球俱乐部",CYAN,"我"),(560,1040,"深圳篮球俱乐部",ORANGE,"敌")]:
        panel(img,(x0,90,x1,220),fill=WHITE,border=color,cut=18,shadow=False)
        d.ellipse((x0+20,115,x0+100,195),fill=(*NAVY,255),outline=(*color,255),width=5)
        text_center(d,(x0+60,155),mark,font(32,True),color)
        text_center(d,((x0+x1)//2+35,155),label,font(33,True),TEXT)
    text_center(d,(540,295),"1234567 : 1234567",font(72,True),NAVY,4,WHITE)
    for i,q in enumerate(("Q1","Q2","Q3","Q4")):
        col=i%2; row=i//2; x=45+col*505; y=370+row*150
        panel(img,(x,y,x+485,y+130),fill=WHITE,border=CYAN if col==0 else ORANGE,cut=14,shadow=False)
        text_center(d,(x+242,y+33),q,font(27,True),TEXT)
        text_center(d,(x+242,y+88),"1234  :  1234",font(34,True),NAVY if col==0 else ORANGE)
    court_panel(img,"比赛",(.04,.315,.96,.58),(45,675,1035,1240))
    for i in range(5):
        y=1270+i*112
        panel(img,(65,y,1015,y+92),fill=WHITE,border=CYAN if i==0 else mix(BLUE,WHITE,.1),cut=12,shadow=False,inner=False)
        d.polygon([(73,y+8),(190,y+8),(170,y+84),(73,y+84)],fill=(*(LIME if i==0 else ICE),255))
        text_center(d,(130,y+46),"05:59",font(26,True),TEXT)
        d.text((220,y+46),"我方快攻命中，节奏持续提升",font=font(28),fill=(*TEXT,255),anchor="lm")
    button(img,(65,1845,515,1950),"2倍速","blue","▶",40)
    button(img,(565,1845,1015,1950),"跳过","orange","▶",40)
    button(img,(65,1980,1015,2100),"立即获胜","primary","▣",55)
    return img


def stat_icon(name: str, size=(72,72)) -> Image.Image | None:
    p=UI/"其它"/f"{name}.webp"
    if not p.exists(): return None
    im=Image.open(p).convert("RGBA"); im.thumbnail(size,Image.Resampling.NEAREST); return im


def make_player_detail() -> Image.Image:
    img=street_background(4,True); d=ImageDraw.Draw(img,"RGBA")
    header(img,"球员详情",30,180,True)
    panel(img,(210,205,870,730),fill=ICE,border=GOLD,cut=30)
    bg=Image.open(quality_file(8,"招募背景08.png")).convert("RGBA").resize((470,470),Image.Resampling.NEAREST)
    img.alpha_composite(bg,(305,225))
    face=approved_yao((330,350)); img.alpha_composite(face,(375,305))
    frame=Image.open(quality_file(8,"头像框8-方.png")).convert("RGBA").resize((500,515),Image.Resampling.LANCZOS)
    img.alpha_composite(frame,(290,210))
    d.polygon([(270,625),(810,625),(760,715),(320,715)],fill=(*DEEP,245),outline=(*GOLD,255))
    text_center(d,(540,666),"姚 明",font(52,True),WHITE,3,(0,0,0,255))
    d.polygon([(735,245),(825,245),(845,275),(825,330),(735,330),(715,275)],fill=(*BLUE,255))
    text_center(d,(780,285),"C",font(34,True),WHITE)
    panel(img,(75,755,1005,1045),fill=WHITE,border=GOLD,cut=22)
    text_center(d,(540,815),"OVR",font(37,True),TEXT)
    text_center(d,(540,925),"8.88M",font(105,True),BLUE,5,WHITE)
    stats=[("得分","4.17M"),("篮板","2.29M"),("助攻","1.25M"),("抢断","458.59K"),("盖帽","708.73K")]
    for i,(name,value) in enumerate(stats):
        y=1075+i*130
        panel(img,(75,y,1005,y+110),fill=WHITE,border=CYAN,cut=14,shadow=False,inner=False)
        icon=stat_icon(name)
        if icon: paste_center(img,icon,130,y+55)
        d.text((205,y+55),name,font=font(38,True),fill=(*TEXT,255),anchor="lm")
        d.text((950,y+55),value,font=font(42,True),fill=(*NAVY,255),anchor="rm")
    panel(img,(75,1745,1005,1880),fill=WHITE,border=BLUE,cut=16)
    d.text((105,1812),"累计获得次数",font=font(35,True),fill=(*TEXT,255),anchor="lm")
    d.text((950,1812),"12",font=font(52,True),fill=(*ORANGE,255),anchor="rm")
    panel(img,(75,1900,1005,2035),fill=WHITE,border=BLUE,cut=16)
    d.text((105,1968),"累计效力时长",font=font(35,True),fill=(*TEXT,255),anchor="lm")
    d.text((950,1968),"999H-99M-99S",font=font(42,True),fill=(*ORANGE,255),anchor="rm")
    return img


def make_management() -> Image.Image:
    img=street_background(5,True); d=ImageDraw.Draw(img,"RGBA")
    header(img,"管理层升级",30,180,True,"预算 99999")
    names=["运营","教练","球探","队医","媒体"]
    for i,name in enumerate(names):
        x=35+i*207; active=name=="队医"
        panel(img,(x,205,x+185,365),fill=LIME if active else WHITE,border=NAVY if active else BLUE,cut=16,shadow=False)
        icon=management_icon(name,(75,75))
        if icon: paste_center(img,icon,x+92,260)
        elif name == "教练":
            # Compact vector tactics board fallback when the project has no coach icon.
            d.rounded_rectangle((x+59,225,x+126,290),8,fill=(*ICE,255),outline=(*NAVY,255),width=5)
            d.line([(x+92,232),(x+92,282)],fill=(*BLUE,255),width=3)
            d.ellipse((x+68,245,x+80,257),fill=(*ORANGE,255))
            d.ellipse((x+104,260,x+116,272),fill=(*TEAL,255))
            d.line([(x+76,251),(x+110,266)],fill=(*TEXT,255),width=3)
        text_center(d,(x+92,330),name,font(29,True),TEXT)
    panel(img,(45,390,1035,980),fill=WHITE,border=CYAN,cut=22)
    doctor=crop_source("管理层",(.05,.205,.63,.475))
    doctor=cover(doctor,(580,555),nearest=True)
    img.alpha_composite(doctor,(60,410))
    d.polygon([(650,410),(1018,410),(1018,960),(610,960)],fill=(*ICE,245))
    text_center(d,(820,585),"医疗团队",font(58,True),ORANGE)
    text_center(d,(820,680),"Lv. 20 / 210",font(40,True),TEXT)
    d.rounded_rectangle((690,730,950,770),18,fill=(187,218,237,255),outline=(*NAVY,255),width=4)
    d.rounded_rectangle((694,734,820,766),14,fill=(*CYAN,255))
    panel(img,(45,1005,1035,1845),fill=WHITE,border=BLUE,cut=22)
    text_center(d,(540,1055),"当前效果",font(36,True),TEAL)
    panel(img,(80,1100,1000,1260),fill=ICE,border=CYAN,cut=14,shadow=False)
    d.text((120,1180),"在线预算收益",font=font(36),fill=(*TEXT,255),anchor="lm")
    d.text((955,1180),"+111.11%",font=font(48,True),fill=(*TEAL,255),anchor="rm")
    text_center(d,(540,1320),"▼",font(72,True),ORANGE)
    text_center(d,(540,1395),"下一级效果",font(36,True),BLUE)
    panel(img,(80,1440,1000,1645),fill=ICE,border=BLUE,cut=14,shadow=False)
    d.text((120,1505),"在线预算收益",font=font(34),fill=(*TEXT,255),anchor="lm")
    d.text((955,1505),"+111.11%",font=font(44,True),fill=(*TEAL,255),anchor="rm")
    d.text((120,1585),"升级提升",font=font(34),fill=(*TEXT,255),anchor="lm")
    d.text((955,1585),"+11.11%",font=font(44,True),fill=(*ORANGE,255),anchor="rm")
    panel(img,(80,1675,1000,1810),fill=ICE,border=CYAN,cut=14,shadow=False)
    draw_coin(d,130,1742,26)
    d.text((180,1742),"升级消耗",font=font(34,True),fill=(*TEXT,255),anchor="lm")
    d.text((955,1742),"111111",font=font(42,True),fill=(*TEAL,255),anchor="rm")
    button(img,(45,1900,505,2060),"升级","blue",fs=58)
    button(img,(535,1900,1035,2060),"免费升级","primary","▣",54)
    return img


def make_team_info() -> Image.Image:
    img=modal_background("球队信息",6); d=ImageDraw.Draw(img,"RGBA")
    panel(img,(90,410,990,1790),fill=WHITE,border=BLUE,cut=30)
    d.polygon([(98,418),(760,418),(695,575),(98,575)],fill=(*BLUE,255))
    d.polygon([(760,418),(982,418),(982,575),(700,575)],fill=(*LIME,255))
    text_center(d,(540,495),"球队信息",font(76,True),WHITE,4,NAVY)
    button(img,(865,445,955,535),"X","blue",fs=43)
    d.text((135,625),"球队名字",font=font(34,True),fill=(*TEXT,255))
    panel(img,(125,670,955,790),fill=ICE,border=CYAN,cut=14,shadow=False)
    d.text((165,730),"大王篮球俱乐部",font=font(41,True),fill=(*TEXT,255),anchor="lm")
    # Vector pencil avoids relying on an emoji/symbol glyph in the pixel font.
    d.line([(884,744),(912,716)],fill=(*ORANGE,255),width=10)
    d.polygon([(878,750),(885,730),(898,743)],fill=(*ORANGE,255))
    d.line([(906,710),(918,722)],fill=(*NAVY,255),width=6)
    d.text((135,850),"球队总评",font=font(34,True),fill=(*TEXT,255))
    panel(img,(125,900,955,1085),fill=ICE,border=BLUE,cut=16,shadow=False)
    text_center(d,(540,993),"12.35B",font(82,True),BLUE,4,WHITE)
    d.text((135,1145),"最佳球员",font=font(34,True),fill=(*TEXT,255))
    panel(img,(125,1190,955,1435),fill=ICE,border=GOLD,cut=18,shadow=False)
    panel(img,(155,1210,350,1415),fill=WHITE,border=GOLD,cut=14,shadow=False,inner=False)
    img.alpha_composite(approved_yao((165,165)),(170,1220))
    img.alpha_composite(qframe(8,(195,205)),(155,1210))
    d.polygon([(168,1365),(337,1365),(325,1405),(180,1405)],fill=(*NAVY,235))
    text_center(d,(252,1387),"8.88M",font(26,True),WHITE,2,(0,0,0,255))
    d.text((390,1280),"姚 明",font=font(48,True),fill=(*TEXT,255),anchor="lm")
    d.text((390,1360),"球队核心",font=font(32),fill=(*TEAL,255),anchor="lm")
    d.text((135,1495),"累计胜场",font=font(34,True),fill=(*TEXT,255))
    panel(img,(125,1540,955,1660),fill=ICE,border=CYAN,cut=14,shadow=False)
    text_center(d,(540,1600),"12,345",font(64,True),ORANGE,3,WHITE)
    button(img,(285,1685,795,1770),"保存并关闭","primary",fs=40)
    return img


def make_idle_income() -> Image.Image:
    img=modal_background("离线收益",7); d=ImageDraw.Draw(img,"RGBA")
    panel(img,(145,650,935,1545),fill=WHITE,border=BLUE,cut=28)
    d.polygon([(153,658),(700,658),(650,810),(153,810)],fill=(*BLUE,255))
    d.polygon([(700,658),(927,658),(927,810),(650,810)],fill=(*LIME,255))
    text_center(d,(540,735),"离线收益",font(64,True),WHITE,4,NAVY)
    button(img,(820,685,900,765),"X","blue",fs=38)
    panel(img,(190,835,890,1005),fill=ICE,border=CYAN,cut=16,shadow=False)
    d.ellipse((265,858,319,912),outline=(*TEAL,255),width=6)
    d.line((292,885,292,868),fill=(*TEAL,255),width=5)
    d.line((292,885,307,895),fill=(*TEAL,255),width=5)
    text_center(d,(585,885),"已离线 8小时00分",font(34,True),TEXT)
    text_center(d,(540,955),"距离上限还有 3小时59分",font(28),GRAY)
    for i,(label,value) in enumerate([("基础收益","80,000"),("媒体加成","80,000")]):
        y=1035+i*125
        panel(img,(190,y,890,y+105),fill=WHITE,border=CYAN,cut=14,shadow=False,inner=False)
        if i == 0:
            d.ellipse((237,y+44,253,y+60),fill=(*GOLD,255))
        else:
            # Tiny vector media screen; avoids an unsupported boxed glyph.
            d.rounded_rectangle((230,y+38,260,y+63),4,outline=(*GOLD,255),width=4)
            d.line([(240,y+34),(245,y+38),(250,y+34)],fill=(*GOLD,255),width=3)
            d.polygon([(241,y+44),(241,y+57),(252,y+50)],fill=(*ORANGE,255))
        d.text((290,y+52),label,font=font(33,True),fill=(*TEXT,255),anchor="lm")
        d.text((850,y+52),value,font=font(42,True),fill=(*ORANGE,255),anchor="rm")
    button(img,(190,1300,890,1405),"领取  800,000","blue","●",40)
    button(img,(190,1420,890,1525),"领取  1,600,000","primary","▣",38)
    return img


def make_settings() -> Image.Image:
    img=modal_background("设置",8); d=ImageDraw.Draw(img,"RGBA")
    panel(img,(210,800,870,1370),fill=WHITE,border=BLUE,cut=28)
    d.polygon([(218,808),(650,808),(600,930),(218,930)],fill=(*BLUE,255))
    d.polygon([(650,808),(862,808),(862,930),(600,930)],fill=(*LIME,255))
    text_center(d,(540,868),"设置",font(64,True),WHITE,4,NAVY)
    button(img,(760,830,835,905),"X","blue",fs=34)
    for i,label in enumerate(("音乐","音效")):
        y=965+i*155
        panel(img,(260,y,820,y+120),fill=ICE,border=CYAN,cut=14,shadow=False)
        d.text((305,y+60),label,font=font(40,True),fill=(*TEXT,255),anchor="lm")
        d.rounded_rectangle((625,y+33,755,y+87),27,fill=(*CYAN,255),outline=(*NAVY,255),width=4)
        d.ellipse((702,y+38,748,y+82),fill=(*LIME,255),outline=(*NAVY,255),width=3)
        d.text((790,y+60),"开",font=font(32,True),fill=(*TEAL,255),anchor="rm")
    return img


def trophy(draw: ImageDraw.ImageDraw,cx,cy,scale=1.0) -> None:
    s=scale
    draw.polygon([(cx-70*s,cy-70*s),(cx+70*s,cy-70*s),(cx+52*s,cy+20*s),(cx+25*s,cy+55*s),(cx-25*s,cy+55*s),(cx-52*s,cy+20*s)],fill=(*GOLD,255),outline=(*NAVY,255))
    draw.arc((cx-115*s,cy-65*s,cx-35*s,cy+15*s),70,280,fill=(*GOLD,255),width=max(3,int(14*s)))
    draw.arc((cx+35*s,cy-65*s,cx+115*s,cy+15*s),-100,110,fill=(*GOLD,255),width=max(3,int(14*s)))
    draw.rectangle((cx-18*s,cy+50*s,cx+18*s,cy+105*s),fill=(*GOLD,255))
    draw.polygon([(cx-70*s,cy+105*s),(cx+70*s,cy+105*s),(cx+95*s,cy+135*s),(cx-95*s,cy+135*s)],fill=(*ORANGE,255),outline=(*NAVY,255))


def make_victory() -> Image.Image:
    img=modal_background("胜利",9); d=ImageDraw.Draw(img,"RGBA")
    panel(img,(125,380,955,1785),fill=WHITE,border=GOLD,cut=34)
    d.polygon([(133,388),(947,388),(947,745),(133,745)],fill=(*BLUE,255))
    for i in range(40):
        x=150+(i*73)%760; y=420+(i*47)%300; c=LIME if i%2 else GOLD
        d.rectangle((x,y,x+10,y+18),fill=(*c,210))
    trophy(d,540,500,.75)
    text_center(d,(540,690),"胜 利",font(112,True),WHITE,6,NAVY)
    text_center(d,(540,800),"新秀 常规赛 第24场",font(34,True),TEXT)
    text_center(d,(300,895),"大王篮球俱乐部",font(30,True),TEAL)
    text_center(d,(780,895),"深圳篮球俱乐部",font(30,True),ORANGE)
    text_center(d,(540,985),"1234567 : 1234567",font(58,True),NAVY,3,WHITE)
    divider(d,1065,GOLD)
    text_center(d,(540,1125),"本场奖励",font(34,True),TEXT)
    panel(img,(250,1170,830,1305),fill=ICE,border=GOLD,cut=16,shadow=False)
    draw_coin(d,330,1237,34)
    text_center(d,(590,1237),"预算 +10,000",font(42,True),TEXT)
    button(img,(210,1340,870,1460),"领取  800,000","orange","▣",40)
    button(img,(180,1510,445,1640),"返回","blue",fs=40)
    button(img,(475,1510,900,1640),"继续下一场","primary",fs=42)
    return img


def make_failure() -> Image.Image:
    img=modal_background("失败",10); d=ImageDraw.Draw(img,"RGBA")
    panel(img,(145,560,935,1580),fill=WHITE,border=ORANGE,cut=34)
    d.polygon([(153,568),(927,568),(927,870),(153,870)],fill=(*ICE,255))
    d.polygon([(440,568),(640,568),(600,730),(540,790),(480,730)],fill=(*ORANGE,255))
    text_center(d,(540,815),"失 败",font(98,True),ORANGE,5,WHITE)
    text_center(d,(540,930),"常规赛 第24场",font(34,True),TEXT)
    text_center(d,(300,1020),"大王篮球俱乐部",font(30,True),TEAL)
    text_center(d,(780,1020),"深圳篮球俱乐部",font(30,True),ORANGE)
    text_center(d,(540,1110),"1234567 : 1234567",font(56,True),NAVY,3,WHITE)
    button(img,(220,1190,860,1340),"","orange","▣",48)
    text_center(d,(565,1242),"重新挑战",font(42,True),WHITE,3,NAVY)
    text_center(d,(565,1302),"最多提升20%总评",font(20,True),WHITE,2,NAVY)
    button(img,(220,1380,860,1515),"调整阵容","blue",fs=48)
    return img


def make_recruit_probability() -> Image.Image:
    """Recruitment probability popup rebuilt from the approved result-screen master."""
    img=modal_background("主页",14); d=ImageDraw.Draw(img,"RGBA")
    # Dark pixel plate behind the popup keeps the same hierarchy as the result screen.
    d.polygon(cut_poly((115,300,965,1805),34),fill=(0,10,38,210))
    d.polygon(cut_poly((125,310,955,1795),30),fill=(*NAVY,245))
    header(img,"招募概率",330,505,False,None)
    close=button
    button(img,(855,365,940,460),"X","blue",fs=34)

    rows=[
        ("新秀","49.90%",1),("饮水机","27.94%",1),("轮换","13.77%",2),
        ("第六人","6.49%",2),("首发","1.90%",3),
    ]
    for i,(label,value,qidx) in enumerate(rows):
        y=535+i*160
        base=Image.open(quality_file(qidx,"概率行底{index:02d}_900x160.png")).convert("RGBA").resize((790,140),Image.Resampling.NEAREST)
        border=Image.open(quality_file(qidx,"概率行边框{index:02d}_900x160.png")).convert("RGBA").resize((790,140),Image.Resampling.NEAREST)
        img.alpha_composite(base,(145,y)); img.alpha_composite(border,(145,y))
        tag=Image.open(quality_file(qidx,"品质标签{index:02d}.png")).convert("RGBA").resize((122,52),Image.Resampling.NEAREST)
        img.alpha_composite(tag,(160,y+18))
        text_center(d,(250,y+72),label,font(34,True),WHITE,3,DEEP)
        d.line((345,y+90,780,y+90),fill=(*CYAN,150),width=4)
        text_center(d,(845,y+72),value,font(33,True),TEAL,2,WHITE)

    panel(img,(145,1350,935,1575),fill=ICE,border=GOLD,cut=22)
    scout=management_icon("球探",(105,105))
    if scout: img.alpha_composite(scout,(180,1390))
    d.text((315,1418),"球探  Lv.20",font=font(40,True),fill=(*TEXT,255),anchor="lm")
    d.text((315,1490),"最高品质概率  +0.20%",font=font(28,True),fill=(*BLUE,255),anchor="lm")
    d.polygon([(780,1360),(920,1360),(920,1565),(835,1565)],fill=(*LIME,235))
    draw_trophy_icon(d,855,1465,GOLD)
    button(img,(145,1610,935,1760),"立刻升级球探","primary",fs=48)
    return img


def save_all() -> list[Path]:
    jobs=[
        ("主页_街球竞技_v1.png",make_home),
        ("备赛_街球竞技_v1.png",make_prematch),
        ("比赛_街球竞技_v1.png",make_match),
        ("球员详情_街球竞技_MT品质_v1.png",make_player_detail),
        ("管理层_街球竞技_v1.png",make_management),
        ("球队信息_街球竞技_v1.png",make_team_info),
        ("离线收益_街球竞技_v1.png",make_idle_income),
        ("设置_街球竞技_v1.png",make_settings),
        ("胜利_街球竞技_v1.png",make_victory),
        ("失败_街球竞技_v1.png",make_failure),
        ("招募概率_街球竞技_品质系统_v1.png",make_recruit_probability),
    ]
    paths=[]
    for name,fn in jobs:
        im=pixel_finish(fn().convert("RGBA"),grid=2,colors=160)
        path=OUT/name; im.save(path); paths.append(path)
    return paths


def overview(paths: list[Path]) -> Path:
    all_paths=[OUT/"招募结果_街球竞技_MT品质_GOAT_v5_恢复图标.png"]+paths
    all_paths=list(dict.fromkeys(p for p in all_paths if p.exists()))
    cols=4; cell_w=300; cell_h=650; rows=math.ceil(len(all_paths)/cols)
    canvas=Image.new("RGBA",(cols*cell_w,rows*cell_h+90),(232,241,253,255)); d=ImageDraw.Draw(canvas,"RGBA")
    text_center(d,(canvas.width//2,42),"篮球游戏 · 全部新原型图",font(38,True),TEXT)
    short={
        "招募结果_街球竞技_MT品质_GOAT_v5_恢复图标":"招募结果",
        "招募概率_街球竞技_品质系统_v1":"招募概率",
        "主页_街球竞技_v1":"主页","备赛_街球竞技_v1":"备赛","比赛_街球竞技_v1":"比赛",
        "球员详情_街球竞技_MT品质_v1":"球员详情","管理层_街球竞技_v1":"管理层",
        "球队信息_街球竞技_v1":"球队信息","离线收益_街球竞技_v1":"离线收益",
        "设置_街球竞技_v1":"设置","胜利_街球竞技_v1":"胜利","失败_街球竞技_v1":"失败",
    }
    for i,p in enumerate(all_paths):
        im=Image.open(p).convert("RGBA"); im.thumbnail((260,520),Image.Resampling.NEAREST)
        x=(i%cols)*cell_w+(cell_w-im.width)//2; y=80+(i//cols)*cell_h
        d.polygon(cut_poly((i%cols*cell_w+12,y-8,i%cols*cell_w+cell_w-12,y+560),12),fill=(255,255,255,255),outline=(*BLUE,255))
        canvas.alpha_composite(im,(x,y))
        text_center(d,(i%cols*cell_w+cell_w//2,y+590),short.get(p.stem,p.stem),font(24,True),TEXT)
    out=OUT/"00_全部新原型图总览.png"; pixel_finish(canvas,grid=2,colors=160).save(out); return out


def verify(paths: list[Path]) -> None:
    for p in paths:
        with Image.open(p) as im:
            if im.size != (W,H): raise AssertionError(f"{p.name}: {im.size}")
            if im.mode != "RGBA": raise AssertionError(f"{p.name}: {im.mode}")


def main() -> None:
    ensure()
    paths=save_all()
    verify(paths)
    ov=overview(paths)
    print(ov)
    for p in paths: print(p)


if __name__ == "__main__":
    main()
