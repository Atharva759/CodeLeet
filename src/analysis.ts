
export interface CheatReport {
  status: 'SAFE' | 'SUS' | 'CHEAT' | 'SKIPPED';
  color: string;
  details: string[];
  pasteCount: number;
  focusLoss: number;
}


//et:5 = submission   status:10 = accepted
//et:10 = paste
//et:3 = tab switch


export function analyzeEvents(events: any[]): CheatReport {
  if (!events || events.length === 0) {
    return { status: 'SKIPPED', color: 'text-gray-500', details: ['No data'], pasteCount: 0, focusLoss: 0 };
  }


  let isAccepted = false;
  let attemptStatus = null;

  for (const e of events) {
    const type = parseInt(e.eventType, 10);
    if (type === 5) {
        try {
            const data = JSON.parse(e.eventData);
            if (data.result && data.result.status === 10) {
                isAccepted = true;
                break; 
            } else if (data.result) {
                attemptStatus = data.result.status;
            }
        } catch (err) {}
    }
  }

  if (!isAccepted) {
      const msg = attemptStatus 
        ? ` Not Accepted (Status ${attemptStatus})` 
        : ` No Submission`;
      return { status: 'SKIPPED', color: 'text-gray-500', details: [msg], pasteCount: 0, focusLoss: 0 };
  }

  
  let pasteCount = 0;
  let focusLoss = 0;
  const CHEAT_THRESHOLD = 500;
  const SUS_THRESHOLD = 100;

  const detectedPastes: string[] = [];

  events.forEach((e) => {
    const type = parseInt(e.eventType, 10);

    
    if (type === 3) {
      if (e.eventData.includes('"val": false') || e.eventData.includes('"val":false')) {
        focusLoss++;
      }
    }

    
    if (type === 10 && e.eventData) {  
      try {
        const data = JSON.parse(e.eventData);
        
        
        const isInternal = data.isFromInside === true; 

        if (data.change && data.change.changes) {
          data.change.changes.forEach((change: any) => {
            const insertedLen = (change.insert || "").length;

            if (insertedLen > 0) {
              
              
              if (isInternal) {
                 return; 
              }

              
              if (insertedLen > SUS_THRESHOLD) {
                
                if (type === 10) { 
                   
                   pasteCount++;
                   if (insertedLen > CHEAT_THRESHOLD) {
                     detectedPastes.push(`! External Paste: ${insertedLen} chars`);
                   } else {
                     detectedPastes.push(`External Paste: ${insertedLen} chars`);
                   }
                } 

                //removed the logic for bulk insert as it was detecting false cheat

                // else if (type === 7 && insertedLen > 800) { 
                //    // Event 7 + Massive Bulk = The "IDE Copy-Paste"
                //    // (Event 7 usually doesn't have isFromInside, so we rely on size)
                //    pasteCount++;
                //    detectedPastes.push(`Bulk Insert: ${insertedLen} chars`);
                // }
              }
            }
          });
        }
      } catch (err) {}
    }
  });

  
  let status: 'SAFE' | 'SUS' | 'CHEAT' = 'SAFE';
  let color = 'text-green-400';
  const details: string[] = [];

  const hasMassivePaste = detectedPastes.some(d => d.includes('!') || d.includes('Bulk Insert'));
  
  if (hasMassivePaste) {
    status = 'CHEAT';
    color = 'text-red-500';
    details.push(...detectedPastes);
  } 
  else if (pasteCount > 0) {
    status = 'SUS';
    color = 'text-yellow-400';
    details.push(...detectedPastes);
  }

  if (focusLoss > 10) {
     details.push(`Switched tabs ${focusLoss} times`);
  }

  if (status === 'SAFE') {
    details.push(` Natural typing`);
  }

  return { status, color, details, pasteCount, focusLoss };
}