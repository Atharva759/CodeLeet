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
      
      const pageNum = Math.ceil(item.ranking / 25);
      const replayUrl = `https://leetcode.com/contest/${item.contest.titleSlug}/ranking/${pageNum}/?region=global_v2`;
      
      return (
        <div key={item.contest.titleSlug} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
          
          {/* Header Row */}
          <div className="p-3 flex justify-between items-center">
            
            {/* Title  */}
            <div 
              className="cursor-pointer hover:text-green-400 transition-colors flex-1"
              onClick={() => handleAnalyzeContest(item.contest.titleSlug)}
            >
              <span className="font-bold text-sm text-gray-200 block">{item.contest.title}</span>
            </div>

            {/* Right Side: Rank + Watch Button */}
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400">
                 #{item.ranking}
              </span>
              
              {/* --- 2. The Link Button --- */}
              <a 
                href={replayUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors no-underline flex items-center gap-1"
                title="Open LeetCode Replay Page"
                onClick={(e) => e.stopPropagation()} // Stop it from expanding the card when clicking the link
              >
                📺
              </a>
            </div>

          </div>

          {/* Expanded Analysis Area  */}
          {isExpanded && (
            <div className="bg-black p-3 space-y-2 border-t border-gray-700">
               {analyzing ? (
                  /* Loading State */
                  <div className="text-center text-xs text-gray-400 animate-pulse py-2">
                    Running Analysis...
                  </div>
               ) : (
                  /* Results List */
                  Object.entries(analysisResults).map(([qTitle, report]) => (
                      <div key={qTitle} className="text-xs flex flex-col mb-3">
                          {/* Question Title & Status */}
                          <div className="flex justify-between font-bold items-center">
                              <span className="text-gray-300 w-2/3 truncate pr-2" title={qTitle}>
                                {qTitle}
                              </span>
                              <span className={`${report.color} whitespace-nowrap`}>
                                {report.status}
                              </span>
                          </div>
                          
                          {/* Details (Bullets) */}
                          {report.details.length > 0 && (
                            <div className="text-gray-500 pl-2 mt-1 border-l-2 border-gray-800 ml-1">
                                {report.details.map((d, i) => (
                                  <div key={i} className="leading-tight py-0.5">• {d}</div>
                                ))}
                            </div>
                          )}
                      </div>
                  ))
               )}
               
               {/* Empty State Check */ }
               {!analyzing && Object.keys(analysisResults).length === 0 && (
                 <div className="text-gray-500 text-xs text-center">No results found.</div>
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