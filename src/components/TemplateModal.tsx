import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ReconcileConfig, SavedTemplate } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: SavedTemplate[];
  currentConfig: ReconcileConfig;
  currentFile1Text: string;
  currentFile2Text: string;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (template: SavedTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  currentConfig,
  currentFile1Text,
  currentFile2Text,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    onSaveTemplate(templateName.trim());
    setTemplateName('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="bg-white shadow-lg w-full max-w-lg border border-zinc-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-wide uppercase">Templates</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <form onSubmit={handleSave} className="space-y-2">
            <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Save Current Layout</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 text-xs bg-white border border-zinc-300 px-3 py-2 focus:border-black focus:ring-0 outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
              >
                Save
              </button>
            </div>
            {successMsg && (
              <p className="text-[10px] text-zinc-600 font-medium flex items-center pt-1">
                <Check className="w-3 h-3 mr-1" /> Saved to localStorage
              </p>
            )}
          </form>

          <div className="space-y-3 pt-2">
            <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Saved Templates ({templates.length})</h3>
            {templates.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">No saved templates yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="flex items-center justify-between p-3 border border-zinc-200 hover:border-black transition-colors">
                    <div>
                      <h4 className="text-xs font-medium text-black">{tpl.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Match: {tpl.config.matchType} | Strategy: {tpl.config.multiMatchStrategy}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { onLoadTemplate(tpl); onClose(); }} className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-black text-[11px] font-medium transition-colors">
                        Load
                      </button>
                      <button onClick={() => onDeleteTemplate(tpl.id)} className="px-2 py-1 text-zinc-400 hover:text-red-600 transition-colors text-[11px]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
