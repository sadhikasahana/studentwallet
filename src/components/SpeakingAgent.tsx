import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeakingAgentProps {
    shouldSpeak: boolean;
}

export const SpeakingAgent = ({ shouldSpeak }: SpeakingAgentProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const message = "Hello! Hey there! Just a friendly reminder to record any expenses you might have had today. Keeping track helps you stay on top of your finances!";

    useEffect(() => {
        if (shouldSpeak) {
            setIsVisible(true);
            // Automatically start speaking when component mounts or shouldSpeak becomes true
            setTimeout(() => speak(), 300);
        } else {
            // Stop speaking and hide when shouldSpeak becomes false
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            setIsVisible(false);
        }
    }, [shouldSpeak]);

    const speak = () => {
        if (!window.speechSynthesis) {
            console.warn("Speech synthesis not supported");
            return;
        }

        window.speechSynthesis.cancel(); // Cancel any ongoing speech

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    const handleRepeat = () => {
        speak();
    };

    const handleDismiss = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="w-full bg-yellow-50 border-b-2 border-yellow-300">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900">Speaking Reminder</h3>
                            <p className="text-sm text-yellow-800">{message} <span className="ml-1"></span></p>
                            {isSpeaking && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-block w-1.5 h-2.5 bg-yellow-600 rounded-full animate-bounce" />
                                    <span className="inline-block w-1.5 h-2.5 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                    <span className="inline-block w-1.5 h-2.5 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                    <span className="text-xs text-yellow-700 font-medium ml-1">Speaking...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            onClick={handleRepeat}
                            size="sm"
                            variant="outline"
                            className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                        >
                            Speak
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            Dismiss
                        </Button>
                        <button
                            onClick={handleDismiss}
                            aria-label="close reminder"
                            className="text-yellow-500 hover:text-yellow-700 ml-2"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

