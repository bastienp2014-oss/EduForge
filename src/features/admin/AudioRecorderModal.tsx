import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Upload, X, Loader2 } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AudioRecorderModalProps {
  item: any;
  tabId: string;
  onClose: () => void;
  onSave: (audioUrl: string) => void;
}

export default function AudioRecorderModal({ item, tabId, onClose, onSave }: AudioRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobChunk[]>([]);

  // We define the type of chunk because MediaRecorder returns Blob chunks
  type BlobChunk = Blob;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Erreur d'accès au microphone. Assurez-vous d'avoir accordé les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    try {
      // Create a unique filename
      const filename = `audio/${tabId}/${item.id || Date.now()}_${Date.now()}.webm`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, audioBlob);
      const url = await getDownloadURL(storageRef);
      
      onSave(url);
    } catch (err) {
      console.error("Error uploading audio", err);
      alert("Erreur lors de l'upload de l'audio.");
    } finally {
      setIsUploading(false);
    }
  };

  const currentAudio = item.audioUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-xl">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-400" />
            Enregistrement Audio
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <p className="text-sm text-slate-500 mb-1">Élément sélectionné :</p>
             <p className="font-bold text-slate-800 test-lg">
               {item.mot || item.question || item.anglicisme || item.expression || item.texte || "Item"}
             </p>
          </div>

          <div className="flex flex-col items-center gap-4">
             {isRecording ? (
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                   <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105">
                     <Square className="w-8 h-8 fill-current" />
                   </button>
                </div>
             ) : (
                <button onClick={startRecording} className="w-20 h-20 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-600 hover:text-blue-600 border-2 border-slate-200 hover:border-blue-300 transition-all hover:scale-105">
                   <Mic className="w-8 h-8" />
                </button>
             )}
             <p className="text-slate-500 font-medium text-sm">
               {isRecording ? "Enregistrement en cours..." : "Appuyez pour enregistrer"}
             </p>
          </div>

          {audioBlob && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-4">
              <p className="text-sm font-bold text-indigo-800">Aperçu :</p>
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Upload en cours...</>
                ) : (
                  <><Upload className="w-5 h-5" /> Sauvegarder l'audio</>
                )}
              </button>
            </div>
          )}

          {!audioBlob && currentAudio && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-slate-700">Audio actuel :</p>
              <audio controls src={currentAudio} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
