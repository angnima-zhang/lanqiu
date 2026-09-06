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
exports.EditorTools = void 0;
const package_json_1 = __importDefault(require("../../../package.json"));
const decorators_1 = require("../decorators");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schemas_1 = require("../schemas");
class EditorTools {
    async editorOperate(args) {
        switch (args.operation) {
            case 'save_scene_or_prefab':
                await Editor.Message.request('scene', 'save-scene');
                return { success: true };
            case 'close_scene_or_prefab':
                await Editor.Message.request('scene', 'close-scene');
                return { success: true };
            case 'play_preview':
                await Editor.Message.request('scene', 'editor-preview-set-play', true);
                return { success: true };
            case 'pause':
                await Editor.Message.request('scene', 'editor-preview-call-method', 'pause', true);
                return { success: true };
            case 'step':
                await Editor.Message.request('scene', 'editor-preview-call-method', 'step');
                return { success: true };
            case 'stop':
                await Editor.Message.request('scene', 'editor-preview-set-play', false);
                return { success: true };
            case 'refresh':
                await Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
                return { success: true };
            default:
                throw new Error(`Unknown operation: ${args.operation}`);
        }
    }
    async editorGetLogs(args) {
        const projectPath = Editor.Project.path;
        const logPath = path.join(projectPath, 'temp', 'logs', 'project.log');
        if (args.showStack === undefined) {
            args.showStack = false;
        }
        if (!fs.existsSync(logPath)) {
            throw new Error(`Log file not found at ${logPath}`);
        }
        const entries = [];
        const fd = fs.openSync(logPath, 'r');
        try {
            const stats = fs.fstatSync(fd);
            const fileSize = stats.size;
            const bufferSize = 10 * 1024; // 10KB chunks
            const buffer = Buffer.alloc(bufferSize);
            let position = fileSize;
            let leftover = '';
            let accumulatedBody = ''; // Text belonging to the current (bottom-most) entry being parsed
            const regex = /^(\d{1,2}-\d{1,2}-\d{4}\s\d{2}:\d{2}:\d{2}\s-\s(?:log|warn|error|info):\s)/;
            const timestampRegex = /^\d{1,2}-\d{1,2}-\d{4}\s\d{2}:\d{2}:\d{2}\s-\s/;
            let lastContent = null;
            let lastCount = 0;
            while (position > 0 && entries.length < args.count) {
                const readSize = Math.min(bufferSize, position);
                const readPos = position - readSize;
                fs.readSync(fd, buffer, 0, readSize, readPos);
                position -= readSize;
                const chunk = buffer.toString('utf-8', 0, readSize);
                const combined = chunk + leftover;
                // Split by newline
                const lines = combined.split(/\r?\n/);
                if (position > 0) {
                    leftover = lines.shift() || '';
                }
                else {
                    leftover = ''; // Process all
                }
                // Process lines in reverse (bottom to top of the chunk)
                for (let i = lines.length - 1; i >= 0; i--) {
                    const line = lines[i];
                    // Check if this line is a Header (Start of Entry)
                    if (regex.test(line)) {
                        let entry = line;
                        if (args.showStack && accumulatedBody.length > 0) {
                            entry += '\n' + accumulatedBody;
                        }
                        const cleaned = entry.replace(timestampRegex, '');
                        if (cleaned === lastContent) {
                            lastCount++;
                            entries[entries.length - 1] = `(${lastCount}) ${cleaned}`;
                        }
                        else {
                            if (entries.length >= args.count) {
                                // Found a new group but we already have enough
                                position = 0; // Stop reading file loop
                                break; // Stop lines loop
                            }
                            lastContent = cleaned;
                            lastCount = 1;
                            entries.push(cleaned);
                        }
                        accumulatedBody = ''; // Reset for the next entry (upwards)
                    }
                    else {
                        // This identifies as body text (or empty line) belonging to the entry "above" it
                        if (args.showStack && accumulatedBody.length > 0) {
                            accumulatedBody = line + '\n' + accumulatedBody;
                        }
                        else {
                            accumulatedBody = line;
                        }
                    }
                }
            }
        }
        finally {
            fs.closeSync(fd);
        }
        // We pushed entries in reverse order (newest first).
        if (args.order === 'oldest-to-newest') {
            return { logLines: entries.reverse() };
        }
        return { logLines: entries };
    }
    async editorGetScenePreview(args) {
        var _a, _b, _c, _d;
        const result = await Editor.Message.request('scene', 'execute-scene-script', {
            name: package_json_1.default.name,
            method: 'captureScreenshot',
            args: [(_a = args.imageSize) !== null && _a !== void 0 ? _a : { width: 512, height: 512 }, (_b = args.jpegQuality) !== null && _b !== void 0 ? _b : 80, args.cameraPosition, args.targetPosition, (_c = args.orthographic) !== null && _c !== void 0 ? _c : false, (_d = args.orthographicSize) !== null && _d !== void 0 ? _d : 10]
        });
        return { type: 'image', data: result, mimeType: 'image/jpeg' };
    }
}
exports.EditorTools = EditorTools;
__decorate([
    (0, decorators_1.utcpTool)('editorOperate', 'Common editor operations for scene and prefab view, game preview controls and asset database refresh', {
        type: 'object',
        properties: {
            operation: { type: 'string', enum: ['save_scene_or_prefab', 'close_scene_or_prefab', 'play_preview', 'pause', 'step', 'stop', 'refresh'] }
        },
        required: ['operation']
    }, schemas_1.SuccessIndicatorSchema, "POST", ['operation', 'editor', 'scene', 'prefab', 'preview', 'asset', 'refresh'])
], EditorTools.prototype, "editorOperate", null);
__decorate([
    (0, decorators_1.utcpTool)('editorGetLogs', 'Get last N editor log entries', {
        type: 'object',
        properties: {
            count: { type: 'number', description: 'Number of log entries to retrieve', default: 10 },
            showStack: { type: 'boolean', description: 'Return full stack trace for each log entry' },
            order: { type: 'string', enum: ['newest-to-oldest', 'oldest-to-newest'], description: 'Order of logs', default: 'newest-to-oldest' }
        },
        required: ['count', 'order']
    }, { type: 'object', properties: { logLines: { type: 'array', items: { type: 'string' } } }, required: ['logLines'] }, "GET", ['editor', 'logs', 'debug', 'info'])
], EditorTools.prototype, "editorGetLogs", null);
__decorate([
    (0, decorators_1.utcpTool)('editorGetScenePreview', 'Returns preview image of scene view. IMPORTANT: To visualize the image, you must return the result of this function DIRECTLY as the final value of your code, do NOT wrap it in an object.', {
        type: 'object',
        properties: {
            imageSize: { type: 'object', properties: { width: { type: 'number', default: 512 }, height: { type: 'number', default: 512 } }, nullable: true },
            jpegQuality: { type: 'integer', minimum: 40, maximum: 100, default: 80 },
            cameraPosition: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } }, required: ['x', 'y', 'z'], description: 'Camera world position' },
            targetPosition: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } }, required: ['x', 'y', 'z'], description: 'Point the camera looks at' },
            orthographic: { type: 'boolean', default: false, description: 'Whether to use orthographic projection' },
            orthographicSize: { type: 'number', default: 10, description: 'Orthographic size (only applies if orthographic is true)' }
        },
        required: ['cameraPosition', 'targetPosition']
    }, schemas_1.Base64ImageSchema, "GET", ['scene', 'screenshot', 'preview', 'inspection', 'image'])
], EditorTools.prototype, "editorGetScenePreview", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc291cmNlL3V0Y3AvdG9vbHMvZWRpdG9yLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlFQUFnRDtBQUNoRCw4Q0FBeUM7QUFDekMsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3Qix3Q0FBd0c7QUFFeEcsTUFBYSxXQUFXO0lBY2QsQUFBTixLQUFLLENBQUMsYUFBYSxDQUFDLElBQTJCO1FBQzNDLFFBQVEsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JCLEtBQUssc0JBQXNCO2dCQUN2QixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDcEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUM3QixLQUFLLHVCQUF1QjtnQkFDeEIsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3JELE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDN0IsS0FBSyxjQUFjO2dCQUNmLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN2RSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQzdCLEtBQUssT0FBTztnQkFDUixNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25GLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDN0IsS0FBSyxNQUFNO2dCQUNOLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM3RSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQzdCLEtBQUssTUFBTTtnQkFDUCxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUM3QixLQUFLLFNBQVM7Z0JBQ1YsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUN6RSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQzdCO2dCQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7SUFDTCxDQUFDO0lBZ0JLLEFBQU4sS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUEyRjtRQUMzRyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUN4QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRXRFLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7UUFDN0IsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFckMsSUFBSSxDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvQixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQzVCLE1BQU0sVUFBVSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxjQUFjO1lBQzVDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFeEMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3hCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUMsQ0FBQyxpRUFBaUU7WUFFM0YsTUFBTSxLQUFLLEdBQUcsNEVBQTRFLENBQUM7WUFDM0YsTUFBTSxjQUFjLEdBQUcsZ0RBQWdELENBQUM7WUFFeEUsSUFBSSxXQUFXLEdBQWtCLElBQUksQ0FBQztZQUN0QyxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFFbEIsT0FBTyxRQUFRLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxHQUFHLFFBQVEsQ0FBQztnQkFFcEMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzlDLFFBQVEsSUFBSSxRQUFRLENBQUM7Z0JBRXJCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFFbEMsbUJBQW1CO2dCQUNuQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUV0QyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDZixRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNKLFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxjQUFjO2dCQUNqQyxDQUFDO2dCQUVELHdEQUF3RDtnQkFDeEQsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3pDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFdEIsa0RBQWtEO29CQUNsRCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDbkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO3dCQUNqQixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDL0MsS0FBSyxJQUFJLElBQUksR0FBRyxlQUFlLENBQUM7d0JBQ3BDLENBQUM7d0JBRUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBRWxELElBQUksT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDOzRCQUMxQixTQUFTLEVBQUUsQ0FBQzs0QkFDWixPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLFNBQVMsS0FBSyxPQUFPLEVBQUUsQ0FBQzt3QkFDOUQsQ0FBQzs2QkFBTSxDQUFDOzRCQUNKLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0NBQy9CLCtDQUErQztnQ0FDL0MsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtnQ0FDdkMsTUFBTSxDQUFDLGtCQUFrQjs0QkFDN0IsQ0FBQzs0QkFDRCxXQUFXLEdBQUcsT0FBTyxDQUFDOzRCQUN0QixTQUFTLEdBQUcsQ0FBQyxDQUFDOzRCQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQzFCLENBQUM7d0JBRUQsZUFBZSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHFDQUFxQztvQkFDL0QsQ0FBQzt5QkFBTSxDQUFDO3dCQUNKLGlGQUFpRjt3QkFDakYsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQy9DLGVBQWUsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLGVBQWUsQ0FBQzt3QkFDcEQsQ0FBQzs2QkFBTSxDQUFDOzRCQUNKLGVBQWUsR0FBRyxJQUFJLENBQUM7d0JBQzNCLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztRQUVMLENBQUM7Z0JBQVMsQ0FBQztZQUNQLEVBQUUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUVELHFEQUFxRDtRQUNyRCxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztZQUNuQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQzVDLENBQUM7UUFFRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFtQkssQUFBTixLQUFLLENBQUMscUJBQXFCLENBQUMsSUFPM0I7O1FBRUcsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUU7WUFDekUsSUFBSSxFQUFFLHNCQUFXLENBQUMsSUFBSTtZQUN0QixNQUFNLEVBQUUsbUJBQW1CO1lBQzNCLElBQUksRUFBRSxDQUFDLE1BQUEsSUFBSSxDQUFDLFNBQVMsbUNBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxNQUFBLElBQUksQ0FBQyxXQUFXLG1DQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsTUFBQSxJQUFJLENBQUMsWUFBWSxtQ0FBSSxLQUFLLEVBQUUsTUFBQSxJQUFJLENBQUMsZ0JBQWdCLG1DQUFJLEVBQUUsQ0FBQztTQUNwTCxDQUFDLENBQUM7UUFFSCxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsQ0FBQztJQUNuRSxDQUFDO0NBQ0o7QUEvTEQsa0NBK0xDO0FBakxTO0lBWkwsSUFBQSxxQkFBUSxFQUNMLGVBQWUsRUFDZixzR0FBc0csRUFDdEc7UUFDSSxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNSLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsc0JBQXNCLEVBQUUsdUJBQXVCLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxFQUFFO1NBQzdJO1FBQ0QsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDO0tBQzFCLEVBQ0QsZ0NBQXNCLEVBQUUsTUFBTSxFQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQzdHO2dEQTJCQTtBQWdCSztJQWRMLElBQUEscUJBQVEsRUFDTCxlQUFlLEVBQ2YsK0JBQStCLEVBQy9CO1FBQ0ksSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDUixLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxtQ0FBbUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1lBQ3hGLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLDRDQUE0QyxFQUFFO1lBQ3pGLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRTtTQUN2STtRQUNELFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7S0FDL0IsRUFDRCxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQ2xLO2dEQW9HQTtBQW1CSztJQWpCTCxJQUFBLHFCQUFRLEVBQ0wsdUJBQXVCLEVBQ3ZCLDRMQUE0TCxFQUM1TDtRQUNJLElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7WUFDaEosV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtZQUN4RSxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUM7WUFDdkwsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixFQUFDO1lBQzNMLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsd0NBQXdDLEVBQUM7WUFDdkcsZ0JBQWdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLDBEQUEwRCxFQUFDO1NBQzVIO1FBQ0QsUUFBUSxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUM7S0FDakQsRUFDRCwyQkFBaUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQ3RGO3dEQWlCQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYWNrYWdlSlNPTiBmcm9tICcuLi8uLi8uLi9wYWNrYWdlLmpzb24nO1xyXG5pbXBvcnQgeyB1dGNwVG9vbCB9IGZyb20gJy4uL2RlY29yYXRvcnMnO1xyXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IEJhc2U2NEltYWdlU2NoZW1hLCBJQmFzZTY0SW1hZ2UsIElTdWNjZXNzSW5kaWNhdG9yLCBTdWNjZXNzSW5kaWNhdG9yU2NoZW1hIH0gZnJvbSAnLi4vc2NoZW1hcyc7XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdG9yVG9vbHMge1xyXG5cclxuICAgIEB1dGNwVG9vbChcclxuICAgICAgICAnZWRpdG9yT3BlcmF0ZScsXHJcbiAgICAgICAgJ0NvbW1vbiBlZGl0b3Igb3BlcmF0aW9ucyBmb3Igc2NlbmUgYW5kIHByZWZhYiB2aWV3LCBnYW1lIHByZXZpZXcgY29udHJvbHMgYW5kIGFzc2V0IGRhdGFiYXNlIHJlZnJlc2gnLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbjogeyB0eXBlOiAnc3RyaW5nJywgZW51bTogWydzYXZlX3NjZW5lX29yX3ByZWZhYicsICdjbG9zZV9zY2VuZV9vcl9wcmVmYWInLCAncGxheV9wcmV2aWV3JywgJ3BhdXNlJywgJ3N0ZXAnLCAnc3RvcCcsICdyZWZyZXNoJ10gfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydvcGVyYXRpb24nXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgU3VjY2Vzc0luZGljYXRvclNjaGVtYSwgXCJQT1NUXCIsICBbJ29wZXJhdGlvbicsICdlZGl0b3InLCAnc2NlbmUnLCAncHJlZmFiJywgJ3ByZXZpZXcnLCAnYXNzZXQnLCAncmVmcmVzaCddXHJcbiAgICApXHJcbiAgICBhc3luYyBlZGl0b3JPcGVyYXRlKGFyZ3M6IHsgb3BlcmF0aW9uOiBzdHJpbmcgfSk6IFByb21pc2U8SVN1Y2Nlc3NJbmRpY2F0b3I+IHtcclxuICAgICAgICBzd2l0Y2ggKGFyZ3Mub3BlcmF0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NhdmVfc2NlbmVfb3JfcHJlZmFiJzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NhdmUtc2NlbmUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcclxuICAgICAgICAgICAgY2FzZSAnY2xvc2Vfc2NlbmVfb3JfcHJlZmFiJzpcclxuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2Nsb3NlLXNjZW5lJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgICAgIGNhc2UgJ3BsYXlfcHJldmlldyc6XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlZGl0b3ItcHJldmlldy1zZXQtcGxheScsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgICAgICBjYXNlICdwYXVzZSc6XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlZGl0b3ItcHJldmlldy1jYWxsLW1ldGhvZCcsICdwYXVzZScsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgICAgICBjYXNlICdzdGVwJzpcclxuICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlZGl0b3ItcHJldmlldy1jYWxsLW1ldGhvZCcsICdzdGVwJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0b3AnOlxyXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZWRpdG9yLXByZXZpZXctc2V0LXBsYXknLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XHJcbiAgICAgICAgICAgIGNhc2UgJ3JlZnJlc2gnOlxyXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVmcmVzaC1hc3NldCcsICdkYjovL2Fzc2V0cycpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIG9wZXJhdGlvbjogJHthcmdzLm9wZXJhdGlvbn1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgQHV0Y3BUb29sKFxyXG4gICAgICAgICdlZGl0b3JHZXRMb2dzJyxcclxuICAgICAgICAnR2V0IGxhc3QgTiBlZGl0b3IgbG9nIGVudHJpZXMnLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgIGNvdW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ051bWJlciBvZiBsb2cgZW50cmllcyB0byByZXRyaWV2ZScsIGRlZmF1bHQ6IDEwIH0sXHJcbiAgICAgICAgICAgICAgICBzaG93U3RhY2s6IHsgdHlwZTogJ2Jvb2xlYW4nLCBkZXNjcmlwdGlvbjogJ1JldHVybiBmdWxsIHN0YWNrIHRyYWNlIGZvciBlYWNoIGxvZyBlbnRyeScgfSxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiB7IHR5cGU6ICdzdHJpbmcnLCBlbnVtOiBbJ25ld2VzdC10by1vbGRlc3QnLCAnb2xkZXN0LXRvLW5ld2VzdCddLCBkZXNjcmlwdGlvbjogJ09yZGVyIG9mIGxvZ3MnLCBkZWZhdWx0OiAnbmV3ZXN0LXRvLW9sZGVzdCcgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydjb3VudCcsICdvcmRlciddXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7IHR5cGU6ICdvYmplY3QnLCBwcm9wZXJ0aWVzOiB7IGxvZ0xpbmVzOiB7IHR5cGU6ICdhcnJheScsIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0gfSB9LCByZXF1aXJlZDogWydsb2dMaW5lcyddIH0sIFwiR0VUXCIsICBbJ2VkaXRvcicsICdsb2dzJywgJ2RlYnVnJywgJ2luZm8nXVxyXG4gICAgKVxyXG4gICAgYXN5bmMgZWRpdG9yR2V0TG9ncyhhcmdzOiB7IGNvdW50OiBudW1iZXIsIHNob3dTdGFjazogYm9vbGVhbiwgb3JkZXI6ICduZXdlc3QtdG8tb2xkZXN0JyB8ICdvbGRlc3QtdG8tbmV3ZXN0JyB9KTogUHJvbWlzZTx7IGxvZ0xpbmVzOiBzdHJpbmdbXSB9PiB7XHJcbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xyXG4gICAgICAgIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4ocHJvamVjdFBhdGgsICd0ZW1wJywgJ2xvZ3MnLCAncHJvamVjdC5sb2cnKTtcclxuXHJcbiAgICAgICAgaWYgKGFyZ3Muc2hvd1N0YWNrID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgYXJncy5zaG93U3RhY2sgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhsb2dQYXRoKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExvZyBmaWxlIG5vdCBmb3VuZCBhdCAke2xvZ1BhdGh9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGZkID0gZnMub3BlblN5bmMobG9nUGF0aCwgJ3InKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGZzLmZzdGF0U3luYyhmZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVTaXplID0gc3RhdHMuc2l6ZTtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyU2l6ZSA9IDEwICogMTAyNDsgLy8gMTBLQiBjaHVua3NcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmFsbG9jKGJ1ZmZlclNpemUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gZmlsZVNpemU7XHJcbiAgICAgICAgICAgIGxldCBsZWZ0b3ZlciA9ICcnO1xyXG4gICAgICAgICAgICBsZXQgYWNjdW11bGF0ZWRCb2R5ID0gJyc7IC8vIFRleHQgYmVsb25naW5nIHRvIHRoZSBjdXJyZW50IChib3R0b20tbW9zdCkgZW50cnkgYmVpbmcgcGFyc2VkXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCByZWdleCA9IC9eKFxcZHsxLDJ9LVxcZHsxLDJ9LVxcZHs0fVxcc1xcZHsyfTpcXGR7Mn06XFxkezJ9XFxzLVxccyg/OmxvZ3x3YXJufGVycm9yfGluZm8pOlxccykvO1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lc3RhbXBSZWdleCA9IC9eXFxkezEsMn0tXFxkezEsMn0tXFxkezR9XFxzXFxkezJ9OlxcZHsyfTpcXGR7Mn1cXHMtXFxzLztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCBsYXN0Q29udGVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxldCBsYXN0Q291bnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHBvc2l0aW9uID4gMCAmJiBlbnRyaWVzLmxlbmd0aCA8IGFyZ3MuY291bnQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRTaXplID0gTWF0aC5taW4oYnVmZmVyU2l6ZSwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZFBvcyA9IHBvc2l0aW9uIC0gcmVhZFNpemU7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZzLnJlYWRTeW5jKGZkLCBidWZmZXIsIDAsIHJlYWRTaXplLCByZWFkUG9zKTtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uIC09IHJlYWRTaXplO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaHVuayA9IGJ1ZmZlci50b1N0cmluZygndXRmLTgnLCAwLCByZWFkU2l6ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZCA9IGNodW5rICsgbGVmdG92ZXI7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFNwbGl0IGJ5IG5ld2xpbmVcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gY29tYmluZWQuc3BsaXQoL1xccj9cXG4vKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnRvdmVyID0gbGluZXMuc2hpZnQoKSB8fCAnJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdG92ZXIgPSAnJzsgLy8gUHJvY2VzcyBhbGxcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIGxpbmVzIGluIHJldmVyc2UgKGJvdHRvbSB0byB0b3Agb2YgdGhlIGNodW5rKVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGxpbmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoaXMgbGluZSBpcyBhIEhlYWRlciAoU3RhcnQgb2YgRW50cnkpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4LnRlc3QobGluZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVudHJ5ID0gbGluZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3Muc2hvd1N0YWNrICYmIGFjY3VtdWxhdGVkQm9keS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeSArPSAnXFxuJyArIGFjY3VtdWxhdGVkQm9keTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xlYW5lZCA9IGVudHJ5LnJlcGxhY2UodGltZXN0YW1wUmVnZXgsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbGVhbmVkID09PSBsYXN0Q29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdENvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyaWVzW2VudHJpZXMubGVuZ3RoIC0gMV0gPSBgKCR7bGFzdENvdW50fSkgJHtjbGVhbmVkfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cmllcy5sZW5ndGggPj0gYXJncy5jb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvdW5kIGEgbmV3IGdyb3VwIGJ1dCB3ZSBhbHJlYWR5IGhhdmUgZW5vdWdoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSAwOyAvLyBTdG9wIHJlYWRpbmcgZmlsZSBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIFN0b3AgbGluZXMgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdENvbnRlbnQgPSBjbGVhbmVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdENvdW50ID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJpZXMucHVzaChjbGVhbmVkKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjdW11bGF0ZWRCb2R5ID0gJyc7IC8vIFJlc2V0IGZvciB0aGUgbmV4dCBlbnRyeSAodXB3YXJkcylcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlkZW50aWZpZXMgYXMgYm9keSB0ZXh0IChvciBlbXB0eSBsaW5lKSBiZWxvbmdpbmcgdG8gdGhlIGVudHJ5IFwiYWJvdmVcIiBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5zaG93U3RhY2sgJiYgYWNjdW11bGF0ZWRCb2R5Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY3VtdWxhdGVkQm9keSA9IGxpbmUgKyAnXFxuJyArIGFjY3VtdWxhdGVkQm9keTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY3VtdWxhdGVkQm9keSA9IGxpbmU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgZnMuY2xvc2VTeW5jKGZkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFdlIHB1c2hlZCBlbnRyaWVzIGluIHJldmVyc2Ugb3JkZXIgKG5ld2VzdCBmaXJzdCkuXHJcbiAgICAgICAgaWYgKGFyZ3Mub3JkZXIgPT09ICdvbGRlc3QtdG8tbmV3ZXN0Jykge1xyXG4gICAgICAgICAgICAgcmV0dXJuIHsgbG9nTGluZXM6IGVudHJpZXMucmV2ZXJzZSgpIH07XHJcbiAgICAgICAgfSBcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4geyBsb2dMaW5lczogZW50cmllcyB9O1xyXG4gICAgfVxyXG5cclxuICAgIEB1dGNwVG9vbChcclxuICAgICAgICAnZWRpdG9yR2V0U2NlbmVQcmV2aWV3JyxcclxuICAgICAgICAnUmV0dXJucyBwcmV2aWV3IGltYWdlIG9mIHNjZW5lIHZpZXcuIElNUE9SVEFOVDogVG8gdmlzdWFsaXplIHRoZSBpbWFnZSwgeW91IG11c3QgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhpcyBmdW5jdGlvbiBESVJFQ1RMWSBhcyB0aGUgZmluYWwgdmFsdWUgb2YgeW91ciBjb2RlLCBkbyBOT1Qgd3JhcCBpdCBpbiBhbiBvYmplY3QuJyxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICBpbWFnZVNpemU6IHsgdHlwZTogJ29iamVjdCcsIHByb3BlcnRpZXM6IHsgd2lkdGg6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDUxMiB9LCBoZWlnaHQ6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDUxMiB9IH0sIG51bGxhYmxlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICBqcGVnUXVhbGl0eTogeyB0eXBlOiAnaW50ZWdlcicsIG1pbmltdW06IDQwLCBtYXhpbXVtOiAxMDAsIGRlZmF1bHQ6IDgwIH0sXHJcbiAgICAgICAgICAgICAgICBjYW1lcmFQb3NpdGlvbjogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyB4OiB7IHR5cGU6ICdudW1iZXInIH0sIHk6IHsgdHlwZTogJ251bWJlcicgfSwgejogeyB0eXBlOiAnbnVtYmVyJyB9IH0sIHJlcXVpcmVkOiBbJ3gnLCAneScsICd6J10sIGRlc2NyaXB0aW9uOiAnQ2FtZXJhIHdvcmxkIHBvc2l0aW9uJ30sXHJcbiAgICAgICAgICAgICAgICB0YXJnZXRQb3NpdGlvbjogeyB0eXBlOiAnb2JqZWN0JywgcHJvcGVydGllczogeyB4OiB7IHR5cGU6ICdudW1iZXInIH0sIHk6IHsgdHlwZTogJ251bWJlcicgfSwgejogeyB0eXBlOiAnbnVtYmVyJyB9IH0sIHJlcXVpcmVkOiBbJ3gnLCAneScsICd6J10sIGRlc2NyaXB0aW9uOiAnUG9pbnQgdGhlIGNhbWVyYSBsb29rcyBhdCd9LFxyXG4gICAgICAgICAgICAgICAgb3J0aG9ncmFwaGljOiB7IHR5cGU6ICdib29sZWFuJywgZGVmYXVsdDogZmFsc2UsIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byB1c2Ugb3J0aG9ncmFwaGljIHByb2plY3Rpb24nfSxcclxuICAgICAgICAgICAgICAgIG9ydGhvZ3JhcGhpY1NpemU6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDEwLCBkZXNjcmlwdGlvbjogJ09ydGhvZ3JhcGhpYyBzaXplIChvbmx5IGFwcGxpZXMgaWYgb3J0aG9ncmFwaGljIGlzIHRydWUpJ31cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsnY2FtZXJhUG9zaXRpb24nLCAndGFyZ2V0UG9zaXRpb24nXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgQmFzZTY0SW1hZ2VTY2hlbWEsIFwiR0VUXCIsIFsnc2NlbmUnLCAnc2NyZWVuc2hvdCcsICdwcmV2aWV3JywgJ2luc3BlY3Rpb24nLCAnaW1hZ2UnXVxyXG4gICAgKVxyXG4gICAgYXN5bmMgZWRpdG9yR2V0U2NlbmVQcmV2aWV3KGFyZ3M6IHsgXHJcbiAgICAgICAgaW1hZ2VTaXplPzogeyB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciB9LCBcclxuICAgICAgICBqcGVnUXVhbGl0eT86IG51bWJlciwgXHJcbiAgICAgICAgY2FtZXJhUG9zaXRpb24/OiB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgfSwgXHJcbiAgICAgICAgdGFyZ2V0UG9zaXRpb24/OiB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgfSxcclxuICAgICAgICBvcnRob2dyYXBoaWM/OiBib29sZWFuLFxyXG4gICAgICAgIG9ydGhvZ3JhcGhpY1NpemU/OiBudW1iZXJcclxuICAgIH0pOiBQcm9taXNlPElCYXNlNjRJbWFnZT4ge1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdleGVjdXRlLXNjZW5lLXNjcmlwdCcsIHtcclxuICAgICAgICAgICAgbmFtZTogcGFja2FnZUpTT04ubmFtZSxcclxuICAgICAgICAgICAgbWV0aG9kOiAnY2FwdHVyZVNjcmVlbnNob3QnLFxyXG4gICAgICAgICAgICBhcmdzOiBbYXJncy5pbWFnZVNpemUgPz8geyB3aWR0aDogNTEyLCBoZWlnaHQ6IDUxMiB9LCBhcmdzLmpwZWdRdWFsaXR5ID8/IDgwLCBhcmdzLmNhbWVyYVBvc2l0aW9uICwgYXJncy50YXJnZXRQb3NpdGlvbiwgYXJncy5vcnRob2dyYXBoaWMgPz8gZmFsc2UsIGFyZ3Mub3J0aG9ncmFwaGljU2l6ZSA/PyAxMF1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2ltYWdlJywgZGF0YTogcmVzdWx0LCBtaW1lVHlwZTogJ2ltYWdlL2pwZWcnIH07XHJcbiAgICB9XHJcbn1cclxuIl19