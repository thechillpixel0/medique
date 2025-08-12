import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Save, Trash2, Play, Pause } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { supabase } from '../lib/supabase';

interface VoiceNoteRecorderProps {
  consultationId: string;
  doctorId: string;
  onNoteSaved?: (note: any) => void;
  className?: string;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  consultationId,
  doctorId,
  onNoteSaved,
  className = ''
}) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [noteType, setNoteType] = useState<'general' | 'symptoms' | 'diagnosis' | 'prescription' | 'follow_up'>('general');

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    onResult: (text, isFinal) => {
      if (isFinal) {
        setCurrentTranscript(prev => prev + ' ' + text);
      }
    }
  });

  useEffect(() => {
    setCurrentTranscript(transcript);
  }, [transcript]);

  const saveNote = async () => {
    if (!currentTranscript.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .insert({
          consultation_id: consultationId,
          doctor_id: doctorId,
          note_type: noteType,
          content: currentTranscript.trim(),
          is_voice_generated: true,
          voice_confidence_score: 0.95 // Mock confidence score
        })
        .select()
        .single();

      if (error) throw error;

      // Also save to voice_transcriptions table
      await supabase
        .from('voice_transcriptions')
        .insert({
          consultation_id: consultationId,
          doctor_id: doctorId,
          transcribed_text: currentTranscript.trim(),
          confidence_score: 0.95,
          language_code: 'en-US',
          processing_status: 'completed'
        });

      setSavedNotes(prev => [data, ...prev]);
      setCurrentTranscript('');
      resetTranscript();
      
      if (onNoteSaved) onNoteSaved(data);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'Voice note saved successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearTranscript = () => {
    setCurrentTranscript('');
    resetTranscript();
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <MicOff className="h-12 w-12 mx-auto mb-4" />
            <p>Voice recognition is not supported in this browser.</p>
            <p className="text-sm mt-2">Please use Chrome, Edge, or Safari for voice features.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Voice Notes</h3>
          <div className="flex items-center space-x-2">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="general">General</option>
              <option value="symptoms">Symptoms</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="prescription">Prescription</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? 'danger' : 'primary'}
            size="lg"
            className={`${isListening ? 'animate-pulse' : ''}`}
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {/* Status Indicator */}
        {isListening && (
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              Listening...
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Current Transcript:
          </label>
          <div className="min-h-[100px] p-3 border border-gray-300 rounded-lg bg-gray-50">
            <p className="text-gray-900">
              {currentTranscript}
              {interimTranscript && (
                <span className="text-gray-500 italic">{interimTranscript}</span>
              )}
            </p>
            {!currentTranscript && !interimTranscript && (
              <p className="text-gray-400 italic">
                Click "Start Recording" and begin speaking...
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={saveNote}
            disabled={!currentTranscript.trim() || saving}
            loading={saving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Note
          </Button>
          <Button
            onClick={clearTranscript}
            variant="outline"
            disabled={!currentTranscript.trim()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentTranscript(prev => prev + ' Patient presents with ');
                setNoteType('symptoms');
              }}
            >
              + Symptoms
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentTranscript(prev => prev + ' Diagnosis: ');
                setNoteType('diagnosis');
              }}
            >
              + Diagnosis
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentTranscript(prev => prev + ' Prescribed: ');
                setNoteType('prescription');
              }}
            >
              + Prescription
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentTranscript(prev => prev + ' Follow-up in ');
                setNoteType('follow_up');
              }}
            >
              + Follow-up
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};