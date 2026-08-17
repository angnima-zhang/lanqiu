from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

import generate_all_remaining_prototypes as g
from generate_young_sports_ui import cut_poly, mix


OUT = g.ROOT / "新设计" / "UI元素合图"
SIZE = 2048
WHITE_BG = (255, 255, 255, 255)


def transparent(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGBA", size, (0, 0, 0, 0))


def panel_asset(w: int, h: int, fill=g.WHITE, border=g.BLUE, cut=22, shadow=True, inner=True) -> Image.Image:
    img = transparent((w, h))
    pad = 18 if shadow else 8
    g.panel(img, (pad, 8, w-pad, h-pad), fill=fill, border=border, cut=cut, shadow=shadow, inner=inner)
    return img


def header_asset(w=960, h=170, back=False, right=False) -> Image.Image:
    img = transparent((w, h)); d = ImageDraw.Draw(img, "RGBA")
    g.panel(img, (8, 4, w-18, h-18), fill=g.WHITE, border=g.NAVY, cut=24)
    d.polygon([(16,12),(int(w*.69),12),(int(w*.62),h-26),(16,h-26)], fill=(*g.BLUE,255))
    d.polygon([(int(w*.73),12),(w-26,12),(w-26,h-26),(int(w*.65),h-26)], fill=(*g.LIME,255))
    if back:
        cy=h//2-6
        d.polygon([(35,cy),(75,cy-34),(75,cy-14),(116,cy-14),(116,cy+14),(75,cy+14),(75,cy+34)], fill=(*g.WHITE,255))
    if right:
        d.rounded_rectangle((w-190,40,w-55,h-55),16,fill=(*g.ICE,220),outline=(*g.NAVY,255),width=4)
    return img


def button_asset(w=620, h=125, kind="primary", icon=None) -> Image.Image:
    img=transparent((w,h))
    g.button(img,(8,5,w-18,h-18),"",kind,icon,42)
    return img


def disabled_button(w=620,h=125) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    p=cut_poly((8,5,w-18,h-18),18)
    d.polygon([(x+7,y+9) for x,y in p],fill=(2,12,48,80))
    d.polygon(p,fill=(174,190,207,255)); d.line(p+[p[0]],fill=(*g.GRAY,255),width=7)
    q=cut_poly((16,13,w-26,h-26),12); d.line(q+[q[0]],fill=(238,245,250,230),width=3)
    return img


def square_button(kind="blue", icon="close", size=120) -> Image.Image:
    img=transparent((size,size)); d=ImageDraw.Draw(img,"RGBA")
    fills={"blue":g.BLUE,"lime":g.LIME,"orange":g.ORANGE,"red":g.RED,"white":g.WHITE}
    p=cut_poly((8,6,size-18,size-18),16)
    d.polygon([(x+6,y+8) for x,y in p],fill=(2,12,48,95)); d.polygon(p,fill=(*fills[kind],255))
    d.line(p+[p[0]],fill=(*g.NAVY,255),width=6)
    fg=g.WHITE if kind in {"blue","orange","red"} else g.NAVY
    c=size//2-4
    if icon=="close":
        d.line((c-20,c-20,c+20,c+20),fill=(*fg,255),width=9); d.line((c+20,c-20,c-20,c+20),fill=(*fg,255),width=9)
    elif icon=="back":
        d.polygon([(c-28,c),(c+8,c-28),(c+8,c-10),(c+30,c-10),(c+30,c+10),(c+8,c+10),(c+8,c+28)],fill=(*fg,255))
    elif icon=="gear":
        g.draw_gear(d,c,c,fg)
    elif icon=="play":
        d.polygon([(c-18,c-28),(c-18,c+28),(c+30,c)],fill=(*fg,255))
    return img


def nav_tab(active=False, manager=False) -> Image.Image:
    w,h=(185,165) if manager else (300,180)
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    g.panel(img,(8,7,w-18,h-18),fill=g.LIME if active else g.WHITE,border=g.NAVY if active else g.BLUE,cut=16,shadow=False)
    if manager:
        d.rounded_rectangle((w//2-31,26,w//2+31,88),8,fill=(*g.ICE,255),outline=(*g.NAVY,255),width=5)
        d.line((w//2,32,w//2,82),fill=(*g.BLUE,255),width=3)
        d.ellipse((w//2-22,45,w//2-10,57),fill=(*g.ORANGE,255))
        d.ellipse((w//2+10,60,w//2+22,72),fill=(*g.TEAL,255))
    else:
        d.ellipse((w//2-35,30,w//2+35,100),fill=(*(g.CYAN if active else g.ICE),255),outline=(*g.NAVY,255),width=5)
        d.polygon([(w//2,42),(w//2+14,69),(w//2+44,73),(w//2+20,92),(w//2+28,122),(w//2,105),(w//2-28,122),(w//2-20,92),(w//2-44,73),(w//2-14,69)],fill=(*g.NAVY,255))
    return img


def toggle(on=True) -> Image.Image:
    img=transparent((240,90)); d=ImageDraw.Draw(img,"RGBA")
    d.rounded_rectangle((15,15,225,75),30,fill=(*(g.CYAN if on else g.GRAY),255),outline=(*g.NAVY,255),width=5)
    cx=185 if on else 55
    d.ellipse((cx-25,20,cx+25,70),fill=(*(g.LIME if on else g.WHITE),255),outline=(*g.NAVY,255),width=4)
    return img


def focus_ring(w=300,h=180) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    p=cut_poly((8,8,w-8,h-8),18); d.line(p+[p[0]],fill=(*g.LIME,255),width=10)
    q=cut_poly((20,20,w-20,h-20),12); d.line(q+[q[0]],fill=(*g.CYAN,255),width=4)
    return img


def progress_bar(w=800,h=55,ratio=.62,color=g.CYAN,segmented=False) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    if segmented:
        count=16; gap=6; cell=(w-20-gap*(count-1))//count
        for i in range(count):
            x=10+i*(cell+gap); active=i<round(count*ratio)
            d.rectangle((x,10,x+cell,h-10),fill=(*(color if active else (190,215,232)),255),outline=(*g.NAVY,255),width=3)
    else:
        d.rounded_rectangle((8,8,w-8,h-8),18,fill=(187,218,237,255),outline=(*g.NAVY,255),width=4)
        if ratio>0:
            d.rounded_rectangle((12,12,12+int((w-24)*ratio),h-12),14,fill=(*color,255))
    return img


def ovr_panel() -> Image.Image:
    img=panel_asset(760,250,fill=g.WHITE,border=g.GOLD,cut=20)
    d=ImageDraw.Draw(img,"RGBA")
    d.polygon([(85,30),(675,30),(635,58),(125,58)],fill=(*g.BLUE,255))
    d.polygon([(320,190),(440,190),(420,225),(340,225)],fill=(*g.GOLD,255))
    return img


def stat_row(icon=True) -> Image.Image:
    img=panel_asset(920,125,fill=g.WHITE,border=g.CYAN,cut=14,shadow=False,inner=False); d=ImageDraw.Draw(img,"RGBA")
    if icon:
        d.ellipse((32,25,102,95),fill=(*g.DEEP,255),outline=(*g.CYAN,255),width=5)
        d.polygon([(67,35),(82,52),(77,80),(57,89),(43,66)],fill=(*g.TEAL,255))
    d.polygon([(730,12),(900,12),(875,113),(705,113)],fill=(*g.ICE,255))
    return img


def score_chip(enemy=False) -> Image.Image:
    border=g.ORANGE if enemy else g.CYAN
    img=panel_asset(450,150,fill=g.WHITE,border=border,cut=16,shadow=False)
    d=ImageDraw.Draw(img,"RGBA"); d.rectangle((20,22,85,128),fill=(*border,35))
    return img


def event_row(selected=False) -> Image.Image:
    img=panel_asset(900,105,fill=g.WHITE,border=g.CYAN if selected else g.BLUE,cut=14,shadow=False,inner=False); d=ImageDraw.Draw(img,"RGBA")
    d.polygon([(12,10),(130,10),(105,95),(12,95)],fill=(*(g.LIME if selected else g.ICE),255))
    return img


def pill(w=320,h=80,color=g.CYAN) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    p=cut_poly((5,5,w-5,h-5),14); d.polygon(p,fill=(*g.WHITE,255)); d.line(p+[p[0]],fill=(*color,255),width=6)
    d.polygon([(5,19),(82,5),(65,h-5),(5,h-19)],fill=(*mix(color,g.WHITE,.35),255))
    return img


def card_shell(w=360,h=500,quality=3,detail=False) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    bg=Image.open(g.quality_file(quality,"招募背景{index:02d}.png")).convert("RGBA").resize((w-40,h-80),Image.Resampling.LANCZOS)
    bg_mask=Image.new("L",bg.size,0)
    ImageDraw.Draw(bg_mask).polygon(cut_poly((0,0,bg.width-1,bg.height-1),22),fill=255)
    bg.putalpha(bg_mask)
    img.alpha_composite(bg,(20,20))
    frame=g.qframe(quality,(w-20,h-45))
    img.alpha_composite(frame,(10,8))
    d.polygon([(25,h-115),(w-25,h-115),(w-45,h-40),(45,h-40)],fill=(*g.NAVY,245))
    if detail:
        d.polygon([(0,h-42),(w//2-45,h-42),(w//2,h-5),(w//2+45,h-42),(w,h-42),(w,h),(0,h)],fill=(*g.GOLD,220))
    return img


def empty_slot(round_slot=False,quality=2) -> Image.Image:
    size=(230,230); img=transparent(size); d=ImageDraw.Draw(img,"RGBA")
    d.rounded_rectangle((25,25,205,205),24,fill=(*g.ICE,255))
    img.alpha_composite(g.qframe(quality,(210,210),round_slot),(10,10))
    d.line((82,115,148,115),fill=(*g.NAVY,255),width=10); d.line((115,82,115,148),fill=(*g.NAVY,255),width=10)
    return img


def team_plate(enemy=False) -> Image.Image:
    color=g.ORANGE if enemy else g.CYAN
    img=panel_asset(480,140,fill=g.WHITE,border=color,cut=18,shadow=False); d=ImageDraw.Draw(img,"RGBA")
    d.ellipse((20,25,110,115),fill=(*g.NAVY,255),outline=(*color,255),width=6)
    d.polygon([(145,20),(460,20),(430,120),(120,120)],fill=(*color,22))
    return img


def court_frame() -> Image.Image:
    img=transparent((940,520)); d=ImageDraw.Draw(img,"RGBA")
    g.panel(img,(10,8,930,505),fill=g.WHITE,border=g.CYAN,cut=22)
    d.rectangle((35,35,905,475),fill=(255,151,24,255),outline=(*g.WHITE,255),width=8)
    d.line((470,35,470,475),fill=(*g.WHITE,255),width=7); d.ellipse((410,190,530,310),outline=(*g.WHITE,255),width=7)
    for x in (35,705):
        d.rectangle((x,145,x+200,365),outline=(*g.WHITE,255),width=6)
    return img


def result_banner(win=True) -> Image.Image:
    img=transparent((700,330)); d=ImageDraw.Draw(img,"RGBA")
    color=g.BLUE if win else g.ORANGE
    p=cut_poly((10,8,690,320),24); d.polygon([(x+8,y+10) for x,y in p],fill=(2,12,48,90)); d.polygon(p,fill=(*g.WHITE,255)); d.line(p+[p[0]],fill=(*(g.GOLD if win else g.ORANGE),255),width=8)
    if win:
        d.rectangle((18,16,682,185),fill=(*g.BLUE,255)); g.trophy(d,350,93,.65)
    else:
        d.polygon([(265,16),(435,16),(400,145),(350,195),(300,145)],fill=(*g.ORANGE,255))
    return img


def modal_shell(w=900,h=700,accent=g.BLUE) -> Image.Image:
    img=transparent((w,h)); d=ImageDraw.Draw(img,"RGBA")
    g.panel(img,(10,8,w-20,h-18),fill=g.WHITE,border=accent,cut=30)
    d.polygon([(18,16),(int(w*.70),16),(int(w*.63),170),(18,170)],fill=(*g.BLUE,255))
    d.polygon([(int(w*.70),16),(w-28,16),(w-28,170),(int(w*.64),170)],fill=(*g.LIME,255))
    return img


def reward_row() -> Image.Image:
    img=panel_asset(720,120,fill=g.ICE,border=g.GOLD,cut=14,shadow=False); d=ImageDraw.Draw(img,"RGBA"); g.draw_coin(d,80,60,30)
    d.polygon([(160,18),(690,18),(665,102),(140,102)],fill=(*g.WHITE,190))
    return img


def icon_asset(name: str, size=128) -> Image.Image:
    img=transparent((size,size)); d=ImageDraw.Draw(img,"RGBA"); c=size//2
    project = g.management_icon(name,(size-18,size-18)) if name in {"运营","教练","球探","队医","媒体"} else None
    if project:
        img.alpha_composite(project,((size-project.width)//2,(size-project.height)//2)); return img
    stat = g.stat_icon(name,(size-18,size-18)) if name in {"得分","篮板","助攻","抢断","盖帽"} else None
    if stat:
        img.alpha_composite(stat,((size-stat.width)//2,(size-stat.height)//2)); return img
    if name=="教练":
        d.rounded_rectangle((30,24,size-30,size-24),12,fill=(*g.ICE,255),outline=(*g.NAVY,255),width=7)
        d.line((c,32,c,size-32),fill=(*g.BLUE,255),width=4)
        d.ellipse((45,50,65,70),fill=(*g.ORANGE,255)); d.ellipse((size-65,size-70,size-45,size-50),fill=(*g.TEAL,255))
        d.line((58,62,size-58,size-62),fill=(*g.TEXT,255),width=5)
    elif name=="齿轮": g.draw_gear(d,c,c,g.NAVY)
    elif name=="球馆": g.draw_stadium(d,c,c,g.BLUE)
    elif name=="奖杯": g.draw_trophy_icon(d,c,c,g.GOLD)
    elif name=="金币": g.draw_coin(d,c,c,size//4)
    elif name=="时钟":
        d.ellipse((25,25,size-25,size-25),outline=(*g.TEAL,255),width=8); d.line((c,c,c,c-28),fill=(*g.TEAL,255),width=7); d.line((c,c,c+24,c+16),fill=(*g.TEAL,255),width=7)
    elif name=="媒体":
        d.rounded_rectangle((24,34,size-24,size-25),10,outline=(*g.GOLD,255),width=7); d.line((c-20,25,c,34,c+20,25),fill=(*g.GOLD,255),width=5); d.polygon([(c-13,c-20),(c-13,c+22),(c+23,c)],fill=(*g.ORANGE,255))
    elif name=="播放":
        d.rounded_rectangle((18,30,size-18,size-30),12,outline=(*g.NAVY,255),width=8); d.polygon([(c-16,c-27),(c-16,c+27),(c+30,c)],fill=(*g.LIME,255))
    elif name=="快进":
        d.polygon([(20,32),(20,size-32),(c-6,c)],fill=(*g.BLUE,255))
        d.polygon([(c-6,32),(c-6,size-32),(size-20,c)],fill=(*g.BLUE,255))
    elif name=="编辑":
        d.line([(36,size-35),(size-38,39)],fill=(*g.ORANGE,255),width=16); d.polygon([(26,size-24),(38,size-61),(61,size-38)],fill=(*g.ORANGE,255)); d.line([(size-47,27),(size-27,47)],fill=(*g.NAVY,255),width=9)
    elif name=="箭头上": d.polygon([(c,20),(size-20,c),(c+18,c),(c+18,size-20),(c-18,size-20),(c-18,c),(20,c)],fill=(*g.BLUE,255))
    elif name=="箭头下": d.polygon([(c,size-20),(size-20,c),(c+18,c),(c+18,20),(c-18,20),(c-18,c),(20,c)],fill=(*g.ORANGE,255))
    elif name=="勾": d.line((25,c,c-8,size-30,size-22,28),fill=(*g.TEAL,255),width=14)
    elif name=="警告":
        d.polygon([(c,15),(size-15,size-20),(15,size-20)],fill=(*g.ORANGE,255),outline=(*g.NAVY,255)); d.rectangle((c-6,45,c+6,82),fill=(*g.WHITE,255)); d.ellipse((c-7,93,c+7,107),fill=(*g.WHITE,255))
    return img


class Sheet:
    def __init__(self, filename: str):
        self.filename=filename
        self.image=Image.new("RGBA",(SIZE,SIZE),WHITE_BG)
        self.items=[]

    def add(self,name: str,img: Image.Image,x: int,y: int):
        self.image.alpha_composite(img,(x,y))
        self.items.append({"name":name,"x":x,"y":y,"width":img.width,"height":img.height})

    def save(self):
        white_mask=ImageChops.difference(self.image,Image.new("RGBA",self.image.size,WHITE_BG)).convert("L").point(lambda value: 255 if value==0 else 0)
        finished=g.pixel_finish(self.image,grid=2,colors=160)
        finished.paste(WHITE_BG,(0,0,finished.width,finished.height),white_mask)
        self.image=finished
        path=OUT/self.filename; self.image.save(path); return path


def sheet_frames() -> Sheet:
    s=Sheet("01_背景与面板_街球竞技.png")
    light=g.street_background(1,True).resize((430,430),Image.Resampling.LANCZOS)
    dark=g.street_background(2,False).resize((430,430),Image.Resampling.LANCZOS)
    s.add("明亮街球背景块",light,35,35); s.add("弹窗深色遮罩背景块",dark,500,35)
    s.add("通用斜切标题栏",header_asset(1030,180),970,35)
    for i,(name,border) in enumerate([("青色信息面板",g.CYAN),("蓝色普通面板",g.BLUE),("金色品质面板",g.GOLD)]):
        s.add(name,panel_asset(600,260,g.WHITE,border,22),35+i*660,510)
    s.add("大型弹窗主体",modal_shell(900,620),35,825)
    s.add("胜利结果骨架",result_banner(True),980,825); s.add("失败结果骨架",result_banner(False),980,1180)
    s.add("橙色风险面板",panel_asset(600,260,g.WHITE,g.ORANGE,22),35,1490)
    s.add("通用数据行底板",stat_row(False),690,1530)
    s.add("蓝绿分段标题底板",header_asset(900,170),690,1710)
    return s


def sheet_buttons() -> Sheet:
    s=Sheet("02_按钮导航与交互状态.png")
    kinds=[("主操作按钮_荧光绿","primary"),("普通按钮_竞技蓝","blue"),("次操作按钮_竞技橙","orange"),("危险按钮_红色","danger"),("白色次级按钮","white")]
    for i,(name,kind) in enumerate(kinds): s.add(name,button_asset(620,125,kind),35+(i%3)*660,35+(i//3)*155)
    s.add("禁用按钮",disabled_button(),1355,190)
    for i,(name,kind,icon) in enumerate([("关闭按钮","blue","close"),("返回按钮","blue","back"),("设置按钮","lime","gear")]): s.add(name,square_button(kind,icon),35+i*150,390)
    s.add("底部导航_普通",nav_tab(False),530,375); s.add("底部导航_选中",nav_tab(True),855,375)
    s.add("管理页签_普通",nav_tab(False,True),1190,385); s.add("管理页签_选中",nav_tab(True,True),1400,385)
    s.add("开关_开启",toggle(True),1620,415); s.add("开关_关闭",toggle(False),1620,520)
    s.add("视频主操作按钮",button_asset(900,135,"primary","▣"),35,650)
    s.add("金币领取按钮",button_asset(900,135,"blue","●"),980,650)
    s.add("双倍速按钮",button_asset(620,125,"blue","▶"),35,830)
    s.add("跳过按钮",button_asset(620,125,"orange","▶"),700,830)
    s.add("键盘手柄焦点框",focus_ring(500,180),1370,805)
    s.add("小型主操作",button_asset(430,110,"primary"),35,1030); s.add("小型普通操作",button_asset(430,110,"blue"),500,1030); s.add("小型危险操作",button_asset(430,110,"danger"),965,1030)
    s.add("图标按钮_播放",square_button("lime","play",130),1450,1015); s.add("图标按钮_关闭",square_button("blue","close",130),1600,1015); s.add("图标按钮_设置",square_button("lime","gear",130),1750,1015)
    s.add("标签页宽底板_普通",panel_asset(580,150,g.WHITE,g.BLUE,16,False),35,1210); s.add("标签页宽底板_选中",panel_asset(580,150,g.LIME,g.NAVY,16,False),660,1210)
    s.add("底部大主操作",button_asset(1240,150,"primary"),35,1430)
    s.add("并排按钮_蓝",button_asset(590,145,"blue"),35,1640); s.add("并排按钮_绿",button_asset(590,145,"primary"),660,1640); s.add("并排按钮_橙",button_asset(590,145,"orange"),1285,1640)
    return s


def sheet_data() -> Sheet:
    s=Sheet("03_数据进度与状态组件.png")
    s.add("OVR总评面板",ovr_panel(),35,35)
    s.add("属性数据行",stat_row(True),830,35)
    s.add("普通进度条_满",progress_bar(900,60,1,g.CYAN),35,330); s.add("普通进度条_半",progress_bar(900,60,.52,g.CYAN),35,420)
    s.add("升级进度条_荧光绿",progress_bar(900,60,.78,g.LIME),35,510); s.add("风险进度条_橙",progress_bar(900,60,.35,g.ORANGE),35,600)
    s.add("分段进度条_蓝",progress_bar(900,60,.62,g.BLUE,True),1030,330); s.add("分段进度条_橙",progress_bar(900,60,.42,g.ORANGE,True),1030,420)
    s.add("节比分面板_我方",score_chip(False),1030,520); s.add("节比分面板_敌方",score_chip(True),1510,520)
    s.add("比赛事件行_普通",event_row(False),35,720); s.add("比赛事件行_当前",event_row(True),35,850)
    s.add("时间状态胶囊_青",pill(420,85,g.CYAN),1000,745); s.add("风险状态胶囊_橙",pill(420,85,g.ORANGE),1450,745)
    s.add("属性增益行_青",stat_row(False),35,1010); s.add("属性增益行_蓝",panel_asset(920,125,g.ICE,g.BLUE,14,False),995,1010)
    s.add("双栏对比底板",panel_asset(920,270,g.WHITE,g.GOLD,18),35,1190)
    s.add("当前下一等级底板",panel_asset(920,270,g.ICE,g.BLUE,18),995,1190)
    s.add("累计统计行",panel_asset(920,135,g.WHITE,g.BLUE,16),35,1520)
    s.add("预算消耗行",reward_row(),995,1520)
    s.add("球队等级进度",progress_bar(900,75,.35,g.CYAN),35,1710)
    s.add("招募概率行底板",Image.open(g.quality_file(3,"概率行底03_900x160.png")).convert("RGBA"),995,1690)
    return s


def sheet_quality() -> Sheet:
    s=Sheet("04_九档球员品质组件总表.png")
    for i in range(9):
        x=25+i*224
        square=Image.open(g.quality_file(i,f"头像框{i}-方.png")).convert("RGBA").resize((205,205),Image.Resampling.LANCZOS)
        circle=Image.open(g.quality_file(i,f"头像框{i}-圆.png")).convert("RGBA").resize((205,205),Image.Resampling.LANCZOS)
        thin=Image.open(g.quality_file(i,f"细边框{i:02d}.png")).convert("RGBA").resize((150,150),Image.Resampling.LANCZOS)
        plate=Image.open(g.quality_file(i,f"名牌{i:02d}.png")).convert("RGBA").resize((205,64),Image.Resampling.LANCZOS)
        tag=Image.open(g.quality_file(i,f"品质标签{i:02d}.png")).convert("RGBA").resize((150,63),Image.Resampling.LANCZOS)
        wheat=Image.open(g.quality_file(i,f"麦穗{i:02d}.png")).convert("RGBA").resize((78,195),Image.Resampling.LANCZOS)
        recruit=Image.open(g.quality_file(i,f"招募背景{i:02d}.png")).convert("RGBA").resize((205,205),Image.Resampling.LANCZOS)
        s.add(f"品质{i}_方头像框",square,x,25); s.add(f"品质{i}_圆头像框",circle,x,260)
        s.add(f"品质{i}_细边框",thin,x+27,500); s.add(f"品质{i}_名牌",plate,x,685)
        s.add(f"品质{i}_品质标签",tag,x+27,790); s.add(f"品质{i}_麦穗",wheat,x+63,900)
        s.add(f"品质{i}_招募背景",recruit,x,1130)
    for i in range(9):
        row=Image.open(g.quality_file(i,f"概率行边框{i:02d}_900x160.png")).convert("RGBA").resize((420,75),Image.Resampling.LANCZOS)
        s.add(f"品质{i}_概率行边框",row,25+(i%4)*500,1390+(i//4)*120)
    return s


def sheet_cards() -> Sheet:
    s=Sheet("05_球员卡片与阵容槽位.png")
    s.add("普通球员卡壳",card_shell(360,500,3),35,35); s.add("高品质球员卡壳",card_shell(360,500,7),430,35); s.add("GOAT球员卡壳",card_shell(360,500,8,True),825,35)
    s.add("球员详情大卡壳",card_shell(600,520,8,True),1240,35)
    s.add("方阵容槽位_普通",empty_slot(False,2),35,600); s.add("方阵容槽位_高品质",empty_slot(False,7),290,600); s.add("圆阵容槽位",empty_slot(True,4),545,600)
    s.add("替换球员小卡底板",panel_asset(540,250,g.WHITE,g.GOLD,18),830,600); s.add("最佳球员信息底板",panel_asset(600,250,g.ICE,g.GOLD,18),1410,600)
    s.add("球员列表卡_普通",panel_asset(430,360,g.WHITE,g.BLUE,18),35,910); s.add("球员列表卡_选中",panel_asset(430,360,g.LIME,g.NAVY,18),500,910)
    s.add("管理层成员卡",panel_asset(430,360,g.WHITE,g.CYAN,18),965,910); s.add("空球员卡槽",panel_asset(430,360,g.ICE,g.GRAY,18),1430,910)
    s.add("球员名牌长底板",Image.open(g.quality_file(8,"名牌08.png")).convert("RGBA").resize((700,216),Image.Resampling.LANCZOS),35,1330)
    s.add("卡片底部数值条",pill(700,95,g.GOLD),800,1375)
    s.add("品质角标位",Image.open(g.quality_file(8,"品质标签08.png")).convert("RGBA").resize((260,109),Image.Resampling.LANCZOS),1550,1340)
    s.add("五属性行底板",stat_row(True),35,1630)
    s.add("球员生涯统计行",panel_asset(920,135,g.WHITE,g.BLUE,16),995,1630)
    return s


def sheet_match() -> Sheet:
    s=Sheet("06_比赛HUD与赛果组件.png")
    s.add("球队牌_我方",team_plate(False),35,35); s.add("球队牌_敌方",team_plate(True),545,35)
    s.add("节比分_我方",score_chip(False),1090,35); s.add("节比分_敌方",score_chip(True),1570,35)
    s.add("篮球场视窗",court_frame(),35,230)
    s.add("比赛事件_普通",event_row(False),1010,230); s.add("比赛事件_当前",event_row(True),1010,365)
    s.add("比赛控制_倍速",button_asset(430,120,"blue","▶"),1010,520); s.add("比赛控制_跳过",button_asset(430,120,"orange","▶"),1475,520)
    s.add("立即获胜_广告",button_asset(895,130,"primary","▣"),1010,675)
    s.add("胜利赛果头",result_banner(True),35,820); s.add("失败赛果头",result_banner(False),770,820)
    s.add("奖励行",reward_row(),35,1190); s.add("重新挑战按钮",button_asset(720,130,"orange","▣"),800,1190)
    s.add("赛后返回按钮",button_asset(520,130,"blue"),35,1380); s.add("继续下一场按钮",button_asset(720,130,"primary"),600,1380)
    s.add("奖杯图标",icon_asset("奖杯",180),1400,1350); s.add("警告失败图标",icon_asset("警告",180),1620,1350)
    s.add("大比分展示底板",panel_asset(980,220,g.WHITE,g.NAVY,20),35,1600)
    s.add("赛程场次条",pill(760,95,g.BLUE),1060,1640)
    return s


def sheet_modals() -> Sheet:
    s=Sheet("07_弹窗奖励与系统面板.png")
    s.add("球队信息大弹窗",modal_shell(900,760),35,35)
    s.add("离线收益中弹窗",modal_shell(760,650),990,35)
    s.add("设置小弹窗",modal_shell(620,480),35,840)
    s.add("奖励数据行",reward_row(),700,840)
    s.add("离线时长面板",panel_asset(700,170,g.ICE,g.CYAN,16,False),700,990)
    s.add("收益明细行",stat_row(False),35,1360)
    s.add("设置选项行",panel_asset(650,130,g.ICE,g.CYAN,14,False),995,1210)
    s.add("开关开启",toggle(True),1680,1230)
    s.add("最佳球员展示行",panel_asset(820,260,g.ICE,g.GOLD,18,False),35,1540)
    s.add("球队总评展示框",ovr_panel(),900,1500)
    s.add("弹窗关闭按钮",square_button("blue","close",130),1700,1510)
    s.add("编辑图标",icon_asset("编辑",130),1700,1680)
    return s


def sheet_icons() -> Sheet:
    s=Sheet("08_功能与属性图标.png")
    names=["运营","教练","球探","队医","媒体","得分","篮板","助攻","抢断","盖帽","齿轮","球馆","奖杯","金币","时钟","播放","快进","编辑","箭头上","箭头下","勾","警告"]
    for i,name in enumerate(names):
        x=50+(i%8)*245; y=45+(i//8)*245
        s.add(name,icon_asset(name,160),x,y)
    # Also expose the common square interaction shells separately.
    squares=[("关闭",square_button("blue","close",150)),("返回",square_button("blue","back",150)),("设置",square_button("lime","gear",150))]
    for i,(name,img) in enumerate(squares): s.add(name,img,50+i*245,820)
    for i,(name,color) in enumerate([("我方圆标",g.CYAN),("敌方圆标",g.ORANGE),("主操作圆标",g.LIME),("危险圆标",g.RED)]):
        img=transparent((150,150)); d=ImageDraw.Draw(img,"RGBA"); d.ellipse((16,16,134,134),fill=(*g.NAVY,255),outline=(*color,255),width=9)
        s.add(name,img,820+i*245,820)
    for i,(name,color) in enumerate([("信息菱形",g.CYAN),("品质菱形",g.GOLD),("风险三角",g.ORANGE),("成功六边形",g.TEAL)]):
        img=transparent((160,160)); d=ImageDraw.Draw(img,"RGBA")
        if "三角" in name: d.polygon([(80,15),(145,140),(15,140)],fill=(*color,255),outline=(*g.NAVY,255))
        elif "六边形" in name: d.polygon([(45,15),(115,15),(150,80),(115,145),(45,145),(10,80)],fill=(*color,255),outline=(*g.NAVY,255))
        else: d.polygon([(80,10),(150,80),(80,150),(10,80)],fill=(*color,255),outline=(*g.NAVY,255))
        s.add(name,img,50+i*245,1050)
    return s


def build_overview(paths: list[Path]) -> Path:
    canvas=Image.new("RGBA",(SIZE,SIZE),WHITE_BG)
    for i,p in enumerate(paths):
        src=Image.open(p).convert("RGBA")
        diff=ImageChops.difference(src,Image.new("RGBA",src.size,WHITE_BG)).convert("RGB")
        bbox=diff.getbbox() or (0,0,src.width,src.height)
        crop=src.crop(bbox)
        scale=min(640/crop.width,640/crop.height)
        thumb=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.NEAREST)
        cell_x=20+(i%3)*675; cell_y=20+(i//3)*675
        x=cell_x+(640-thumb.width)//2; y=cell_y+(640-thumb.height)//2
        canvas.alpha_composite(thumb,(x,y))
    result=g.pixel_finish(canvas,grid=2,colors=160)
    # Preserve the cut-friendly pure-white overview background.
    bgmask=ImageChops.difference(canvas,Image.new("RGBA",canvas.size,WHITE_BG)).convert("L").point(lambda value: 255 if value==0 else 0)
    result.paste(WHITE_BG,(0,0,result.width,result.height),bgmask)
    out=OUT/"00_UI元素合图总览.png"; result.save(out); return out


def main() -> None:
    OUT.mkdir(parents=True,exist_ok=True)
    sheets=[sheet_frames(),sheet_buttons(),sheet_data(),sheet_quality(),sheet_cards(),sheet_match(),sheet_modals(),sheet_icons()]
    paths=[s.save() for s in sheets]
    overview=build_overview(paths)
    manifest={"sheet_size":[SIZE,SIZE],"background":"#FFFFFF","sheets":{s.filename:s.items for s in sheets}}
    (OUT/"切图坐标.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    for p in [overview,*paths]:
        with Image.open(p) as im:
            if im.size!=(SIZE,SIZE) or im.mode!="RGBA": raise RuntimeError(f"invalid output: {p} {im.size} {im.mode}")
            if im.getpixel((0,0))!=WHITE_BG: raise RuntimeError(f"non-white corner: {p}")
    for p in [overview,*paths]: print(p)


if __name__=="__main__":
    main()
