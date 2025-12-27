import { useState, useEffect } from 'react';
import { getUserContestHistory, getContestQuestions, getReplayEvents } from './api';
import { analyzeEvents, CheatReport } from './analysis';
import detectiveLogo from "../assests/logo.png"
function App() {


  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const [username, setUsername] = useState<string | null>(null);
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedContest, setExpandedContest] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, CheatReport>>({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const pathParts = window.location.pathname.split('/');
      if (pathParts[1] === 'u' && pathParts[2]) {
        setUsername(pathParts[2]);
      } else {
        setUsername(null);
        setIsOpen(false);
      }
    };
    
    checkUser();
    
    window.addEventListener('popstate', checkUser);
    return () => window.removeEventListener('popstate', checkUser);
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
      const results: Record<string, CheatReport> = {};
      
      await Promise.all(questions.map(async (q: any) => {
        const events = await getReplayEvents(username!, contestSlug, q.titleSlug);
        results[q.titleSlug] = analyzeEvents(events);
      }));

      setAnalysisResults(results);
    } catch (err) {
      console.error("Analysis failed", err);
    }
    setAnalyzing(false);
  };

  if (!username) return null;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gray-900 hover:bg-gray-800 text-white p-0 w-16 h-16 rounded-full shadow-2xl border-2 border-green-500 transition-transform hover:scale-110 flex items-center justify-center group overflow-hidden"
        title="Open LeetCode Detective"
      >
        <img 
          src={detectiveLogo} 
          alt="Detective Logo" 
          className="w-full h-full object-cover"
        />

      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-fade-in-up">
      
      {/* The Main Card */}
      <div className="bg-gray-900 text-white w-96 rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-bold text-gray-100 text-sm leading-tight">CodeLeet</h2>
              <p className="text-xs text-green-400 font-mono">@{username}</p>
            </div>
          </div>  
          
          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1">
          
          {/* MODULE: Contest Scanner */}
          <div className="mb-4">
             <div className="flex justify-between items-end mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contest History</h3>
                {history.length > 0 && (
                   <span className="text-xs text-gray-500">{history.length} found</span>
                )}
             </div>

             <button
                onClick={handleScan}
                disabled={loading}
                className={`w-full py-2 rounded font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2
                  ${loading 
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                  }`}
              >
                {loading ? (
                   <>Processing...</>
                ) : (
                   <> Scan Last 5 Contests</>
                )}
             </button>
          </div>

          {/* Results List */}
          <div className="space-y-3">
             {history.map((item: any) => {
                 const isExpanded = expandedContest === item.contest.titleSlug;
                 const pageNum = Math.ceil(item.ranking / 25);
                 const replayUrl = `https://leetcode.com/contest/${item.contest.titleSlug}/ranking/${pageNum}/?region=global_v2`;
                 
                 return (
                   <div key={item.contest.titleSlug} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-sm transition-all hover:border-gray-500">
                     
                     {/* Card Header */}
                     <div className="p-3 flex justify-between items-center">
                       <div 
                         className="cursor-pointer hover:text-green-400 transition-colors flex-1 pr-2"
                         onClick={() => handleAnalyzeContest(item.contest.titleSlug)}
                       >
                         <span className="font-bold text-sm text-gray-200 block truncate">{item.contest.title}</span>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <span className="text-xs bg-black/30 px-2 py-1 rounded text-gray-400 font-mono">
                            #{item.ranking}
                         </span>
                         <a 
                           href={replayUrl} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-xs bg-blue-600 hover:bg-blue-500 text-white h-6 w-6 flex items-center justify-center rounded transition-colors"
                           title="Watch Replay"
                           onClick={(e) => e.stopPropagation()} 
                         >
                           📺
                         </a>
                       </div>
                     </div>

                     {/* Expanded Analysis */}
                     {isExpanded && (
                       <div className="bg-black/50 p-3 border-t border-gray-700 animate-fade-in">
                          {analyzing ? (
                             <div className="text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-2">
                               <span className="animate-spin">⏳</span> Analyzing Keystrokes...
                             </div>
                          ) : (
                             Object.keys(analysisResults).length > 0 ? (
                               Object.entries(analysisResults).map(([qTitle, report]) => (
                                 <div key={qTitle} className="mb-3 last:mb-0">
                                     <div className="flex justify-between items-center text-xs font-bold">
                                         <span className="text-gray-300 w-2/3 truncate" title={qTitle}>{qTitle}</span>
                                         <span className={`${report.color} bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700`}>
                                           {report.status}
                                         </span>
                                     </div>
                                     
                                     {/* Report Details */}
                                     {report.details.length > 0 && (
                                       <div className="mt-1 pl-2 border-l-2 border-gray-700 ml-1">
                                          {report.details.map((d, i) => (
                                            <div key={i} className="text-[10px] text-gray-400 leading-relaxed">• {d}</div>
                                          ))}
                                       </div>
                                     )}
                                 </div>
                               ))
                             ) : (
                               <div className="text-center text-xs text-gray-500">No submission data found.</div>
                             )
                          )}
                       </div>
                     )}
                   </div>
                 );
             })}
             
             {/* {history.length === 0 && !loading && (
               <div className="text-center text-gray-600 text-xs py-4 italic">
                 Click Scan to load history
               </div>
             )} */}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-2 text-center border-t border-gray-700">
          <p className="text-[10px] text-gray-500">v1.0</p>
        </div>

      </div>
    </div>
  );
}

export default App;