// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import { supabase } from "@/integrations/supabase/client";
// import { Wallet, Trash2 } from "lucide-react";

// interface BorrowRecord {
//   id: string;
//   lender_name: string;
//   amount: number;
//   date: string;
// }

// export const BorrowTracker = () => {
//   const [lenderName, setLenderName] = useState("");
//   const [amount, setAmount] = useState("");
//   const [date, setDate] = useState("");
//   const [records, setRecords] = useState<BorrowRecord[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchRecords();
//   }, []);

//   const fetchRecords = async () => {
//     const { data, error } = await supabase
//       .from("borrowed_from_others")
//       .select("*")
//       .order("date", { ascending: false });

//     if (error) {
//       console.error("Error fetching borrow records:", error);
//     } else {
//       setRecords(data || []);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error("User not authenticated");

//       const { error } = await supabase.from("borrowed_from_others").insert({
//         user_id: user.id,
//         lender_name: lenderName,
//         amount: parseFloat(amount),
//         date,
//       });

//       if (error) throw error;

//       toast.success("Borrow record added!");
//       setLenderName("");
//       setAmount("");
//       setDate("");
//       fetchRecords();
//     } catch (error: any) {
//       toast.error(error.message || "Failed to add record");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     try {
//       const { error } = await supabase
//         .from("borrowed_from_others")
//         .delete()
//         .eq("id", id);

//       if (error) throw error;

//       toast.success("Record deleted!");
//       fetchRecords();
//     } catch (error: any) {
//       toast.error(error.message || "Failed to delete record");
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Wallet className="h-5 w-5" />
//           Money Borrowed Tracker
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="lender">Lender's Name</Label>
//             <Input
//               id="lender"
//               type="text"
//               placeholder="Enter name"
//               value={lenderName}
//               onChange={(e) => setLenderName(e.target.value)}
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="borrow-amount">Amount (₹)</Label>
//             <Input
//               id="borrow-amount"
//               type="number"
//               step="0.01"
//               placeholder="0.00"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="borrow-date">Date</Label>
//             <Input
//               id="borrow-date"
//               type="date"
//               value={date}
//               onChange={(e) => setDate(e.target.value)}
//               required
//             />
//           </div>

//           <Button type="submit" className="w-full" disabled={loading}>
//             {loading ? "Adding..." : "Add Record"}
//           </Button>
//         </form>

//         {records.length > 0 && (
//           <div className="space-y-3">
//             <h3 className="font-semibold text-sm">Borrow History</h3>
//             <div className="space-y-2">
//               {records.map((record) => (
//                 <div
//                   key={record.id}
//                   className="flex items-center justify-between p-3 bg-muted rounded-lg"
//                 >
//                   <div>
//                     <p className="font-medium">{record.lender_name}</p>
//                     <p className="text-sm text-muted-foreground">
//                       ₹{record.amount} • {new Date(record.date).toLocaleDateString()}
//                     </p>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={() => handleDelete(record.id)}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };



import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HandCoins, Trash2, Plus, Mic, Loader2 } from "lucide-react";

interface BorrowRecord {
  id: string;
  lender_name: string;
  amount: number;
  date: string;
}

interface ExtractedBorrow {
  lender_name: string | null;
  amount: number | null;
}

// NLP function to extract borrow data from voice input
const extractBorrowFromText = (text: string): ExtractedBorrow => {
  const lowerText = text.toLowerCase();
  let lender_name: string | null = null;
  let amount: number | null = null;

  // Extract amount
  const amountMatch = lowerText.match(
    /(?:rupees?|rs\.?|₹)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|₹)/
  );

  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // Pattern: "from [name]"
  const fromMatch = lowerText.match(/(?:from)\s+([a-z]+)/i);
  if (fromMatch && fromMatch[1]) {
    lender_name = fromMatch[1].charAt(0).toUpperCase() + fromMatch[1].slice(1);
    return { lender_name, amount };
  }

  // Pattern: "[name] lent" or "[name] gave"
  const nameBeforeMatch = lowerText.match(/\b([a-z]+)\s+(?:lent|gave)\b/i);
  if (nameBeforeMatch && nameBeforeMatch[1]) {
    lender_name = nameBeforeMatch[1].charAt(0).toUpperCase() + nameBeforeMatch[1].slice(1);
    return { lender_name, amount };
  }

  // Try to extract word after amount like "500 rupees from rahul"
  if (!lender_name && amountMatch) {
    const afterAmount = lowerText.substring(lowerText.indexOf(amountMatch[0]) + amountMatch[0].length);
    const nameAfterAmount = afterAmount.match(/(?:from)\s+([a-z]+)/i);
    if (nameAfterAmount && nameAfterAmount[1]) {
      lender_name = nameAfterAmount[1].charAt(0).toUpperCase() + nameAfterAmount[1].slice(1);
    }
  }

  return { lender_name, amount };
};

export const BorrowTracker = () => {
  const [activeTab, setActiveTab] = useState<"manual" | "voice">("manual");
  const [lenderName, setLenderName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

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
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + t);
          } else {
            interim += t;
          }
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Error capturing voice. Please try again.");
        setIsRecording(false);
      };
    }
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("borrowed_from_others")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching borrow records:", error);
    } else {
      setRecords(data || []);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition is not supported in your browser");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const processVoiceInput = () => {
    if (!transcript.trim()) {
      toast.error("No speech detected. Please try again.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const extracted = extractBorrowFromText(transcript);

      if (!extracted.amount) {
        toast.error("Could not extract amount from speech. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (!extracted.lender_name) {
        toast.error("Could not extract lender name from speech. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (extracted.amount <= 0) {
        toast.error("Please provide a valid amount greater than 0");
        setIsProcessing(false);
        return;
      }

      setLenderName(extracted.lender_name);
      setAmount(extracted.amount.toString());
      setDate(new Date().toISOString().split("T")[0]);
      setTranscript("");
      setActiveTab("manual");
      setIsProcessing(false);
      toast.success("Details extracted! Review and submit.");
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("borrowed_from_others").insert({
        user_id: user.id,
        lender_name: lenderName,
        amount: parseFloat(amount),
        date,
      });

      if (error) throw error;

      toast.success("Borrow record added!");
      setLenderName("");
      setAmount("");
      setDate("");
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("borrowed_from_others")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Record deleted!");
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete record");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="h-5 w-5" />
          Money Borrowed Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 border-b">
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

        <div>
          {activeTab === "manual" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lender">Lender's Name</Label>
                <Input
                  id="lender"
                  type="text"
                  placeholder="Enter name"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrow-amount">Amount (₹)</Label>
                <Input
                  id="borrow-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrow-date">Date</Label>
                <Input
                  id="borrow-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Record"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
              <div className="relative">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                )}
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
                    <Mic
                      className={`w-12 h-12 ${isRecording ? "text-white animate-pulse" : "text-white"}`}
                    />
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {isRecording ? "Listening..." : isProcessing ? "Processing..." : "Tap to Speak"}
                </h3>
                <p className="text-gray-400 max-w-xs mx-auto">
                  Try saying: <span className="italic text-blue-600">"I borrowed 500 rupees from Rahul"</span>
                </p>
              </div>

              {transcript && (
                <div className="w-full bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Transcript:</Label>
                    <p className="text-gray-700 mt-2">{transcript}</p>
                  </div>
                  <Button
                    onClick={processVoiceInput}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Process & Add Record"}
                  </Button>
                  <Button
                    onClick={() => setTranscript("")}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Clear & Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Borrowing History</h3>
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{record.lender_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{record.amount} • {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};