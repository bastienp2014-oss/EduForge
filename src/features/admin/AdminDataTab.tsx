import React, { useState } from "react";
import { Mic, Edit2, Save, Search, Sparkles } from "lucide-react";
import { useAdminTheme } from "../../store/useAdminTheme";
import { useAppConfig } from "../../store/useAppConfig";
import AudioRecorderModal from "./AudioRecorderModal";
import DataGeneratorModal from "./DataGeneratorModal";
import AccessibleDataViewer from "./AccessibleDataViewer";

interface AdminDataTabProps {
  activeTab: string;
  dataList: any[];
  setDataList: (data: any[]) => void;
  isDark: boolean;
}

export default function AdminDataTab({ activeTab, dataList, setDataList, isDark }: AdminDataTabProps) {
  const { theme } = useAdminTheme();
  const { tags: availableTags } = useAppConfig();
  
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "none" | "urgence" | number>("all");
  const [showMifiGuide, setShowMifiGuide] = useState(false);
  const [editingItem, setEditingItem] = useState<{ originalIndex: number; data: string } | null>(null);
  const [recordingItem, setRecordingItem] = useState<{ item: any } | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const handleSaveGeneratedData = (newData: any[]) => {
    setDataList([...dataList, ...newData]);
    setShowAIGenerator(false);
  };

  const handleSaveAudio = (audioUrl: string) => {
    if (!recordingItem) return;
    const { _originalIndex, ...rest } = recordingItem.item;
    const updatedItem = { ...rest, audioUrl };

    const newList = [...dataList];
    newList[_originalIndex - 1] = updatedItem;
    setDataList(newList);
    setRecordingItem(null);
  };

  const startEdit = (item: any) => {
    const { _originalIndex, ...rest } = item;
    setEditingItem({
      originalIndex: _originalIndex,
      data: JSON.stringify(rest, null, 2),
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    try {
      const parsed = JSON.parse(editingItem.data);
      const newList = [...dataList];
      newList[editingItem.originalIndex - 1] = parsed;
      setDataList(newList);
      setEditingItem(null);
    } catch (err) {
      alert("JSON invalide. Veuillez vérifier la syntaxe.");
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(dataList, null, 2));
    alert("Données copiées dans le presse-papier !");
  };

  const updateItemLevel = (item: any, newLevelStr: string) => {
    const parsed = { ...item };
    delete parsed._originalIndex;
    if (newLevelStr === "none") {
      delete parsed.niveau;
    } else if (newLevelStr === "urgence") {
      parsed.niveau = "urgence";
    } else {
      parsed.niveau = parseInt(newLevelStr) || undefined;
    }

    const newList = [...dataList];
    newList[item._originalIndex - 1] = parsed;
    setDataList(newList);
  };

  const toggleItemTag = (item: any, tagId: string) => {
    const parsed = { ...item };
    delete parsed._originalIndex;

    if (!parsed.tags) parsed.tags = [];
    if (parsed.tags.includes(tagId)) {
      parsed.tags = parsed.tags.filter((t: string) => t !== tagId);
    } else {
      parsed.tags.push(tagId);
    }

    if (parsed.tags.length === 0) delete parsed.tags;

    const newList = [...dataList];
    newList[item._originalIndex - 1] = parsed;
    setDataList(newList);
  };

  const dataWithIndex = Object.values(dataList).map((item: any, i) => ({
    ...item,
    _originalIndex: i + 1,
  }));
  const filtered = dataWithIndex.filter((item) => {
    if (levelFilter === "none" && item.niveau) return false;
    if (levelFilter === "urgence" && item.niveau !== "urgence") return false;
    if (typeof levelFilter === "number" && item.niveau != levelFilter)
      return false;

    const q = search.toLowerCase();
    return Object.entries(item).some(
      ([k, val]) =>
        k !== "_originalIndex" &&
        typeof val === "string" &&
        val.toLowerCase().includes(q),
    );
  });

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden" style={{ backgroundColor: theme.colors.bg }}>
      <div
        className="px-4 sm:px-6 py-4 border-b flex flex-col gap-4 shrink-0"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-xl pl-10 pr-4 py-2 outline-none bg-slate-50 border-slate-200 focus:border-blue-400 transition-colors text-slate-800"
              />
            </div>
            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "all" || val === "none" || val === "urgence") {
                    setLevelFilter(val);
                  } else {
                    setLevelFilter(parseInt(val));
                  }
                }}
                className="w-full sm:w-auto border rounded-xl px-4 py-2 font-medium outline-none bg-slate-50 border-slate-200 text-slate-800"
              >
                <option value="all">Tous les niveaux</option>
                <option value="none">Non classés</option>
                <option value="urgence">Urgence</option>
                <option value="1">Niveau 1</option>
                <option value="2">Niveau 2</option>
                <option value="3">Niveau 3</option>
                <option value="4">Niveau 4</option>
                <option value="5">Niveau 5</option>
                <option value="6">Niveau 6</option>
                <option value="7">Niveau 7</option>
                <option value="8">Niveau 8</option>
              </select>
            </div>
            <button
              onClick={() => setShowMifiGuide(!showMifiGuide)}
              className="text-xs font-bold px-3 py-2 rounded-xl transition-colors hover:bg-blue-100 bg-blue-50 text-blue-600"
            >
              Critères MIFI ?
            </button>
            <button
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              <Sparkles size={18} />
              <span className="hidden sm:inline">Générer (IA)</span>
            </button>
          </div>

          <button
            onClick={handleCopyAll}
            className="w-full sm:w-auto px-4 py-2 font-bold rounded-xl transition-colors hover:opacity-90 flex items-center justify-center gap-2 bg-slate-900 text-white"
          >
            <Save className="w-5 h-5" />
            Copier JSON
          </button>
        </div>

        {showMifiGuide && (
          <div className="border p-4 rounded-xl text-sm space-y-2 w-full bg-blue-50 border-blue-200 text-blue-900">
            <h4 className="font-bold flex items-center gap-2">
              <span className="text-xl">📊</span> Guide de classification MIFI
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Urgence :</strong> Survie basique (Ex: Hôpital, Police)</li>
              <li><strong>Niveau 1-4 (Débutant) :</strong> Vocabulaire quotidien, présent/passe-composé simples.</li>
              <li><strong>Niveau 5-6 (Intermédiaire) :</strong> Autonomie professionnelle, nuances culturelles.</li>
              <li><strong>Niveau 7-8 (Avancé) :</strong> Maîtrise subtile, humour, sacres complexes, jargon.</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {filtered.map((item) => (
            <div key={item.id || item._originalIndex} className="relative bg-white p-4 pl-4 pt-12 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-1 flex items-center justify-center">
                  #{item._originalIndex}
                </span>
                {item.niveau ? (
                  <span className="text-xs font-bold text-white bg-blue-600 rounded-lg px-2 py-1 flex items-center justify-center" title={`Niveau ${item.niveau}`}>
                    {item.niveau}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 rounded-lg px-2 py-1 flex items-center justify-center" title="Non classé">
                    ?
                  </span>
                )}
              </div>
              <div className="absolute right-14 top-2 flex items-center gap-1">
                <button
                  onClick={() => setRecordingItem({ item })}
                  className={`p-1.5 rounded-lg transition-colors ${item.audioUrl ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                  title={item.audioUrl ? "Audio existant - Modifier" : "Enregistrer Audio"}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <select
                  value={item.niveau || "none"}
                  onChange={(e) => updateItemLevel(item, e.target.value)}
                  className="text-xs bg-slate-100 border border-slate-200 text-slate-600 rounded p-1 outline-none font-bold"
                >
                  <option value="none">Aucun niveau</option>
                  <option value="urgence">Urgence</option>
                  <option value="1">Niveau 1</option>
                  <option value="2">Niveau 2</option>
                  <option value="3">Niveau 3</option>
                  <option value="4">Niveau 4</option>
                  <option value="5">Niveau 5</option>
                  <option value="6">Niveau 6</option>
                  <option value="7">Niveau 7</option>
                  <option value="8">Niveau 8</option>
                </select>
              </div>
              <button
                onClick={() => startEdit(item)}
                className="absolute right-3 top-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Éditer"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {editingItem?.originalIndex === item._originalIndex ? (
                <div className="mt-2">
                  <textarea
                    className="w-full h-48 font-mono text-sm bg-slate-900 text-slate-200 p-4 rounded-xl"
                    value={editingItem.data}
                    onChange={(e) => setEditingItem({ ...editingItem, data: e.target.value })}
                  />
                  <div className="flex gap-2 mt-4 justify-end">
                    <button onClick={() => setEditingItem(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">
                      Annuler
                    </button>
                    <button onClick={handleSaveEdit} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                      <Save className="w-4 h-4" /> Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="text-xs font-bold text-slate-400">Tags:</span>
                    {availableTags?.map((tag) => {
                      const isActive = (item.tags || []).includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleItemTag(item, tag.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isActive ? "font-bold" : "opacity-50 hover:opacity-100"}`}
                          style={{
                            backgroundColor: isActive
                              ? `color-mix(in srgb, ${tag.color || "#ccc"} 15%, transparent)`
                              : "transparent",
                            color: isActive ? tag.color || "#333" : "#888",
                            borderColor: isActive ? tag.color || "#ccc" : "#eee",
                          }}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                  <AccessibleDataViewer data={item} />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-slate-200 font-medium">
              Aucun résultat pour cette recherche
            </div>
          )}
        </div>
      </div>

      {recordingItem && (
        <AudioRecorderModal
          item={recordingItem.item}
          tabId={activeTab}
          onClose={() => setRecordingItem(null)}
          onSave={handleSaveAudio}
        />
      )}

      {showAIGenerator && (
        <DataGeneratorModal
          tabId={activeTab}
          sampleItem={dataList[0]}
          onClose={() => setShowAIGenerator(false)}
          onSave={handleSaveGeneratedData}
        />
      )}
    </div>
  );
}
