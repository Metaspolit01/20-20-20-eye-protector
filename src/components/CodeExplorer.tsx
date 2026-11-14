import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Terminal, FolderTree } from 'lucide-react';
import { ANDROID_PROJECT_FILES, downloadAndroidProjectZip } from '../utils/androidProjectZip';

export const CodeExplorer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState(ANDROID_PROJECT_FILES[7].path); // ScreenTimeEngine.kt
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedFile =
    ANDROID_PROJECT_FILES.find((f) => f.path === selectedFilePath) || ANDROID_PROJECT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAndroidProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">
              Native Android Studio Project Explorer
            </h2>
            <p className="text-[11px] text-slate-400">
              Clean Architecture Kotlin Source Files & Gradle DSL for SDK 36
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/60"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Zipping Project...' : 'Download Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Terminal Command Quick Reference */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs font-mono space-y-2">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>Quick Build & ADB Commands for Samsung SM-M156B:</span>
        </div>
        <div className="space-y-1 text-slate-300 text-[11px]">
          <p>
            <span className="text-slate-500"># 1. Compile Debug APK:</span> <code className="text-emerald-400">./gradlew assembleDebug</code>
          </p>
          <p>
            <span className="text-slate-500"># 2. Sideload to Galaxy M15:</span> <code className="text-emerald-400">adb install -r app/build/outputs/apk/debug/app-debug.apk</code>
          </p>
          <p>
            <span className="text-slate-500"># 3. Compile Release APK:</span> <code className="text-emerald-400">./gradlew assembleRelease</code>
          </p>
        </div>
      </div>

      {/* Two Column Layout: File Tree & Code Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[440px]">
        {/* File Tree List */}
        <div className="md:col-span-4 rounded-xl bg-slate-950 border border-slate-800 p-2 space-y-1 max-h-[460px] overflow-y-auto text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
            Project Files ({ANDROID_PROJECT_FILES.length})
          </p>
          {ANDROID_PROJECT_FILES.map((file) => {
            const isSelected = file.path === selectedFilePath;
            const fileName = file.path.split('/').pop();
            const dir = file.path.split('/').slice(0, -1).join('/');
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-start gap-2 ${
                  isSelected
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 mt-0.5 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] font-semibold truncate text-white">{fileName}</p>
                  <p className="text-[9px] text-slate-500 truncate">{dir || 'root'}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-8 rounded-xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="min-w-0">
              <span className="font-mono font-bold text-cyan-300 truncate text-[11px]">
                {selectedFile.path}
              </span>
              <p className="text-[10px] text-slate-400 truncate">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="flex-1 p-4 overflow-x-auto overflow-y-auto max-h-[400px] text-[11px] font-mono text-slate-200 leading-relaxed bg-[#060d17]">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
