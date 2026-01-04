import { useState, useEffect } from 'react';
import { AppSettings, loadSettings, saveSettings } from '../settings';
import { THEMES } from '../themes';


export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  const toggleOverlay = () => {
    const newS = { ...settings, overlayEnabled: !settings.overlayEnabled };
    setSettings(newS);
    saveSettings(newS);
  };

  const toggleSound = () => {
    const newS = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(newS);
    saveSettings(newS);
  };


  const handleThemeChange=(e:React.ChangeEvent<HTMLSelectElement>)=>{

    const news={...settings, theme:e.target.value};

    setSettings(news);
    saveSettings(news);
  }



  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="text-center pb-2 border-b border-gray-700">
        <h3 className="text-gray-300 font-bold uppercase tracking-widest text-xs">Configuration</h3>
      </div>

      {/* Toggle: Meme Overlay */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-bold text-gray-200">Celebration Mode</div>
          <div className="text-xs text-gray-500">Show GTA banner on submission</div>
        </div>
        <button 
          onClick={toggleOverlay}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings.overlayEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.overlayEnabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {/* Toggle: Sound */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-bold text-gray-200">Sound Effects</div>
          <div className="text-xs text-gray-500">Play Wasted/Mission Passed</div>
        </div>
        <button 
          onClick={toggleSound}
          className={`w-12 h-6 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>



      <div>
        <div className="text-sm font-bold text-gray-200 mb-1">Visual Theme</div>
        <select 
          value={settings.theme}
          onChange={handleThemeChange}
          className="w-full bg-gray-800 text-white border border-gray-600 rounded p-2 text-sm focus:border-green-500 outline-none transition-colors"
        >
          {Object.entries(THEMES).map(([key, theme]) => (
            <option key={key} value={key}>
              {theme.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          Sets the banner style and sound effects.
        </div>
      </div>



      {/* Info */}
      <div className="bg-gray-800 p-3 rounded text-[10px] text-gray-400 mt-4 border border-gray-700">
        Note: Settings are saved automatically to your browser.
      </div>

    </div>
  );
}