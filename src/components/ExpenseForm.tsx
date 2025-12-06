import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseCategory, Expense } from "@/types/expense";
import { Plus, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, "id" | "date">) => void;
  onStartInput?: () => void;
}

interface ExtractedExpense {
  amount: number | null;
  category: ExpenseCategory | null;
  description: string;
}

const suspiciousKeywords = ["gambling", "casino", "bet", "smoke", "cigarette", "alcohol", "liquor", "beer", "wine"];

// Category keywords mapping for NLP
const categoryKeywords: Record<ExpenseCategory, string[]> = {
  food: ["food", "eat", "lunch", "dinner", "breakfast", "burger", "pizza", "restaurant", "meal", "snack", "drink", "coffee", "tea"],
  stationary: ["stationary", "pen", "paper", "notebook", "book", "pencil", "stationery", "supplies"],
  clothes: ["clothes", "shirt", "pant", "dress", "shoe", "apparel", "clothing", "wear"],
  medicines: ["medicine", "tablet", "pill", "drug", "pharmacy", "health", "calpol", "dolo", "paracetamol"],
  transport: ["transport", "taxi", "uber", "bus", "train", "auto", "fuel", "gas", "bike", "car", "travel"],
  entertainment: ["entertainment", "movie", "cinema", "game", "music", "party", "concert", "show"],
  other: [],
};

// NLP function to extract expense data from voice input
const extractExpenseFromText = (text: string): ExtractedExpense => {
  const lowerText = text.toLowerCase();
  let amount: number | null = null;
  let category: ExpenseCategory | null = null;
  let description = text;

  // Extract amount (before or after rupees/rs/₹)
  const amountMatch = lowerText.match(
    /(?:rupees?|rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|₹)/
  );

  if (amountMatch) {
    amount = parseFloat(amountMatch[1] || amountMatch[2]);
  }

  // Check for suspicious categories
  const isSuspicious = suspiciousKeywords.some(keyword => lowerText.includes(keyword));

  // Extract category if not suspicious
  if (!isSuspicious) {
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (
        keywords.some((keyword) => {
          const regex = new RegExp(`\\b${keyword}\\b`, "i");
          return regex.test(lowerText);
        })
      ) {
        category = cat as ExpenseCategory;
        break;
      }
    }

  }

  // DO NOT default to "other" anymore
  // Category must remain null if unrecognized

  return {
    amount,
    category,
    description,
  };
};

export const ExpenseForm = ({ onAddExpense, onStartInput }: ExpenseFormProps) => {
  const [activeTab, setActiveTab] = useState<"manual" | "voice">("manual");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [description, setDescription] = useState("");

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setTranscript("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + transcript);
          } else {
            interim += transcript;
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Error capturing voice. Please try again.");
        setIsRecording(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition is not supported in your browser");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const checkSuspicious = (desc: string): boolean => {
    const lowerDesc = desc.toLowerCase();
    return suspiciousKeywords.some(keyword => lowerDesc.includes(keyword));
  };

  const processVoiceInput = () => {
    if (!transcript.trim()) {
      toast.error("No speech detected. Please try again.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const extracted = extractExpenseFromText(transcript);

      if (!extracted.amount) {
        toast.error("Could not extract amount from speech. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!extracted.category) {
        toast.error("Could not recognize the category. Please specify it clearly.");
        setIsProcessing(false);
        return;
      }

      const isSuspicious = checkSuspicious(extracted.description);

      onAddExpense({
        amount: extracted.amount,
        category: extracted.category,
        description: extracted.description,
        isSuspicious,
      });

      toast.success("Expense added from voice input!");
      setTranscript("");
      setActiveTab("manual");
      setIsProcessing(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    const isSuspicious = checkSuspicious(description);

    onAddExpense({
      amount: parseFloat(amount),
      category,
      description,
      isSuspicious,
    });

    setAmount("");
    setDescription("");
    toast.success("Expense added successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 px-4 font-medium transition-colors border-b-2 ${activeTab === "manual"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <div className="flex items-center justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Manual Entry
            </div>
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 py-3 px-4 font-medium transition-colors border-b-2 ${activeTab === "voice"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
          >
            <div className="flex items-center justify-center">
              <Mic className="w-5 h-5 mr-2" />
              Voice Entry (AI)
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 md:p-10">
          {activeTab === "manual" ? (
            // Manual Entry Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      onStartInput?.();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">🍔 Food</SelectItem>
                      <SelectItem value="stationary">📚 Stationary</SelectItem>
                      <SelectItem value="clothes">👕 Clothes</SelectItem>
                      <SelectItem value="medicines">💊 Medicines</SelectItem>
                      <SelectItem value="transport">🚗 Transport</SelectItem>
                      <SelectItem value="entertainment">🎮 Entertainment</SelectItem>
                      <SelectItem value="other">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What did you spend on?"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    onStartInput?.();
                  }}
                />
              </div>
              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          ) : (
            // Voice Entry Interface
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
              <div className="relative">
                {isRecording && <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>}
                <button
                  onClick={isRecording ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                    ? "bg-red-500 scale-110 shadow-lg shadow-red-200"
                    : isProcessing
                      ? "bg-blue-100"
                      : "bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-1"
                    } shadow-xl`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  ) : (
                    <Mic className={`w-12 h-12 ${isRecording ? "text-white animate-pulse" : "text-white"}`} />
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Tap to Speak"}
                </h3>
                <p className="text-gray-400 max-w-xs mx-auto">
                  Try saying: <span className="italic text-blue-600">"I spent 150 rupees on burgers for lunch"</span>
                </p>
              </div>

              {transcript && (
                <div className="w-full bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Transcript:</Label>
                    <p className="text-gray-700 mt-2">{transcript}</p>
                  </div>
                  <Button onClick={processVoiceInput} disabled={isProcessing} className="w-full">
                    {isProcessing ? "Processing..." : "Process & Add Expense"}
                  </Button>
                  <Button onClick={() => setTranscript("")} variant="outline" className="w-full" disabled={isProcessing}>
                    Clear & Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
