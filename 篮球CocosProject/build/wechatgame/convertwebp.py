#author: zhulc
#coding: utf-8

import os
import sys
import time
import subprocess
from pathlib import Path
import tempfile
import logging
import concurrent.futures
from functools import partial
import shutil
import datetime

# 配置参数
CONFIG = {
    'quality': 100,          # WebP质量参数 (0-100)
    'compression': 6,       # 压缩方法 (0-6, 越高压缩越好)
    'min_saving': 1024,     # 最小节省空间阈值 (字节)
    'threads': min(32, max(4, os.cpu_count() * 2)),  # 线程数 (限制在4-32之间)
    'extensions': {'.png', '.jpg', '.jpeg', '.jfif'},  # 支持的图片扩展名
    'exclude_dirs': {'.git', '.svn', '__pycache__', 'node_modules'},  # 排除目录
    'cwebp_path': shutil.which('cwebp') or 'cwebp',  # 自动检测cwebp路径
    'alpha_quality': 100,    # 透明通道质量
    'metadata': 'all',      # 保留的元数据 (all/none/exif/icc/xmp)
    'encoding': 'utf-8',    # 强制使用UTF-8编码
    'log_cwebp_output': True,  # 是否记录cwebp输出
}

def setup_logging(log_dir=None):
    """设置日志记录到控制台和文件"""
    # 创建日志目录
    if log_dir is None:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    # 生成时间戳格式的日志文件名
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    log_filename = os.path.join(log_dir, f"webp_converter_{timestamp}.log")
    
    # 创建logger
    logger = logging.getLogger('cwebp_converter')
    logger.setLevel(logging.INFO)
    
    # 清除现有handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # 创建文件handler
    file_handler = logging.FileHandler(log_filename, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # 创建控制台handler - 只显示INFO及以上级别
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # 创建格式化器
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # 添加handlers到logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # 创建专用的cwebp日志记录器（只记录到文件）
    cwebp_logger = logging.getLogger('cwebp_output')
    cwebp_logger.setLevel(logging.DEBUG)
    cwebp_file_handler = logging.FileHandler(log_filename, encoding='utf-8')
    cwebp_file_handler.setLevel(logging.DEBUG)
    cwebp_file_handler.setFormatter(logging.Formatter('%(asctime)s - [cwebp] - %(message)s'))
    cwebp_logger.addHandler(cwebp_file_handler)
    cwebp_logger.propagate = False  # 防止传播到根logger
    
    logger.info(f"📝 日志文件已创建: {log_filename}")
    return logger, cwebp_logger, log_filename

def should_convert(file_path):
    """检查文件是否需要转换"""
    # 检查扩展名
    ext = Path(file_path).suffix.lower()
    return ext in CONFIG['extensions']

def convert_with_cwebp(file_path, cwebp_logger):
    """
    使用cwebp转换图片，仅当新文件更小时才替换
    返回转换状态和节省的空间（字节）
    """
    start_time = time.time()
    original_size = os.path.getsize(file_path)
    temp_path = None
    
    try:
        # 创建临时文件
        with tempfile.NamedTemporaryFile(
            dir=os.path.dirname(file_path),
            suffix='.webp',
            delete=False
        ) as temp_file:
            temp_path = temp_file.name
        
        # 构建cwebp命令
        cmd = [
            CONFIG['cwebp_path'],
            '-q', str(CONFIG['quality']),
            '-m', str(CONFIG['compression']),
            '-alpha_q', str(CONFIG['alpha_quality']),
            '-metadata', CONFIG['metadata'],
            file_path,
            '-o', temp_path,
        ]
        
        # 执行转换并捕获输出
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        
        # 记录cwebp输出到日志文件
        if CONFIG['log_cwebp_output']:
            # 解码输出
            stdout = result.stdout.decode(CONFIG['encoding'], errors='ignore').strip()
            stderr = result.stderr.decode(CONFIG['encoding'], errors='ignore').strip()
            
            # 记录到cwebp专用logger
            if stdout:
                cwebp_logger.info(f"[{Path(file_path).name}] stdout: {stdout}")
            if stderr:
                cwebp_logger.info(f"[{Path(file_path).name}] stderr: {stderr}")
        
        # 获取转换后文件大小
        new_size = os.path.getsize(temp_path)
        size_difference = original_size - new_size
        process_time = time.time() - start_time
        
        # 仅当新文件更小且节省超过阈值时才替换
        if new_size < original_size and size_difference > CONFIG['min_saving']:
            # 保留原始文件权限
            original_stat = os.stat(file_path)
            
            # 替换原始文件
            os.replace(temp_path, file_path)
            os.chmod(file_path, original_stat.st_mode)
            
            return {
                'status': 'success',
                'file': file_path,
                'original_size': original_size,
                'new_size': new_size,
                'saved': size_difference,
                'time': process_time
            }
        else:
            # 删除临时文件（未使用）
            os.remove(temp_path)
            
            reason = "文件变大" if new_size >= original_size else f"节省空间不足 ({format_size(size_difference)})"
            return {
                'status': 'skipped',
                'file': file_path,
                'reason': reason,
                'original_size': original_size,
                'new_size': new_size,
                'time': process_time
            }
            
    except subprocess.CalledProcessError as e:
        # 清理临时文件
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        
        # 记录错误输出
        if CONFIG['log_cwebp_output']:
            error_output = e.stderr.decode(CONFIG['encoding'], errors='ignore') if e.stderr else ""
            cwebp_logger.error(f"[{Path(file_path).name}] cwebp错误: {error_output.strip()}")
        
        return {
            'status': 'error',
            'file': file_path,
            'error': f"cwebp转换失败 (代码: {e.returncode})",
            'time': time.time() - start_time
        }
    except Exception as e:
        # 清理临时文件
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        
        return {
            'status': 'error',
            'file': file_path,
            'error': str(e),
            'time': time.time() - start_time
        }

def format_size(size_bytes):
    """将字节数转换为易读的格式"""
    if size_bytes < 0:
        return f"-{format_size(-size_bytes)}"
    
    if size_bytes < 1024:
        return f"{size_bytes}B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f}KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f}MB"

def process_file(file_path, stats, cwebp_logger):
    """处理单个文件并更新统计信息"""
    result = convert_with_cwebp(file_path, cwebp_logger)
    
    if result['status'] == 'success':
        stats['converted'] += 1
        stats['total_saved'] += result['saved']
        logger.info(f"✅ {Path(result['file']).name}: "
                    f"{format_size(result['original_size'])} → {format_size(result['new_size'])} "
                    f"(节省: {format_size(result['saved'])} | {result['time']:.2f}s)")
    elif result['status'] == 'skipped':
        stats['skipped'] += 1
        logger.info(f"⏩ {Path(result['file']).name}: {result['reason']} "
                    f"({format_size(result['original_size'])} → {format_size(result['new_size'])} | {result['time']:.2f}s)")
    else:
        stats['errors'] += 1
        logger.error(f"❌ {Path(result['file']).name}: {result['error']} | {result['time']:.2f}s")
    
    stats['processed'] += 1
    return stats

def convert_images(root_dir='.', cwebp_logger=None):
    """使用多线程转换目录中的所有图片"""
    # 初始化统计数据
    stats = {
        'total_files': 0,
        'processed': 0,
        'converted': 0,
        'skipped': 0,
        'errors': 0,
        'total_saved': 0,
        'start_time': time.time()
    }
    
    # 检查cwebp是否可用
    if not shutil.which(CONFIG['cwebp_path']):
        logger.error(f"❌ 错误: 找不到 cwebp 工具。请确保已安装并添加到PATH环境变量")
        logger.info("下载地址: https://developers.google.com/speed/webp/download")
        return stats
    
    # 收集所有需要处理的文件
    file_list = []
    for root, dirs, files in os.walk(root_dir):
        # 排除不需要的目录
        dirs[:] = [d for d in dirs if d not in CONFIG['exclude_dirs']]
        
        for file in files:
            file_path = os.path.join(root, file)
            if should_convert(file_path):
                file_list.append(file_path)
                stats['total_files'] += 1
    
    logger.info(f"📂 找到 {stats['total_files']} 个待处理文件")
    logger.info(f"🚀 使用 {CONFIG['threads']} 个线程和 cwebp 开始处理...")
    logger.info(f"⚙️ cwebp路径: {CONFIG['cwebp_path']}")
    
    # 使用线程池处理文件
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONFIG['threads']) as executor:
        # 使用偏函数固定stats和cwebp_logger参数
        process_func = partial(process_file, stats=stats, cwebp_logger=cwebp_logger)
        
        # 提交所有任务
        futures = {executor.submit(process_func, file_path): file_path for file_path in file_list}
        
        # 等待所有任务完成
        for future in concurrent.futures.as_completed(futures):
            try:
                # 获取结果（我们已经在process_func中更新了stats）
                future.result()
            except Exception as e:
                logger.error(f"线程异常: {str(e)}")
    
    # 计算总时间
    total_time = time.time() - stats['start_time']
    
    # 打印汇总报告
    logger.info("\n")
    logger.info("=" * 60)
    logger.info("📊 转换完成! 汇总统计:")
    logger.info(f"• 总文件数: {stats['total_files']}")
    logger.info(f"• 已处理: {stats['processed']}")
    logger.info(f"• 成功转换: {stats['converted']}")
    logger.info(f"• 跳过: {stats['skipped']}")
    logger.info(f"• 错误: {stats['errors']}")
    logger.info(f"• 总共节省空间: {format_size(stats['total_saved'])}")
    logger.info(f"• 总耗时: {total_time:.2f} 秒")
    logger.info(f"• 平均速度: {stats['processed']/total_time if total_time > 0 else 0:.2f} 文件/秒")
    logger.info("=" * 60)
    
    return stats

def print_cwebp_version(cwebp_logger):
    """检查并打印cwebp版本到日志文件"""
    try:
        result = subprocess.run(
            [CONFIG['cwebp_path'], '-version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        version = result.stdout.decode(CONFIG['encoding'], errors='ignore').strip()
        logger.info(f"ℹ️ 检测到 cwebp 版本: {version}")
        # 同时记录到cwebp日志
        cwebp_logger.info(f"cwebp版本: {version}")
        return True
    except Exception as e:
        logger.error(f"❌ 无法获取cwebp版本: {str(e)}")
        return False

if __name__ == '__main__':
    # 设置系统编码为UTF-8，避免中文路径问题
    if sys.platform == 'win32':
        os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # 获取当前脚本所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__)) or os.getcwd()
    
    # 设置日志记录
    logger, cwebp_logger, log_filename = setup_logging()
    
    logger.info("=" * 60)
    logger.info(f"🚀 cwebp图片转换器启动 - 工作目录: {current_dir}")
    logger.info(f"⚙️ 配置: 线程数={CONFIG['threads']}, 质量={CONFIG['quality']}, 最小节省={format_size(CONFIG['min_saving'])}")
    
    # 检查cwebp版本并记录到日志文件
    print_cwebp_version(cwebp_logger)
    
    logger.info("=" * 60)
    
    # 执行转换
    stats = convert_images(current_dir, cwebp_logger)
    
    # 记录最终日志文件路径
    logger.info(f"📄 转换日志已保存到: {log_filename}")
    print(f"\n转换完成! 详细日志请查看: {log_filename}")
    input("")
