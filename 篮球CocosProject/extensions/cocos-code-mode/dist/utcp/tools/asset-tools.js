"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTools = void 0;
const package_json_1 = __importDefault(require("../../../package.json"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const decorators_1 = require("../decorators");
const schemas_1 = require("../schemas");
const path_1 = __importStar(require("path"));
const os_1 = __importDefault(require("os"));
function normalizePath(p) {
    if (!p)
        return 'db://assets';
    let path = p.replace(/\\/g, '/').trim();
    // Handle db:// protocol
    if (path.startsWith('db://')) {
        return path.endsWith('/') && path !== 'db://' ? path.slice(0, -1) : path;
    }
    // Remove leading slash
    if (path.startsWith('/')) {
        path = path.slice(1);
    }
    // Handle root aliases
    if (path === '' || path === 'assets') {
        return 'db://assets';
    }
    // Handle 'assets/' prefix
    if (path.startsWith('assets/')) {
        const result = 'db://' + path;
        return result.endsWith('/') ? result.slice(0, -1) : result;
    }
    // Treat as relative path under assets
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return `db://assets/${path}`;
}
class AssetTools {
    async assetGetTree(args) {
        if (args.reference) {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', args.reference.id);
            if (!info) {
                throw new Error(`Asset with UUID ${args.reference.id} not found.`);
            }
            args.assetPath = info.url;
        }
        let rootPath = normalizePath(args.assetPath);
        const pattern = `${rootPath}/**`;
        const assets = await Editor.Message.request('asset-db', 'query-assets', { pattern });
        const rootUuid = await Editor.Message.request('asset-db', 'query-uuid', rootPath);
        const assetsMap = new Map();
        // Create Root Node first
        const rootName = rootPath.split('/').pop() || 'assets';
        const rootNode = {
            filesystemPath: Editor.Project.path + '/' + rootPath.replace('db://', ''),
            reference: { id: rootUuid || 'root', type: 'folder' },
            name: rootName,
            children: []
        };
        assetsMap.set(rootPath, rootNode);
        // First pass: Map assets
        assets.forEach((asset) => {
            if (asset.url === rootPath)
                return; // Skip root, already created
            const type = asset.isDirectory ? 'folder' : asset.type;
            const treeItem = {
                reference: { id: asset.uuid, type: type },
                name: asset.name,
                children: []
            };
            assetsMap.set(asset.url, treeItem);
        });
        // Second pass: Build hierarchy
        assets.forEach((asset) => {
            if (asset.url === rootPath)
                return;
            const treeItem = assetsMap.get(asset.url);
            if (!treeItem)
                return;
            const parentUrl = asset.url.substring(0, asset.url.lastIndexOf('/'));
            const parentItem = assetsMap.get(parentUrl);
            if (parentItem) {
                parentItem.children.push(treeItem);
            }
        });
        return rootNode;
    }
    async assetGetAtPath(args) {
        let targetPath = normalizePath(args.assetPath);
        console.log(`Looking for asset at path: ${targetPath}`);
        const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', targetPath);
        if (!assetInfo) {
            throw new Error(`Asset not found at path: ${targetPath}`);
        }
        else {
            return { reference: { id: assetInfo.uuid, type: assetInfo.type } };
        }
    }
    async assetCreate(args) {
        var _a, _b, _c, _d;
        let targetPath = normalizePath(args.assetPath);
        // Map 'preset' from schema to 'type' expected by function
        const type = args.preset;
        const presetMap = {
            'material': 'db://internal/default_file_content/material/default.mtl',
            'effect': 'db://internal/default_file_content/effect/default.effect',
            'scene': 'db://internal/default_file_content/scene/default.scene',
            'prefab': 'db://internal/default_file_content/prefab/default.prefab',
            'animation-clip': 'db://internal/default_file_content/animation-clip/default.anim',
            'render-texture': 'db://internal/default_file_content/render-texture/default.rt',
            'physics-material': 'db://internal/default_file_content/physics-material/default.pmtl',
            'animation-graph': 'db://internal/default_file_content/animation-graph/default.animgraph',
            'animation-graph-variant': 'db://internal/default_file_content/animation-graph-variant/default.animgraphvari',
            'animation-mask': 'db://internal/default_file_content/animation-mask/default.animask',
            'auto-atlas': 'db://internal/default_file_content/auto-atlas/default.pac',
            'effect-header': 'db://internal/default_file_content/effect-header/chunk',
            'label-atlas': 'db://internal/default_file_content/label-atlas/default.labelatlas',
            'terrain': 'db://internal/default_file_content/terrain/default.terrain'
        };
        const assetOptions = {
            overwrite: (_b = (_a = args.options) === null || _a === void 0 ? void 0 : _a.overwrite) !== null && _b !== void 0 ? _b : false,
            rename: (_d = (_c = args.options) === null || _c === void 0 ? void 0 : _c.rename) !== null && _d !== void 0 ? _d : false
        };
        if (type === 'folder' || type === 'typescript') {
            let content = null;
            if (type === 'typescript') {
                const currentExtName = (0, path_1.extname)(targetPath);
                if (currentExtName !== '.ts') {
                    targetPath = currentExtName ? targetPath.slice(0, -currentExtName.length) : targetPath;
                    targetPath += '.ts';
                }
                const className = (0, path_1.basename)(targetPath.slice('db://'.length), '.ts');
                content = this.generateTypescriptClassTemplate(className);
            }
            const result = await Editor.Message.request('asset-db', 'create-asset', targetPath, content, assetOptions);
            if (!result) {
                throw new Error(`Failed to create folder at ${targetPath}`);
            }
            else {
                return { reference: { id: result.uuid, type: type } };
            }
        }
        const source = presetMap[type];
        if (!source) {
            throw new Error(`Unknown asset preset type: ${type}`);
        }
        if ((0, path_1.extname)(targetPath) === '' && type !== 'folder') {
            targetPath += type == 'chunk' ? '.chunk' : (0, path_1.extname)(presetMap[type]);
        }
        const assetInfo = await Editor.Message.request('asset-db', 'copy-asset', source, targetPath, assetOptions);
        if (!assetInfo) {
            throw new Error(`Failed to create asset at ${targetPath}`);
        }
        else {
            return { reference: { id: assetInfo.uuid, type: assetInfo.type } };
        }
    }
    async assetImport(args) {
        var _a, _b, _c, _d;
        let targetPath = normalizePath(args.targetAssetPath);
        const assetOptions = {
            overwrite: (_b = (_a = args.options) === null || _a === void 0 ? void 0 : _a.overwrite) !== null && _b !== void 0 ? _b : false,
            rename: (_d = (_c = args.options) === null || _c === void 0 ? void 0 : _c.rename) !== null && _d !== void 0 ? _d : false
        };
        // Additional resolving for absolute path
        if (args.sourceFilesystemPath.startsWith('~')) {
            args.sourceFilesystemPath = path_1.default.join(os_1.default.homedir(), args.sourceFilesystemPath.slice(1));
        }
        args.sourceFilesystemPath = path_1.default.resolve(args.sourceFilesystemPath);
        args.sourceFilesystemPath = await fs_extra_1.default.realpath(args.sourceFilesystemPath);
        // Checking for existing asset at target path
        let existingAssetInfo = null;
        // If caller tries to import the same file in assets - just reimport
        if (`${Editor.Project.path}${targetPath.slice('db:/'.length)}` === args.sourceFilesystemPath) {
            await Editor.Message.request('asset-db', 'refresh-asset', targetPath);
            existingAssetInfo = await Editor.Message.request('asset-db', 'query-asset-info', targetPath);
        }
        const assetInfo = existingAssetInfo ? existingAssetInfo :
            await Editor.Message.request('asset-db', 'import-asset', args.sourceFilesystemPath, targetPath, assetOptions);
        if (!assetInfo) {
            throw new Error(`Failed to import asset to ${targetPath}`);
        }
        else {
            if (assetInfo.extends && assetInfo.importer === 'image' && args.imageType) {
                // Handle image type override
                const meta = await Editor.Message.request('asset-db', 'query-asset-meta', assetInfo.uuid);
                if (meta && meta.userData) {
                    let typeToSet = args.imageType;
                    if (typeToSet === 'normal-map') {
                        typeToSet = 'normal map';
                    }
                    if (typeToSet === 'texture-cube') {
                        typeToSet = 'texture cube';
                    }
                    meta.userData.type = typeToSet;
                    await Editor.Message.request('asset-db', 'save-asset-meta', assetInfo.uuid, JSON.stringify(meta));
                }
            }
            return { reference: { id: assetInfo.uuid, type: assetInfo.type } };
        }
    }
    async assetOperate(args) {
        var _a, _b, _c, _d, _e, _f;
        const assetOptions = {
            overwrite: (_b = (_a = args.options) === null || _a === void 0 ? void 0 : _a.overwrite) !== null && _b !== void 0 ? _b : false,
            rename: (_d = (_c = args.options) === null || _c === void 0 ? void 0 : _c.rename) !== null && _d !== void 0 ? _d : false
        };
        args.targetAssetPath = normalizePath(args.targetAssetPath);
        let result = null;
        switch (args.operation) {
            case 'move':
                if (!args.targetAssetPath) {
                    throw new Error('Target is required for move');
                }
                result = await Editor.Message.request('asset-db', 'move-asset', args.reference.id, args.targetAssetPath, assetOptions);
                break;
            case 'copy':
                if (!args.targetAssetPath) {
                    throw new Error('Target is required for copy');
                }
                result = await Editor.Message.request('asset-db', 'copy-asset', args.reference.id, args.targetAssetPath, assetOptions);
                break;
            case 'delete':
                result = await Editor.Message.request('asset-db', 'delete-asset', args.reference.id);
                break;
            case 'open':
                await Editor.Message.request('asset-db', 'open-asset', args.reference.id);
                result = null;
                break;
            case 'refresh':
                await Editor.Message.request('asset-db', 'refresh-asset', args.reference.id);
                result = null;
                break;
            case 'reimport':
                await Editor.Message.request('asset-db', 'reimport-asset', args.reference.id);
                result = null;
                break;
            default:
                throw new Error(`Unknown operation: ${args.operation}`);
        }
        return { reference: { id: (_e = result === null || result === void 0 ? void 0 : result.uuid) !== null && _e !== void 0 ? _e : '', type: (_f = result === null || result === void 0 ? void 0 : result.type) !== null && _f !== void 0 ? _f : '' } };
    }
    async assetGetPreview(args) {
        const info = await Editor.Message.request('asset-db', 'query-asset-info', args.reference.id);
        if (!info) {
            throw new Error(`Asset ${args.reference.id} not found.`);
        }
        if (!info.importer) {
            throw new Error(`Asset ${args.reference.id} has no importer and cannot be previewed.`);
        }
        args.imageSize = args.imageSize || 512;
        args.jpegQuality = args.jpegQuality || 80;
        args.transparentColor = args.transparentColor || { r: 0, g: 0, b: 0 };
        let importer = info.importer;
        const supportedImporters = [
            'erp-texture-cube',
            'image',
            'sprite-frame',
            'texture',
            'fbx',
            'gltf',
            'gltf-mesh',
            'prefab',
            'material',
            'spine',
            'gltf-skeleton',
            'scene'
        ];
        if (!supportedImporters.includes(importer)) {
            throw new Error(`Asset preview not supported for asset type: ${info.type}`);
        }
        if (importer === 'fbx' || importer === 'gltf') {
            const mesh = Object.values(info.subAssets).find((sub) => sub.importer === 'gltf-mesh');
            if (!mesh) {
                throw new Error(`Asset ${args.reference.id} has no gltf-mesh sub-asset for preview.`);
            }
            args.reference.id = mesh.uuid;
            importer = 'gltf-mesh';
        }
        let sourcePath = null;
        if (importer === 'gltf-mesh' || importer === 'mesh') {
            sourcePath = (await Editor.Message.request('asset-db', 'query-asset-thumbnail', args.reference.id, "origin")).value;
        }
        else if (['erp-texture-cube', 'image', 'sprite-frame', 'texture'].includes(importer)) {
            let fileUuid = args.reference.id;
            if (args.reference.id.includes('@')) {
                fileUuid = args.reference.id.split('@')[0];
            }
            const fileInfo = await Editor.Message.request('asset-db', 'query-asset-info', fileUuid);
            if (fileInfo && fileInfo.file) {
                sourcePath = fileInfo.file;
            }
        }
        if (sourcePath && fs_extra_1.default.existsSync(sourcePath)) {
            try {
                const sharp = (await Promise.resolve().then(() => __importStar(require('sharp')))).default;
                const image = sharp(sourcePath);
                const metadata = await image.metadata();
                const requestedSize = args.imageSize || 512;
                let processed = image;
                if ((metadata.width && metadata.width > requestedSize) ||
                    (metadata.height && metadata.height > requestedSize)) {
                    processed = processed.resize(requestedSize, requestedSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
                }
                let buffer;
                if ((metadata.format === 'png' || metadata.hasAlpha)) {
                    buffer = await processed.flatten({ background: args.transparentColor })
                        .jpeg({ quality: args.jpegQuality || 80 })
                        .toBuffer();
                }
                else {
                    buffer = await processed
                        .jpeg({ quality: args.jpegQuality || 80 })
                        .toBuffer();
                }
                return { type: "image", data: buffer.toString('base64'), mimeType: "image/jpeg" };
            }
            catch (e) {
                console.error(`Failed to process image from ${sourcePath} with sharp:`, e);
            }
        }
        // Open panel to ensure renderer process is alive
        await Editor.Panel.openBeside('scene', `${package_json_1.default.name}.preview`);
        let base64Image;
        try {
            // Request generation
            base64Image = await Editor.Message.request(package_json_1.default.name, 'generate-preview', args.reference.id, args.imageSize || 512, args.imageSize || 512, (args.jpegQuality || 80) / 100);
        }
        finally {
            // Close panel
            await Editor.Panel.close(`${package_json_1.default.name}.preview`);
        }
        if (!base64Image) {
            throw new Error(`Failed to generate preview for asset ${args.reference.id}.`);
        }
        return { type: "image", data: base64Image, mimeType: "image/jpeg" };
    }
    generateTypescriptClassTemplate(className) {
        return `import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('${className}')
export class ${className} extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }
}`;
    }
}
exports.AssetTools = AssetTools;
__decorate([
    (0, decorators_1.utcpTool)('assetGetTree', 'Get the asset and subAsset hierarchy tree. Children have recursive structure.', {
        type: 'object',
        properties: {
            reference: schemas_1.InstanceReferenceSchema,
            assetPath: { type: 'string', description: 'Root path to start from' }
        }
    }, schemas_1.AssetTreeItemSchema, "GET", ['asset', 'file', 'tree', 'hierarchy', 'folder', 'subasset'])
], AssetTools.prototype, "assetGetTree", null);
__decorate([
    (0, decorators_1.utcpTool)('assetGetAtPath', 'Get asset reference by given local path and name, including extension. Can be used for subassets too. Returns reference to the asset.', {
        type: 'object',
        properties: {
            assetPath: { type: 'string' }
        },
        required: ['assetPath']
    }, { type: 'object', properties: { reference: schemas_1.InstanceReferenceSchema }, required: ['reference'] }, "GET", ['asset', 'get', 'path', 'look', 'find'])
], AssetTools.prototype, "assetGetAtPath", null);
__decorate([
    (0, decorators_1.utcpTool)('assetCreate', 'Create empty asset or folder of given type. Automatically handles folders creation along the path. Returns reference to the new asset.', {
        type: 'object',
        properties: {
            assetPath: { type: 'string' },
            preset: {
                type: 'string',
                enum: [
                    'folder',
                    'material',
                    'effect',
                    'scene',
                    'prefab',
                    'typescript',
                    'animation-clip',
                    'render-texture',
                    'physics-material',
                    'animation-graph',
                    'animation-graph-variant',
                    'animation-mask',
                    'auto-atlas',
                    'effect-header',
                    'label-atlas',
                    'terrain'
                ],
                description: 'Preset type for the new asset'
            },
            options: { type: 'object', properties: { overwrite: { type: 'boolean' }, rename: { type: 'boolean' } }, description: 'Additional options for the operation', nullable: true },
        },
        required: ['assetPath', 'preset']
    }, { type: 'object', properties: { reference: schemas_1.InstanceReferenceSchema }, required: ['reference'] }, "POST", ['asset', 'create', 'new', 'preset', 'folder', 'typescript'])
], AssetTools.prototype, "assetCreate", null);
__decorate([
    (0, decorators_1.utcpTool)('assetImport', 'Import an external file as an asset into the project. Path must end with the extension. Returns reference to the new asset.', {
        type: 'object',
        properties: {
            sourceFilesystemPath: { type: 'string', description: 'Source filesystem path of the file to import' },
            targetAssetPath: { type: 'string', description: 'Target path in the asset database' },
            imageType: { type: 'string', enum: ['raw', 'texture', 'normal-map', 'sprite-frame', 'texture-cube'], description: 'For image files, specify how to import them' },
            options: { type: 'object', properties: { overwrite: { type: 'boolean' }, rename: { type: 'boolean' } }, description: 'Additional options for the operation' },
        },
        required: ['sourceFilesystemPath', 'targetAssetPath']
    }, { type: 'object', properties: { reference: schemas_1.InstanceReferenceSchema }, required: ['reference'] }, "POST", ['asset', 'import', 'file', 'external', 'image'])
], AssetTools.prototype, "assetImport", null);
__decorate([
    (0, decorators_1.utcpTool)('assetOperate', 'Perform operations on assets (move, copy, delete, open). Returns reference to the affected asset (for delete/open returns the source asset reference).', {
        type: 'object',
        properties: {
            operation: { type: 'string', enum: ['move', 'copy', 'delete', 'open', 'refresh', 'reimport'] },
            reference: schemas_1.InstanceReferenceSchema,
            targetAssetPath: { type: 'string', description: 'Target path (for move/copy/import)' },
            options: { type: 'object', properties: { overwrite: { type: 'boolean' }, rename: { type: 'boolean' } }, description: 'Additional options for the operation', nullable: true },
        },
        required: ['operation', 'reference']
    }, { type: 'object', properties: { reference: schemas_1.InstanceReferenceSchema }, required: ['reference'] }, "POST", ['asset', 'operate', 'move', 'copy', 'delete', 'open', 'refresh', 'reimport'])
], AssetTools.prototype, "assetOperate", null);
__decorate([
    (0, decorators_1.utcpTool)('assetGetPreview', 'Returns preview image of the asset (Prefab, Image, Model or Material is supported). IMPORTANT: To visualize the image, you must return the result of this function DIRECTLY as the final value of your code, do NOT wrap it in an object.', {
        type: 'object',
        properties: {
            reference: schemas_1.InstanceReferenceSchema,
            imageSize: { type: 'number', description: 'Size of the preview image (square)', default: 512 },
            jpegQuality: { type: 'integer', description: 'JPEG Quality of the preview image', minimum: 40, maximum: 100, default: 80 },
            transparentColor: { type: 'object', properties: { r: { type: 'integer', minimum: 0, maximum: 255 }, g: { type: 'integer', minimum: 0, maximum: 255 }, b: { type: 'integer', minimum: 0, maximum: 255 } }, required: ['r', 'g', 'b'], description: 'Background color for transparent images in RGB format' }
        },
        required: ['reference']
    }, schemas_1.Base64ImageSchema, "GET", ['asset', 'preview', 'screenshot'])
], AssetTools.prototype, "assetGetPreview", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvdXRjcC90b29scy9hc3NldC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5RUFBZ0Q7QUFDaEQsd0RBQTBCO0FBQzFCLDhDQUF5QztBQUV6Qyx3Q0FBMEw7QUFDMUwsNkNBQStDO0FBQy9DLDRDQUFvQjtBQUVwQixTQUFTLGFBQWEsQ0FBQyxDQUFVO0lBQzdCLElBQUksQ0FBQyxDQUFDO1FBQUUsT0FBTyxhQUFhLENBQUM7SUFDN0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFeEMsd0JBQXdCO0lBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQzNCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDN0UsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN2QixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLElBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDbkMsT0FBTyxhQUFhLENBQUM7SUFDekIsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFD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TyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7WUFDMUgsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxXQUFXLEVBQUUsdURBQXVELEVBQUU7U0FDOVM7UUFDRCxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUM7S0FDMUIsRUFDRCwyQkFBaUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUMvRDtpREEwR0EiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGFja2FnZUpTT04gZnJvbSAnLi4vLi4vLi4vcGFja2FnZS5qc29uJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyB1dGNwVG9vbCB9IGZyb20gJy4uL2RlY29yYXRvcnMnO1xyXG5pbXBvcnQgeyBBc3NldEluZm8sIEFzc2V0T3BlcmF0aW9uT3B0aW9uIH0gZnJvbSAnQGNvY29zL2NyZWF0b3ItdHlwZXMvZWRpdG9yL3BhY2thZ2VzL2Fzc2V0LWRiL0B0eXBlcy9wdWJsaWMnO1xyXG5pbXBvcnQgeyBBc3NldFRyZWVJdGVtU2NoZW1hLCBJQXNzZXRUcmVlSXRlbSwgQmFzZTY0SW1hZ2VTY2hlbWEsIElCYXNlNjRJbWFnZSwgU3VjY2Vzc0luZGljYXRvclNjaGVtYSwgSVN1Y2Nlc3NJbmRpY2F0b3IsIEluc3RhbmNlUmVmZXJlbmNlU2NoZW1hLCBJSW5zdGFuY2VSZWZlcmVuY2UgfSBmcm9tICcuLi9zY2hlbWFzJztcclxuaW1wb3J0IHBhdGgsIHsgYmFzZW5hbWUsIGV4dG5hbWUgfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IG9zIGZyb20gJ29zJztcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocD86IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBpZiAoIXApIHJldHVybiAnZGI6Ly9hc3NldHMnO1xyXG4gICAgbGV0IHBhdGggPSBwLnJlcGxhY2UoL1xcXFwvZywgJy8nKS50cmltKCk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGRiOi8vIHByb3RvY29sXHJcbiAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkYjovLycpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGguZW5kc1dpdGgoJy8nKSAmJiBwYXRoICE9PSAnZGI6Ly8nID8gcGF0aC5zbGljZSgwLCAtMSkgOiBwYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSBsZWFkaW5nIHNsYXNoXHJcbiAgICBpZiAocGF0aC5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBwYXRoID0gcGF0aC5zbGljZSgxKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGUgcm9vdCBhbGlhc2VzXHJcbiAgICBpZiAocGF0aCA9PT0gJycgfHwgcGF0aCA9PT0gJ2Fzc2V0cycpIHtcclxuICAgICAgICByZXR1cm4gJ2RiOi8vYXNzZXRzJztcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGUgJ2Fzc2V0cy8nIHByZWZpeFxyXG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnYXNzZXRzLycpKSB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gJ2RiOi8vJyArIHBhdGg7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5lbmRzV2l0aCgnLycpID8gcmVzdWx0LnNsaWNlKDAsIC0xKSA6IHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUcmVhdCBhcyByZWxhdGl2ZSBwYXRoIHVuZGVyIGFzc2V0c1xyXG4gICAgaWYgKHBhdGguZW5kc1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHBhdGggPSBwYXRoLnNsaWNlKDAsIC0xKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYGRiOi8vYXNzZXRzLyR7cGF0aH1gO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXNzZXRUb29scyB7XHJcblxyXG4gICAgQHV0Y3BUb29sKFxyXG4gICAgICAgICdhc3NldEdldFRyZWUnLFxyXG4gICAgICAgICdHZXQgdGhlIGFzc2V0IGFuZCBzdWJBc3NldCBoaWVyYXJjaHkgdHJlZS4gQ2hpbGRyZW4gaGF2ZSByZWN1cnNpdmUgc3RydWN0dXJlLicsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlOiBJbnN0YW5jZVJlZmVyZW5jZVNjaGVtYSxcclxuICAgICAgICAgICAgICAgIGFzc2V0UGF0aDogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdSb290IHBhdGggdG8gc3RhcnQgZnJvbScgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBBc3NldFRyZWVJdGVtU2NoZW1hLCBcIkdFVFwiLCBbJ2Fzc2V0JywgJ2ZpbGUnLCAndHJlZScsICdoaWVyYXJjaHknLCAnZm9sZGVyJywgJ3N1YmFzc2V0J11cclxuICAgIClcclxuICAgIGFzeW5jIGFzc2V0R2V0VHJlZShhcmdzOiB7IHJlZmVyZW5jZT86IElJbnN0YW5jZVJlZmVyZW5jZSwgYXNzZXRQYXRoPzogc3RyaW5nIH0pOiBQcm9taXNlPElBc3NldFRyZWVJdGVtPiB7XHJcbiAgICAgICAgaWYgKGFyZ3MucmVmZXJlbmNlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgYXJncy5yZWZlcmVuY2UuaWQpO1xyXG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgd2l0aCBVVUlEICR7YXJncy5yZWZlcmVuY2UuaWR9IG5vdCBmb3VuZC5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhcmdzLmFzc2V0UGF0aCA9IGluZm8udXJsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvb3RQYXRoID0gbm9ybWFsaXplUGF0aChhcmdzLmFzc2V0UGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSBgJHtyb290UGF0aH0vKipgO1xyXG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycsIHsgcGF0dGVybiB9KTtcclxuICAgICAgICBjb25zdCByb290VXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCByb290UGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFzc2V0c01hcCA9IG5ldyBNYXA8c3RyaW5nLCBJQXNzZXRUcmVlSXRlbT4oKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIFJvb3QgTm9kZSBmaXJzdFxyXG4gICAgICAgIGNvbnN0IHJvb3ROYW1lID0gcm9vdFBhdGguc3BsaXQoJy8nKS5wb3AoKSB8fCAnYXNzZXRzJztcclxuICAgICAgICBjb25zdCByb290Tm9kZTogSUFzc2V0VHJlZUl0ZW0gPSB7XHJcbiAgICAgICAgICAgIGZpbGVzeXN0ZW1QYXRoOiBFZGl0b3IuUHJvamVjdC5wYXRoICsgJy8nICsgcm9vdFBhdGgucmVwbGFjZSgnZGI6Ly8nLCAnJyksXHJcbiAgICAgICAgICAgIHJlZmVyZW5jZTogeyBpZDogcm9vdFV1aWQgfHwgJ3Jvb3QnLCB0eXBlOiAnZm9sZGVyJyB9LFxyXG4gICAgICAgICAgICBuYW1lOiByb290TmFtZSxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFtdXHJcbiAgICAgICAgfTtcclxuICAgICAgICBhc3NldHNNYXAuc2V0KHJvb3RQYXRoLCByb290Tm9kZSk7XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IHBhc3M6IE1hcCBhc3NldHNcclxuICAgICAgICBhc3NldHMuZm9yRWFjaCgoYXNzZXQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYXNzZXQudXJsID09PSByb290UGF0aCkgcmV0dXJuOyAvLyBTa2lwIHJvb3QsIGFscmVhZHkgY3JlYXRlZFxyXG5cclxuICAgICAgICAgICAgY29uc3QgdHlwZSA9IGFzc2V0LmlzRGlyZWN0b3J5ID8gJ2ZvbGRlcicgOiBhc3NldC50eXBlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdHJlZUl0ZW06IElBc3NldFRyZWVJdGVtID0ge1xyXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlOiB7IGlkOiBhc3NldC51dWlkLCB0eXBlOiB0eXBlIH0sXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBhc3NldHNNYXAuc2V0KGFzc2V0LnVybCwgdHJlZUl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTZWNvbmQgcGFzczogQnVpbGQgaGllcmFyY2h5XHJcbiAgICAgICAgYXNzZXRzLmZvckVhY2goKGFzc2V0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgaWYgKGFzc2V0LnVybCA9PT0gcm9vdFBhdGgpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHRyZWVJdGVtID0gYXNzZXRzTWFwLmdldChhc3NldC51cmwpO1xyXG4gICAgICAgICAgICBpZiAoIXRyZWVJdGVtKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnRVcmwgPSBhc3NldC51cmwuc3Vic3RyaW5nKDAsIGFzc2V0LnVybC5sYXN0SW5kZXhPZignLycpKTtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50SXRlbSA9IGFzc2V0c01hcC5nZXQocGFyZW50VXJsKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnRJdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRJdGVtLmNoaWxkcmVuLnB1c2godHJlZUl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByb290Tm9kZTtcclxuICAgIH1cclxuXHJcbiAgICBAdXRjcFRvb2woXHJcbiAgICAgICAgJ2Fzc2V0R2V0QXRQYXRoJyxcclxuICAgICAgICAnR2V0IGFzc2V0IHJlZmVyZW5jZSBieSBnaXZlbiBsb2NhbCBwYXRoIGFuZCBuYW1lLCBpbmNsdWRpbmcgZXh0ZW5zaW9uLiBDYW4gYmUgdXNlZCBmb3Igc3ViYXNzZXRzIHRvby4gUmV0dXJucyByZWZlcmVuY2UgdG8gdGhlIGFzc2V0LicsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgYXNzZXRQYXRoOiB7IHR5cGU6ICdzdHJpbmcnIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsnYXNzZXRQYXRoJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgIHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHsgcmVmZXJlbmNlOiBJbnN0YW5jZVJlZmVyZW5jZVNjaGVtYSB9LCByZXF1aXJlZDogWydyZWZlcmVuY2UnXSB9LCBcIkdFVFwiLCBbJ2Fzc2V0JywgJ2dldCcsICdwYXRoJywgJ2xvb2snLCAnZmluZCddXHJcbiAgICApXHJcbiAgICBhc3luYyBhc3NldEdldEF0UGF0aChhcmdzOiB7IGFzc2V0UGF0aDogc3RyaW5nIH0pOiBQcm9taXNlPHsgcmVmZXJlbmNlOiBJSW5zdGFuY2VSZWZlcmVuY2UgfT4ge1xyXG4gICAgICAgIGxldCB0YXJnZXRQYXRoID0gbm9ybWFsaXplUGF0aChhcmdzLmFzc2V0UGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBMb29raW5nIGZvciBhc3NldCBhdCBwYXRoOiAke3RhcmdldFBhdGh9YCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFzc2V0IG5vdCBmb3VuZCBhdCBwYXRoOiAke3RhcmdldFBhdGh9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgcmVmZXJlbmNlOiB7IGlkOiBhc3NldEluZm8udXVpZCwgdHlwZTogYXNzZXRJbmZvLnR5cGUgfSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAdXRjcFRvb2woXHJcbiAgICAgICAgJ2Fzc2V0Q3JlYXRlJyxcclxuICAgICAgICAnQ3JlYXRlIGVtcHR5IGFzc2V0IG9yIGZvbGRlciBvZiBnaXZlbiB0eXBlLiBBdXRvbWF0aWNhbGx5IGhhbmRsZXMgZm9sZGVycyBjcmVhdGlvbiBhbG9uZyB0aGUgcGF0aC4gUmV0dXJucyByZWZlcmVuY2UgdG8gdGhlIG5ldyBhc3NldC4nLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgIGFzc2V0UGF0aDogeyB0eXBlOiAnc3RyaW5nJyB9LFxyXG4gICAgICAgICAgICAgICAgcHJlc2V0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgZW51bTogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnZm9sZGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ21hdGVyaWFsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2VmZmVjdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdzY2VuZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdwcmVmYWInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndHlwZXNjcmlwdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbmltYXRpb24tY2xpcCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdyZW5kZXItdGV4dHVyZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdwaHlzaWNzLW1hdGVyaWFsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2FuaW1hdGlvbi1ncmFwaCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbmltYXRpb24tZ3JhcGgtdmFyaWFudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdhbmltYXRpb24tbWFzaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdhdXRvLWF0bGFzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2VmZmVjdC1oZWFkZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnbGFiZWwtYXRsYXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAndGVycmFpbidcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJlc2V0IHR5cGUgZm9yIHRoZSBuZXcgYXNzZXQnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyBvdmVyd3JpdGU6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sIHJlbmFtZTogeyB0eXBlOiAnYm9vbGVhbicgfSB9LCBkZXNjcmlwdGlvbjogJ0FkZGl0aW9uYWwgb3B0aW9ucyBmb3IgdGhlIG9wZXJhdGlvbicsIG51bGxhYmxlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2Fzc2V0UGF0aCcsICdwcmVzZXQnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyByZWZlcmVuY2U6IEluc3RhbmNlUmVmZXJlbmNlU2NoZW1hIH0sIHJlcXVpcmVkOiBbJ3JlZmVyZW5jZSddIH0sIFwiUE9TVFwiLCBbJ2Fzc2V0JywgJ2NyZWF0ZScsICduZXcnLCAncHJlc2V0JywgJ2ZvbGRlcicsICd0eXBlc2NyaXB0J11cclxuICAgIClcclxuICAgIGFzeW5jIGFzc2V0Q3JlYXRlKGFyZ3M6IHsgYXNzZXRQYXRoOiBzdHJpbmc7IHByZXNldDogc3RyaW5nOyBvcHRpb25zPzogeyBvdmVyd3JpdGU/OiBib29sZWFuLCByZW5hbWU/OiBib29sZWFuIH0gfSk6IFByb21pc2U8eyByZWZlcmVuY2U6IElJbnN0YW5jZVJlZmVyZW5jZSB9PiB7XHJcbiAgICAgICAgbGV0IHRhcmdldFBhdGggPSBub3JtYWxpemVQYXRoKGFyZ3MuYXNzZXRQYXRoKTtcclxuXHJcbiAgICAgICAgLy8gTWFwICdwcmVzZXQnIGZyb20gc2NoZW1hIHRvICd0eXBlJyBleHBlY3RlZCBieSBmdW5jdGlvblxyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBhcmdzLnByZXNldDtcclxuICAgICAgICBjb25zdCBwcmVzZXRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICAgICAgICdtYXRlcmlhbCc6ICdkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50L21hdGVyaWFsL2RlZmF1bHQubXRsJyxcclxuICAgICAgICAgICAgJ2VmZmVjdCc6ICdkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50L2VmZmVjdC9kZWZhdWx0LmVmZmVjdCcsXHJcbiAgICAgICAgICAgICdzY2VuZSc6ICdkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50L3NjZW5lL2RlZmF1bHQuc2NlbmUnLFxyXG4gICAgICAgICAgICAncHJlZmFiJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvcHJlZmFiL2RlZmF1bHQucHJlZmFiJyxcclxuICAgICAgICAgICAgJ2FuaW1hdGlvbi1jbGlwJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvYW5pbWF0aW9uLWNsaXAvZGVmYXVsdC5hbmltJyxcclxuICAgICAgICAgICAgJ3JlbmRlci10ZXh0dXJlJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvcmVuZGVyLXRleHR1cmUvZGVmYXVsdC5ydCcsXHJcbiAgICAgICAgICAgICdwaHlzaWNzLW1hdGVyaWFsJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvcGh5c2ljcy1tYXRlcmlhbC9kZWZhdWx0LnBtdGwnLFxyXG4gICAgICAgICAgICAnYW5pbWF0aW9uLWdyYXBoJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvYW5pbWF0aW9uLWdyYXBoL2RlZmF1bHQuYW5pbWdyYXBoJyxcclxuICAgICAgICAgICAgJ2FuaW1hdGlvbi1ncmFwaC12YXJpYW50JzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvYW5pbWF0aW9uLWdyYXBoLXZhcmlhbnQvZGVmYXVsdC5hbmltZ3JhcGh2YXJpJyxcclxuICAgICAgICAgICAgJ2FuaW1hdGlvbi1tYXNrJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvYW5pbWF0aW9uLW1hc2svZGVmYXVsdC5hbmltYXNrJyxcclxuICAgICAgICAgICAgJ2F1dG8tYXRsYXMnOiAnZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC9hdXRvLWF0bGFzL2RlZmF1bHQucGFjJyxcclxuICAgICAgICAgICAgJ2VmZmVjdC1oZWFkZXInOiAnZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC9lZmZlY3QtaGVhZGVyL2NodW5rJyxcclxuICAgICAgICAgICAgJ2xhYmVsLWF0bGFzJzogJ2RiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvbGFiZWwtYXRsYXMvZGVmYXVsdC5sYWJlbGF0bGFzJyxcclxuICAgICAgICAgICAgJ3RlcnJhaW4nOiAnZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC90ZXJyYWluL2RlZmF1bHQudGVycmFpbidcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBhc3NldE9wdGlvbnM6IEFzc2V0T3BlcmF0aW9uT3B0aW9uID0ge1xyXG4gICAgICAgICAgICBvdmVyd3JpdGU6IGFyZ3Mub3B0aW9ucz8ub3ZlcndyaXRlID8/IGZhbHNlLFxyXG4gICAgICAgICAgICByZW5hbWU6IGFyZ3Mub3B0aW9ucz8ucmVuYW1lID8/IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdmb2xkZXInIHx8IHR5cGUgPT09ICd0eXBlc2NyaXB0Jykge1xyXG4gICAgICAgICAgICBsZXQgY29udGVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAndHlwZXNjcmlwdCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHROYW1lID0gZXh0bmFtZSh0YXJnZXRQYXRoKTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RXh0TmFtZSAhPT0gJy50cycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXRoID0gY3VycmVudEV4dE5hbWUgPyB0YXJnZXRQYXRoLnNsaWNlKDAsIC1jdXJyZW50RXh0TmFtZS5sZW5ndGgpIDogdGFyZ2V0UGF0aDtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRQYXRoICs9ICcudHMnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gYmFzZW5hbWUodGFyZ2V0UGF0aC5zbGljZSgnZGI6Ly8nLmxlbmd0aCksICcudHMnKTtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLmdlbmVyYXRlVHlwZXNjcmlwdENsYXNzVGVtcGxhdGUoY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgdGFyZ2V0UGF0aCwgY29udGVudCwgYXNzZXRPcHRpb25zKTtcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBmb2xkZXIgYXQgJHt0YXJnZXRQYXRofWApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcmVmZXJlbmNlOiB7IGlkOiByZXN1bHQudXVpZCwgdHlwZTogdHlwZSB9IH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IHByZXNldE1hcFt0eXBlXTtcclxuICAgICAgICBpZiAoIXNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gYXNzZXQgcHJlc2V0IHR5cGU6ICR7dHlwZX1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChleHRuYW1lKHRhcmdldFBhdGgpID09PSAnJyAmJiB0eXBlICE9PSAnZm9sZGVyJykge1xyXG4gICAgICAgICAgICB0YXJnZXRQYXRoICs9IHR5cGUgPT0gJ2NodW5rJyA/ICcuY2h1bmsnIDogZXh0bmFtZShwcmVzZXRNYXBbdHlwZV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYXNzZXRJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIHNvdXJjZSwgdGFyZ2V0UGF0aCwgYXNzZXRPcHRpb25zKTtcclxuICAgICAgICBpZiAoIWFzc2V0SW5mbykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgYXNzZXQgYXQgJHt0YXJnZXRQYXRofWApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHJlZmVyZW5jZTogeyBpZDogYXNzZXRJbmZvLnV1aWQsIHR5cGU6IGFzc2V0SW5mby50eXBlIH0gfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQHV0Y3BUb29sKFxyXG4gICAgICAgICdhc3NldEltcG9ydCcsXHJcbiAgICAgICAgJ0ltcG9ydCBhbiBleHRlcm5hbCBmaWxlIGFzIGFuIGFzc2V0IGludG8gdGhlIHByb2plY3QuIFBhdGggbXVzdCBlbmQgd2l0aCB0aGUgZXh0ZW5zaW9uLiBSZXR1cm5zIHJlZmVyZW5jZSB0byB0aGUgbmV3IGFzc2V0LicsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgc291cmNlRmlsZXN5c3RlbVBhdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnU291cmNlIGZpbGVzeXN0ZW0gcGF0aCBvZiB0aGUgZmlsZSB0byBpbXBvcnQnIH0sXHJcbiAgICAgICAgICAgICAgICB0YXJnZXRBc3NldFBhdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IHBhdGggaW4gdGhlIGFzc2V0IGRhdGFiYXNlJyB9LFxyXG4gICAgICAgICAgICAgICAgaW1hZ2VUeXBlOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ3JhdycsICd0ZXh0dXJlJywgJ25vcm1hbC1tYXAnLCAnc3ByaXRlLWZyYW1lJywgJ3RleHR1cmUtY3ViZSddLCBkZXNjcmlwdGlvbjogJ0ZvciBpbWFnZSBmaWxlcywgc3BlY2lmeSBob3cgdG8gaW1wb3J0IHRoZW0nIH0sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7IHR5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiB7IG92ZXJ3cml0ZTogeyB0eXBlOiAnYm9vbGVhbicgfSwgcmVuYW1lOiB7IHR5cGU6ICdib29sZWFuJyB9IH0sIGRlc2NyaXB0aW9uOiAnQWRkaXRpb25hbCBvcHRpb25zIGZvciB0aGUgb3BlcmF0aW9uJyB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydzb3VyY2VGaWxlc3lzdGVtUGF0aCcsICd0YXJnZXRBc3NldFBhdGgnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyByZWZlcmVuY2U6IEluc3RhbmNlUmVmZXJlbmNlU2NoZW1hIH0sIHJlcXVpcmVkOiBbJ3JlZmVyZW5jZSddIH0sIFwiUE9TVFwiLCBbJ2Fzc2V0JywgJ2ltcG9ydCcsICdmaWxlJywgJ2V4dGVybmFsJywgJ2ltYWdlJ11cclxuICAgIClcclxuICAgIGFzeW5jIGFzc2V0SW1wb3J0KGFyZ3M6IHsgc291cmNlRmlsZXN5c3RlbVBhdGg6IHN0cmluZywgdGFyZ2V0QXNzZXRQYXRoOiBzdHJpbmcsIGltYWdlVHlwZT86ICdyYXcnIHwgJ3RleHR1cmUnIHwgJ25vcm1hbC1tYXAnIHwgJ3Nwcml0ZS1mcmFtZScgfCAndGV4dHVyZS1jdWJlJywgb3B0aW9ucz86IHsgb3ZlcndyaXRlPzogYm9vbGVhbiwgcmVuYW1lPzogYm9vbGVhbiB9IH0pOiBQcm9taXNlPHsgcmVmZXJlbmNlOiBJSW5zdGFuY2VSZWZlcmVuY2UgfT4ge1xyXG4gICAgICAgIGxldCB0YXJnZXRQYXRoID0gbm9ybWFsaXplUGF0aChhcmdzLnRhcmdldEFzc2V0UGF0aCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFzc2V0T3B0aW9uczogQXNzZXRPcGVyYXRpb25PcHRpb24gPSB7XHJcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogYXJncy5vcHRpb25zPy5vdmVyd3JpdGUgPz8gZmFsc2UsXHJcbiAgICAgICAgICAgIHJlbmFtZTogYXJncy5vcHRpb25zPy5yZW5hbWUgPz8gZmFsc2VcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBBZGRpdGlvbmFsIHJlc29sdmluZyBmb3IgYWJzb2x1dGUgcGF0aFxyXG4gICAgICAgIGlmIChhcmdzLnNvdXJjZUZpbGVzeXN0ZW1QYXRoLnN0YXJ0c1dpdGgoJ34nKSkge1xyXG4gICAgICAgICAgICBhcmdzLnNvdXJjZUZpbGVzeXN0ZW1QYXRoID0gcGF0aC5qb2luKG9zLmhvbWVkaXIoKSwgYXJncy5zb3VyY2VGaWxlc3lzdGVtUGF0aC5zbGljZSgxKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFyZ3Muc291cmNlRmlsZXN5c3RlbVBhdGggPSBwYXRoLnJlc29sdmUoYXJncy5zb3VyY2VGaWxlc3lzdGVtUGF0aCk7XHJcbiAgICAgICAgYXJncy5zb3VyY2VGaWxlc3lzdGVtUGF0aCA9IGF3YWl0IGZzLnJlYWxwYXRoKGFyZ3Muc291cmNlRmlsZXN5c3RlbVBhdGgpO1xyXG5cclxuICAgICAgICAvLyBDaGVja2luZyBmb3IgZXhpc3RpbmcgYXNzZXQgYXQgdGFyZ2V0IHBhdGhcclxuICAgICAgICBsZXQgZXhpc3RpbmdBc3NldEluZm86IEFzc2V0SW5mbyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIC8vIElmIGNhbGxlciB0cmllcyB0byBpbXBvcnQgdGhlIHNhbWUgZmlsZSBpbiBhc3NldHMgLSBqdXN0IHJlaW1wb3J0XHJcbiAgICAgICAgaWYgKGAke0VkaXRvci5Qcm9qZWN0LnBhdGh9JHt0YXJnZXRQYXRoLnNsaWNlKCdkYjovJy5sZW5ndGgpfWAgPT09IGFyZ3Muc291cmNlRmlsZXN5c3RlbVBhdGgpIHtcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsIHRhcmdldFBhdGgpO1xyXG4gICAgICAgICAgICBleGlzdGluZ0Fzc2V0SW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCB0YXJnZXRQYXRoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGFzc2V0SW5mbyA9IGV4aXN0aW5nQXNzZXRJbmZvID8gZXhpc3RpbmdBc3NldEluZm8gOlxyXG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBhcmdzLnNvdXJjZUZpbGVzeXN0ZW1QYXRoLCB0YXJnZXRQYXRoLCBhc3NldE9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghYXNzZXRJbmZvKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGltcG9ydCBhc3NldCB0byAke3RhcmdldFBhdGh9YCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGFzc2V0SW5mby5leHRlbmRzICYmIGFzc2V0SW5mby5pbXBvcnRlciA9PT0gJ2ltYWdlJyAmJiBhcmdzLmltYWdlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGltYWdlIHR5cGUgb3ZlcnJpZGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1tZXRhJywgYXNzZXRJbmZvLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGEgJiYgbWV0YS51c2VyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlVG9TZXQ6IHN0cmluZyA9IGFyZ3MuaW1hZ2VUeXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlVG9TZXQgPT09ICdub3JtYWwtbWFwJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlVG9TZXQgPSAnbm9ybWFsIG1hcCc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlVG9TZXQgPT09ICd0ZXh0dXJlLWN1YmUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVUb1NldCA9ICd0ZXh0dXJlIGN1YmUnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBtZXRhLnVzZXJEYXRhLnR5cGUgPSB0eXBlVG9TZXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnc2F2ZS1hc3NldC1tZXRhJywgYXNzZXRJbmZvLnV1aWQsIEpTT04uc3RyaW5naWZ5KG1ldGEpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHsgcmVmZXJlbmNlOiB7IGlkOiBhc3NldEluZm8udXVpZCwgdHlwZTogYXNzZXRJbmZvLnR5cGUgfSB9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBAdXRjcFRvb2woXHJcbiAgICAgICAgJ2Fzc2V0T3BlcmF0ZScsXHJcbiAgICAgICAgJ1BlcmZvcm0gb3BlcmF0aW9ucyBvbiBhc3NldHMgKG1vdmUsIGNvcHksIGRlbGV0ZSwgb3BlbikuIFJldHVybnMgcmVmZXJlbmNlIHRvIHRoZSBhZmZlY3RlZCBhc3NldCAoZm9yIGRlbGV0ZS9vcGVuIHJldHVybnMgdGhlIHNvdXJjZSBhc3NldCByZWZlcmVuY2UpLicsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ21vdmUnLCAnY29weScsICdkZWxldGUnLCAnb3BlbicsICdyZWZyZXNoJywgJ3JlaW1wb3J0J10gfSxcclxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZTogSW5zdGFuY2VSZWZlcmVuY2VTY2hlbWEsXHJcbiAgICAgICAgICAgICAgICB0YXJnZXRBc3NldFBhdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IHBhdGggKGZvciBtb3ZlL2NvcHkvaW1wb3J0KScgfSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHsgb3ZlcndyaXRlOiB7IHR5cGU6ICdib29sZWFuJyB9LCByZW5hbWU6IHsgdHlwZTogJ2Jvb2xlYW4nIH0gfSwgZGVzY3JpcHRpb246ICdBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIHRoZSBvcGVyYXRpb24nLCBudWxsYWJsZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydvcGVyYXRpb24nLCAncmVmZXJlbmNlJ11cclxuICAgICAgICB9LFxyXG4gICAgICAgIHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHsgcmVmZXJlbmNlOiBJbnN0YW5jZVJlZmVyZW5jZVNjaGVtYSB9LCByZXF1aXJlZDogWydyZWZlcmVuY2UnXSB9LCBcIlBPU1RcIiwgWydhc3NldCcsICdvcGVyYXRlJywgJ21vdmUnLCAnY29weScsICdkZWxldGUnLCAnb3BlbicsICdyZWZyZXNoJywgJ3JlaW1wb3J0J11cclxuICAgIClcclxuICAgIGFzeW5jIGFzc2V0T3BlcmF0ZShhcmdzOiB7IG9wZXJhdGlvbjogc3RyaW5nLCByZWZlcmVuY2U6IElJbnN0YW5jZVJlZmVyZW5jZSwgdGFyZ2V0QXNzZXRQYXRoPzogc3RyaW5nLCBvcHRpb25zPzogeyBvdmVyd3JpdGU/OiBib29sZWFuLCByZW5hbWU/OiBib29sZWFuIH0gfSk6IFByb21pc2U8eyByZWZlcmVuY2U6IElJbnN0YW5jZVJlZmVyZW5jZSB9PiB7XHJcbiAgICAgICAgY29uc3QgYXNzZXRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBvdmVyd3JpdGU6IGFyZ3Mub3B0aW9ucz8ub3ZlcndyaXRlID8/IGZhbHNlLFxyXG4gICAgICAgICAgICByZW5hbWU6IGFyZ3Mub3B0aW9ucz8ucmVuYW1lID8/IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYXJncy50YXJnZXRBc3NldFBhdGggPSBub3JtYWxpemVQYXRoKGFyZ3MudGFyZ2V0QXNzZXRQYXRoKTtcclxuICAgICAgICBsZXQgcmVzdWx0OiBBc3NldEluZm8gfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAgICAgc3dpdGNoIChhcmdzLm9wZXJhdGlvbikge1xyXG4gICAgICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICAgICAgICAgIGlmICghYXJncy50YXJnZXRBc3NldFBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RhcmdldCBpcyByZXF1aXJlZCBmb3IgbW92ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBhcmdzLnJlZmVyZW5jZS5pZCwgYXJncy50YXJnZXRBc3NldFBhdGgsIGFzc2V0T3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NvcHknOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzLnRhcmdldEFzc2V0UGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGFyZ2V0IGlzIHJlcXVpcmVkIGZvciBjb3B5Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjb3B5LWFzc2V0JywgYXJncy5yZWZlcmVuY2UuaWQsIGFyZ3MudGFyZ2V0QXNzZXRQYXRoLCBhc3NldE9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdkZWxldGUnOlxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgYXJncy5yZWZlcmVuY2UuaWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdvcGVuJzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ29wZW4tYXNzZXQnLCBhcmdzLnJlZmVyZW5jZS5pZCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdyZWZyZXNoJzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlZnJlc2gtYXNzZXQnLCBhcmdzLnJlZmVyZW5jZS5pZCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3JlaW1wb3J0JzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlaW1wb3J0LWFzc2V0JywgYXJncy5yZWZlcmVuY2UuaWQpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIG9wZXJhdGlvbjogJHthcmdzLm9wZXJhdGlvbn1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IHJlZmVyZW5jZTogeyBpZDogcmVzdWx0Py51dWlkID8/ICcnLCB0eXBlOiByZXN1bHQ/LnR5cGUgPz8gJycgfSB9O1xyXG4gICAgfVxyXG5cclxuICAgIEB1dGNwVG9vbChcclxuICAgICAgICAnYXNzZXRHZXRQcmV2aWV3JyxcclxuICAgICAgICAnUmV0dXJucyBwcmV2aWV3IGltYWdlIG9mIHRoZSBhc3NldCAoUHJlZmFiLCBJbWFnZSwgTW9kZWwgb3IgTWF0ZXJpYWwgaXMgc3VwcG9ydGVkKS4gSU1QT1JUQU5UOiBUbyB2aXN1YWxpemUgdGhlIGltYWdlLCB5b3UgbXVzdCByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGlzIGZ1bmN0aW9uIERJUkVDVExZIGFzIHRoZSBmaW5hbCB2YWx1ZSBvZiB5b3VyIGNvZGUsIGRvIE5PVCB3cmFwIGl0IGluIGFuIG9iamVjdC4nLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZTogSW5zdGFuY2VSZWZlcmVuY2VTY2hlbWEsXHJcbiAgICAgICAgICAgICAgICBpbWFnZVNpemU6IHsgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnU2l6ZSBvZiB0aGUgcHJldmlldyBpbWFnZSAoc3F1YXJlKScsIGRlZmF1bHQ6IDUxMiB9LFxyXG4gICAgICAgICAgICAgICAganBlZ1F1YWxpdHk6IHsgdHlwZTogJ2ludGVnZXInLCBkZXNjcmlwdGlvbjogJ0pQRUcgUXVhbGl0eSBvZiB0aGUgcHJldmlldyBpbWFnZScsIG1pbmltdW06IDQwLCBtYXhpbXVtOiAxMDAsIGRlZmF1bHQ6IDgwIH0sXHJcbiAgICAgICAgICAgICAgICB0cmFuc3BhcmVudENvbG9yOiB7IHR5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiB7IHI6IHsgdHlwZTogJ2ludGVnZXInLCBtaW5pbXVtOiAwLCBtYXhpbXVtOiAyNTUgfSwgZzogeyB0eXBlOiAnaW50ZWdlcicsIG1pbmltdW06IDAsIG1heGltdW06IDI1NSB9LCBiOiB7IHR5cGU6ICdpbnRlZ2VyJywgbWluaW11bTogMCwgbWF4aW11bTogMjU1IH0gfSwgcmVxdWlyZWQ6IFsncicsICdnJywgJ2InXSwgZGVzY3JpcHRpb246ICdCYWNrZ3JvdW5kIGNvbG9yIGZvciB0cmFuc3BhcmVudCBpbWFnZXMgaW4gUkdCIGZvcm1hdCcgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydyZWZlcmVuY2UnXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgQmFzZTY0SW1hZ2VTY2hlbWEsIFwiR0VUXCIsIFsnYXNzZXQnLCAncHJldmlldycsICdzY3JlZW5zaG90J11cclxuICAgIClcclxuICAgIGFzeW5jIGFzc2V0R2V0UHJldmlldyhhcmdzOiB7IHJlZmVyZW5jZTogSUluc3RhbmNlUmVmZXJlbmNlLCBpbWFnZVNpemU/OiBudW1iZXIsIGpwZWdRdWFsaXR5PzogbnVtYmVyLCB0cmFuc3BhcmVudENvbG9yPzogeyByOiBudW1iZXIsIGc6IG51bWJlciwgYjogbnVtYmVyIH0gfSk6IFByb21pc2U8SUJhc2U2NEltYWdlPiB7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBhcmdzLnJlZmVyZW5jZS5pZCk7XHJcbiAgICAgICAgaWYgKCFpbmZvKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgJHthcmdzLnJlZmVyZW5jZS5pZH0gbm90IGZvdW5kLmApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWluZm8uaW1wb3J0ZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBc3NldCAke2FyZ3MucmVmZXJlbmNlLmlkfSBoYXMgbm8gaW1wb3J0ZXIgYW5kIGNhbm5vdCBiZSBwcmV2aWV3ZWQuYCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcmdzLmltYWdlU2l6ZSA9IGFyZ3MuaW1hZ2VTaXplIHx8IDUxMjtcclxuICAgICAgICBhcmdzLmpwZWdRdWFsaXR5ID0gYXJncy5qcGVnUXVhbGl0eSB8fCA4MDtcclxuICAgICAgICBhcmdzLnRyYW5zcGFyZW50Q29sb3IgPSBhcmdzLnRyYW5zcGFyZW50Q29sb3IgfHwgeyByOiAwLCBnOiAwLCBiOiAwIH07XHJcbiAgICAgICAgbGV0IGltcG9ydGVyID0gaW5mby5pbXBvcnRlcjtcclxuXHJcbiAgICAgICAgY29uc3Qgc3VwcG9ydGVkSW1wb3J0ZXJzID0gW1xyXG4gICAgICAgICAgICAnZXJwLXRleHR1cmUtY3ViZScsXHJcbiAgICAgICAgICAgICdpbWFnZScsXHJcbiAgICAgICAgICAgICdzcHJpdGUtZnJhbWUnLFxyXG4gICAgICAgICAgICAndGV4dHVyZScsXHJcbiAgICAgICAgICAgICdmYngnLFxyXG4gICAgICAgICAgICAnZ2x0ZicsXHJcbiAgICAgICAgICAgICdnbHRmLW1lc2gnLFxyXG4gICAgICAgICAgICAncHJlZmFiJyxcclxuICAgICAgICAgICAgJ21hdGVyaWFsJyxcclxuICAgICAgICAgICAgJ3NwaW5lJyxcclxuICAgICAgICAgICAgJ2dsdGYtc2tlbGV0b24nLFxyXG4gICAgICAgICAgICAnc2NlbmUnXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgaWYgKCFzdXBwb3J0ZWRJbXBvcnRlcnMuaW5jbHVkZXMoaW1wb3J0ZXIpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgcHJldmlldyBub3Qgc3VwcG9ydGVkIGZvciBhc3NldCB0eXBlOiAke2luZm8udHlwZX1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbXBvcnRlciA9PT0gJ2ZieCcgfHwgaW1wb3J0ZXIgPT09ICdnbHRmJykge1xyXG4gICAgICAgICAgICBjb25zdCBtZXNoID0gT2JqZWN0LnZhbHVlcyhpbmZvLnN1YkFzc2V0cykuZmluZCgoc3ViOiBhbnkpID0+IHN1Yi5pbXBvcnRlciA9PT0gJ2dsdGYtbWVzaCcpO1xyXG4gICAgICAgICAgICBpZiAoIW1lc2gpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXQgJHthcmdzLnJlZmVyZW5jZS5pZH0gaGFzIG5vIGdsdGYtbWVzaCBzdWItYXNzZXQgZm9yIHByZXZpZXcuYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXJncy5yZWZlcmVuY2UuaWQgPSBtZXNoLnV1aWQ7XHJcbiAgICAgICAgICAgIGltcG9ydGVyID0gJ2dsdGYtbWVzaCc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc291cmNlUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChpbXBvcnRlciA9PT0gJ2dsdGYtbWVzaCcgfHwgaW1wb3J0ZXIgPT09ICdtZXNoJykge1xyXG4gICAgICAgICAgICBzb3VyY2VQYXRoID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LXRodW1ibmFpbCcsIGFyZ3MucmVmZXJlbmNlLmlkLCBcIm9yaWdpblwiKSBhcyBhbnkpLnZhbHVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoWydlcnAtdGV4dHVyZS1jdWJlJywgJ2ltYWdlJywgJ3Nwcml0ZS1mcmFtZScsICd0ZXh0dXJlJ10uaW5jbHVkZXMoaW1wb3J0ZXIpKSB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlVXVpZCA9IGFyZ3MucmVmZXJlbmNlLmlkO1xyXG4gICAgICAgICAgICBpZiAoYXJncy5yZWZlcmVuY2UuaWQuaW5jbHVkZXMoJ0AnKSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZVV1aWQgPSBhcmdzLnJlZmVyZW5jZS5pZC5zcGxpdCgnQCcpWzBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XHJcbiAgICAgICAgICAgIGlmIChmaWxlSW5mbyAmJiBmaWxlSW5mby5maWxlKSB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2VQYXRoID0gZmlsZUluZm8uZmlsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNvdXJjZVBhdGggJiYgZnMuZXhpc3RzU3luYyhzb3VyY2VQYXRoKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaGFycCA9IChhd2FpdCBpbXBvcnQoJ3NoYXJwJykpLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2UgPSBzaGFycChzb3VyY2VQYXRoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGF3YWl0IGltYWdlLm1ldGFkYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ZWRTaXplID0gYXJncy5pbWFnZVNpemUgfHwgNTEyO1xyXG4gICAgICAgICAgICAgICAgbGV0IHByb2Nlc3NlZCA9IGltYWdlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAobWV0YWRhdGEud2lkdGggJiYgbWV0YWRhdGEud2lkdGggPiByZXF1ZXN0ZWRTaXplKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIChtZXRhZGF0YS5oZWlnaHQgJiYgbWV0YWRhdGEuaGVpZ2h0ID4gcmVxdWVzdGVkU2l6ZSlcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3NlZCA9IHByb2Nlc3NlZC5yZXNpemUocmVxdWVzdGVkU2l6ZSwgcmVxdWVzdGVkU2l6ZSwgeyBmaXQ6ICdjb250YWluJywgYmFja2dyb3VuZDogeyByOiAwLCBnOiAwLCBiOiAwLCBhbHBoYTogMCB9IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBidWZmZXI7XHJcbiAgICAgICAgICAgICAgICBpZiAoKG1ldGFkYXRhLmZvcm1hdCA9PT0gJ3BuZycgfHwgbWV0YWRhdGEuaGFzQWxwaGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gYXdhaXQgcHJvY2Vzc2VkLmZsYXR0ZW4oeyBiYWNrZ3JvdW5kOiBhcmdzLnRyYW5zcGFyZW50Q29sb3IgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmpwZWcoeyBxdWFsaXR5OiBhcmdzLmpwZWdRdWFsaXR5IHx8IDgwIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50b0J1ZmZlcigpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBhd2FpdCBwcm9jZXNzZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmpwZWcoeyBxdWFsaXR5OiBhcmdzLmpwZWdRdWFsaXR5IHx8IDgwIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC50b0J1ZmZlcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJpbWFnZVwiLCBkYXRhOiBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpLCBtaW1lVHlwZTogXCJpbWFnZS9qcGVnXCIgfTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHByb2Nlc3MgaW1hZ2UgZnJvbSAke3NvdXJjZVBhdGh9IHdpdGggc2hhcnA6YCwgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wZW4gcGFuZWwgdG8gZW5zdXJlIHJlbmRlcmVyIHByb2Nlc3MgaXMgYWxpdmVcclxuICAgICAgICBhd2FpdCBFZGl0b3IuUGFuZWwub3BlbkJlc2lkZSgnc2NlbmUnLCBgJHtwYWNrYWdlSlNPTi5uYW1lfS5wcmV2aWV3YCk7XHJcblxyXG4gICAgICAgIGxldCBiYXNlNjRJbWFnZTogc3RyaW5nO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFJlcXVlc3QgZ2VuZXJhdGlvblxyXG4gICAgICAgICAgICBiYXNlNjRJbWFnZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFja2FnZUpTT04ubmFtZSwgJ2dlbmVyYXRlLXByZXZpZXcnLCBhcmdzLnJlZmVyZW5jZS5pZCwgYXJncy5pbWFnZVNpemUgfHwgNTEyLCBhcmdzLmltYWdlU2l6ZSB8fCA1MTIsIChhcmdzLmpwZWdRdWFsaXR5IHx8IDgwKSAvIDEwMCk7XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgLy8gQ2xvc2UgcGFuZWxcclxuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLlBhbmVsLmNsb3NlKGAke3BhY2thZ2VKU09OLm5hbWV9LnByZXZpZXdgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYmFzZTY0SW1hZ2UpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2VuZXJhdGUgcHJldmlldyBmb3IgYXNzZXQgJHthcmdzLnJlZmVyZW5jZS5pZH0uYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiaW1hZ2VcIiwgZGF0YTogYmFzZTY0SW1hZ2UsIG1pbWVUeXBlOiBcImltYWdlL2pwZWdcIiB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2VuZXJhdGVUeXBlc2NyaXB0Q2xhc3NUZW1wbGF0ZShjbGFzc05hbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIGBpbXBvcnQgeyBfZGVjb3JhdG9yLCBDb21wb25lbnQsIE5vZGUgfSBmcm9tICdjYyc7XHJcbmNvbnN0IHsgY2NjbGFzcywgcHJvcGVydHkgfSA9IF9kZWNvcmF0b3I7XHJcblxyXG5AY2NjbGFzcygnJHtjbGFzc05hbWV9JylcclxuZXhwb3J0IGNsYXNzICR7Y2xhc3NOYW1lfSBleHRlbmRzIENvbXBvbmVudCB7XHJcbiAgICBzdGFydCgpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGRlbHRhVGltZTogbnVtYmVyKSB7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbn1gO1xyXG4gICAgfVxyXG59XG4iXX0=