
import { useState, useEffect } from 'react';
import { getUserContestHistory, getContestQuestions } from './api';

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

 
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
      console.log("Found Contests:", contests);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data. Are you on a profile page?");
    }
    setLoading(false);
  };

  if (!username) return null; 

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700 w-80 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-green-400">🕵️ Detective</h2>
        <span className="text-xs text-gray-400">Target: {username}</span>
      </div>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors font-medium disabled:opacity-50"
      >
        {loading ? "Scanning..." : "Scan Contest History"}
      </button>

      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
        {history.map((item: any, idx: number) => (
          <div key={idx} className="bg-gray-800 p-2 rounded border border-gray-700 text-sm">
            <div className="flex justify-between text-green-300 font-bold">
              <span>{item.contest.title}</span>
              <span>Rank: {item.ranking}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;