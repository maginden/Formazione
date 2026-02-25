import React, { useState } from 'react';
import { Card, Button, Spinner, TextToSpeechButton } from './Shared';
import { TOV_QUIZ } from '../constants';
import { rewriteTextToV } from '../services/geminiService';
import { UserProgress } from '../types';

interface Props {
  onComplete: (score: number) => void;
  progress: UserProgress;
}

const ModuleToV: React.FC<Props> = ({ onComplete, progress }) => {
  const [step, setStep] = useState<'theory' | 'quiz' | 'practice'>('theory');
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Practice State
  const [inputText, setInputText] = useState("Il nostro servizio clienti è disponibile dalle 9 alle 18.");
  const [selectedTone, setSelectedTone] = useState("Empatico");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuizAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const currentQ = TOV_QUIZ[quizIndex];
    if (optionIndex === currentQ.correctAnswer) {
      setScore(s => s + 10);
      setFeedback(`Corretto! ${currentQ.explanation}`);
    } else {
      setFeedback(`Sbagliato. ${currentQ.explanation}`);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    setSelectedOption(null);
    if (quizIndex < TOV_QUIZ.length - 1) {
      setQuizIndex(i => i + 1);
    } else {
      setStep('practice');
    }
  };

  const handleRewrite = async () => {
    setLoading(true);
    try {
      const result = await rewriteTextToV(inputText, selectedTone);
      setAiResult(result);
    } catch (e) {
      setAiResult("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-blue">Modulo 1: Tono di Voce</h2>
        <span className="text-sm font-medium bg-brand-blueLight text-brand-blue px-3 py-1 rounded-full">
          Punti: {score + progress.tovScore}
        </span>
      </div>

      {step === 'theory' && (
        <Card>
          <h3 className="text-xl font-semibold mb-4">I 4 Pilastri del Tono di Voce</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="font-bold block text-brand-blue">Volume</span>
              Quanto "forte" parla il brand? È discreto o urla per farsi notare?
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="font-bold block text-brand-blue">Ritmo</span>
              La velocità del discorso. Veloce = dinamismo/urgenza. Lento = calma/riflessione.
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="font-bold block text-brand-blue">Pausa</span>
              Il silenzio è potente. Le pause creano attesa ed enfasi.
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <span className="font-bold block text-brand-blue">Intonazione</span>
              La "melodia" della voce. Può essere monotona (autorevole/robotica) o variata (espressiva).
            </div>
          </div>
          <div className="mt-6 text-right">
            <Button onClick={() => setStep('quiz')}>Vai al Quiz</Button>
          </div>
        </Card>
      )}

      {step === 'quiz' && (
        <Card>
          <h3 className="text-lg font-medium mb-2">Domanda {quizIndex + 1}/{TOV_QUIZ.length}</h3>
          <p className="text-xl mb-6">{TOV_QUIZ[quizIndex].question}</p>
          <div className="space-y-3">
            {TOV_QUIZ[quizIndex].options.map((opt, idx) => {
              const isAnswered = feedback !== null;
              const isCorrect = idx === TOV_QUIZ[quizIndex].correctAnswer;
              const isSelected = selectedOption === idx;

              let baseClass = "w-full text-left p-4 rounded-lg border transition-all duration-300 relative flex items-center justify-between";
              let stateClass = "bg-white hover:bg-slate-50 border-slate-200";

              if (isAnswered) {
                if (isCorrect) {
                  stateClass = "bg-green-50 border-green-500 text-green-800 shadow-md transform scale-[1.01]";
                  if (isSelected) stateClass += " animate-pulse-green";
                } else if (isSelected) {
                  stateClass = "bg-red-50 border-red-300 text-red-800 opacity-80";
                } else {
                  stateClass = "bg-slate-50 border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleQuizAnswer(idx)}
                  className={`${baseClass} ${stateClass}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && (
                    <span className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full text-white text-sm animate-check ml-2">
                      ✓
                    </span>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <span className="text-red-500 ml-2">✕</span>
                  )}
                </button>
              );
            })}
          </div>
          {feedback && (
            <div className="mt-6 p-4 bg-brand-sageLight rounded-lg border border-brand-sage animate-slideUp">
              <p className="font-medium">{feedback}</p>
              <div className="mt-4 text-right">
                <Button onClick={nextQuestion}>
                  {quizIndex < TOV_QUIZ.length - 1 ? "Prossima Domanda" : "Vai alla Pratica"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 'practice' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4">Laboratorio AI: Riscrittura Tono</h3>
            <p className="text-slate-600 mb-4">Osserva come cambia la percezione di un messaggio modificando solo il Tono di Voce.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Testo Neutro</label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Seleziona Tono Target</label>
              <div className="flex gap-2 flex-wrap">
                {["Luxury/Esclusivo", "Empatico/Caldo", "Energico/Urgente", "Istituzionale"].map(tone => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTone === tone 
                        ? "bg-brand-blue text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleRewrite} disabled={loading || !inputText}>
              {loading ? "L'AI sta riscrivendo..." : "Riscrivi con AI"}
            </Button>
          </Card>

          {loading && <Spinner />}

          {aiResult && (
            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100 relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-brand-blue">Risultato AI:</h4>
                <TextToSpeechButton text={aiResult} tone={selectedTone} />
              </div>
              <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                {aiResult}
              </div>
              <div className="mt-6 pt-6 border-t border-blue-100 text-right">
                 <Button variant="secondary" onClick={() => onComplete(score)}>Concludi Modulo</Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleToV;