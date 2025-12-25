import { useState, useEffect } from 'react';
import { getUserContestHistory, getContestQuestions, getReplayEvents } from './api';
import { analyzeEvents, CheatReport } from './analysis';

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [expandedContest, setExpandedContest] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, CheatReport>>({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'u' && pathParts[2]) {
      setUsername(pathParts[2]);
    }
  }, []);

  const handleScan = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const contests = await getUserContestHistory(username);
      setHistory(contests);
      setExpandedContest(null); 
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

 
  const handleAnalyzeContest = async (contestSlug: string) => {
    if (expandedContest === contestSlug) {
      setExpandedContest(null); 
      return;
    }
    
    setExpandedContest(contestSlug);
    setAnalyzing(true);
    setAnalysisResults({}); 

    try {
      const questions = await getContestQuestions(contestSlug);
      console.log("Questions Found:", questions); 

      const results: Record<string, CheatReport> = {};
      
      
      await Promise.all(questions.map(async (q: any) => {
        console.log(` Fetching Replay: ${q.titleSlug}`); 
        
        const events = await getReplayEvents(username!, contestSlug, q.titleSlug);
        
        console.log(`Result for ${q.titleSlug}: ${events.length} events`);
        console.log(events);
        results[q.titleSlug] = analyzeEvents(events);
      }));
      console.log("details of ques : ",questions);
      setAnalysisResults(results);

    } catch (err) {
      console.error("Analysis failed", err);
    }
    setAnalyzing(false);
  };

  if (!username) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700 w-96 font-sans max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-green-400">🕵️ Detective</h2>
        <span className="text-xs text-gray-400">Target: {username}</span>
      </div>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors font-medium disabled:opacity-50 mb-2 shrink-0"
      >
        {loading ? "Scanning..." : "Scan Contest History"}
      </button>

      {/* Scrollable Results */}
      <div className="overflow-y-auto flex-1 space-y-2 pr-1">
        {history.map((item: any) => {
            const isExpanded = expandedContest === item.contest.titleSlug;
            
            return (
              <div key={item.contest.titleSlug} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                {/* Contest Header - Clickable */}
                <div 
                  className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => handleAnalyzeContest(item.contest.titleSlug)}
                >
                  <span className="font-bold text-sm text-gray-200">{item.contest.title}</span>
                  <span className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400">
                     #{item.ranking}
                  </span>
                </div>

                {/* Expanded Analysis Area */}
                {isExpanded && (
                  <div className="bg-black p-3 space-y-2 border-t border-gray-700">
                    {analyzing ? (
                        <div className="text-center text-xs text-gray-400 animate-pulse">Running Analysis...</div>
                    ) : (
                        Object.entries(analysisResults).map(([qTitle, report]) => (
                            <div key={qTitle} className="text-xs flex flex-col mb-2">
                                <div className="flex justify-between font-bold">
                                    <span className="text-gray-400 w-1/3 truncate" title={qTitle}>{qTitle}</span>
                                    <span className={report.color}>{report.status}</span>
                                </div>
                                <div className="text-gray-500 pl-2">
                                    {report.details.map((d, i) => <div key={i}>• {d}</div>)}
                                </div>
                            </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
}

export default App;