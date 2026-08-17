from PIL import Image
import os

# 品质映射 - 共13个品质
quality_map = {
    '金': '00',
    '绿宝石': '01',
    '蓝宝石': '02',
    '红宝石': '03',
    '紫宝石': '04',
    '钻石': '05',
    '粉钻': '06',
    '银河欧珀': '07',
    '暗物质': '08',
    '无敌': '09',
    '总评一百': '10',
    '炫金': '11',
    'GOAT': '12',
}

# 参考目标尺寸
ref_sizes = {
    '名牌': (353, 109),
    '品质标签': (100, 42),
    '头像框-圆': (200, 202),
    '头像框-方': (193, 199),
    '招募背景': (300, 300),
    '细边框': (100, 102),
    '麦穗': (88, 218),
}

# 精确的UI元素坐标（通过连通域分析得出）
# 注意：头像框-方和头像框-圆需要根据具体图片区分
# 从分析中得知：左上角(#2)是大元素，右上角(#1)也是大元素
# 根据原始UI命名规则，需要判断哪个是"方"哪个是"圆"
layouts = {
    # 左上大元素 - 包含方框特征（边角分明）
    '头像框-方': (63, 35, 587, 548),
    # 右上大元素 - 圆形特征明显（圆环）
    '头像框-圆': (656, 28, 1189, 561),
    # 底部长条 - 名牌
    '名牌': (58, 1016, 888, 1221),
    # 左中方块 - 招募背景
    '招募背景': (85, 597, 482, 972),
    # 中央方块 - 细边框
    '细边框': (582, 640, 860, 924),
    # 右下方块 - 品质标签
    '品质标签': (948, 976, 1178, 1239),
    # 中央右侧竖条 - 麦穗
    '麦穗': (1007, 576, 1126, 941),
}

def cut_element(img, element_name, quality_name, quality_code, output_dir):
    """从合集中切割对应UI元素"""
    bbox = layouts.get(element_name)
    if not bbox:
        print(f"  警告: 未找到 {element_name} 的布局坐标")
        return None

    # 裁剪
    cropped = img.crop(bbox)

    # 缩放到目标尺寸
    target_w, target_h = ref_sizes[element_name]
    if cropped.size != (target_w, target_h):
        cropped = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 创建输出目录
    element_dir = os.path.join(output_dir, element_name)
    os.makedirs(element_dir, exist_ok=True)

    # 生成文件名（根据原UI文件夹命名规则）
    if element_name == '名牌':
        filename = f'名牌{quality_code}.png'
    elif element_name == '品质标签':
        filename = f'品质标签{quality_code}.png'
    elif element_name == '头像框-圆':
        filename = f'头像框{quality_code}-圆.png'
    elif element_name == '头像框-方':
        filename = f'头像框{quality_code}-方.png'
    elif element_name == '招募背景':
        filename = f'招募背景{quality_code}.png'
    elif element_name == '细边框':
        filename = f'细边框{quality_code}.png'
    elif element_name == '麦穗':
        filename = f'麦穗{quality_code}.png'
    else:
        filename = f'{element_name}_{quality_code}.png'

    # 保存
    output_path = os.path.join(element_dir, filename)
    cropped.save(output_path, 'PNG')
    return output_path

def main():
    input_dir = r'D:\篮球\新设计\新品质UI'
    output_dir = r'D:\篮球\新设计\新品质UI\切图'

    elements = ['名牌', '品质标签', '头像框-圆', '头像框-方', '招募背景', '细边框', '麦穗']

    print("=== 开始精确切图（连通域分析）===")
    print(f"输入目录: {input_dir}")
    print(f"输出目录: {output_dir}")
    print(f"坐标来源: 基于金.png的连通域自动分析")
    print()

    total_count = 0
    for quality_name, quality_code in quality_map.items():
        img_path = os.path.join(input_dir, f'{quality_name}.png')
        if not os.path.exists(img_path):
            print(f"跳过 {quality_name}: 文件不存在")
            continue

        print(f"处理: {quality_name} ({quality_code})")
        img = Image.open(img_path)

        for element in elements:
            result = cut_element(img, element, quality_name, quality_code, output_dir)
            if result:
                print(f"  ✓ {element}: {os.path.basename(result)}")
                total_count += 1

    print(f"\n=== 完成！共生成 {total_count} 张图片 ===")
    print(f"输出目录: {output_dir}")

if __name__ == '__main__':
    main()