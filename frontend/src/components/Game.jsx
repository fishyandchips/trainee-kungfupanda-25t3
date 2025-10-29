import { useState, useEffect, useRef } from 'react';

const Game = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [hitObjects, setHitObjects] = useState([]); // this and below should be parsed into a file later on
  const [songInfo, setSongInfo] = useState([]);
  const [userData, setUserData] = useState({}); // query from local storage first otherwise set defults
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const musicTime = useRef(0);
  const animationRef = useRef();
  const mapPath = './beatmapsRaw/200552/'; // turn reading files into its own component later

  useEffect(() => {
    const theMap = mapPath + 'BlackYooh vs. siromaru - BLACK or WHITE (DE-CADE) [ADVANCED Lv.12].osu';
    const loadHitObjects = async () => {
      const file = await fetch(theMap);
      const fileString = await file.text();
      setHitObjects(getHitObjects(fileString));
      setSongInfo(getSongInfo(fileString));
    };

    loadHitObjects();

    setUserData({
      Keybinds: {'4': ['d', 'f', 'j', 'k']},
      ManiaWidth: {'4': '120'},
      ManiaHeight: {'4': '30'}
    });

    const animate = () => {
      setCurrentTime(musicTime.current ? musicTime.current.currentTime * 1000 : 0);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      setPressedKeys(prev => new Set(prev).add(event.key));
    };

    const handleKeyUp = (event) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(event.key);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getHitObjects = (fileString) => {
    const lines = fileString.split('\n');
    const hitObjects = [];
    let inSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '[HitObjects]') {
        inSection = true;
        continue;
      }

      if (inSection) {
        if (trimmed.startsWith('[')) break;

        if (trimmed && !trimmed.startsWith('//')) {
          const parts = trimmed.split(',');
          if (parts.length >= 4) {
            hitObjects.push({
              x: parseInt(parts[0]),
              y: parseInt(parts[1]),
              time: parseInt(parts[2]),
              type: parseInt(parts[3]),
              hitSound: parseInt(parts[4])
            });
          }
        }
      }
    }

    return hitObjects;
  };

  const getSongInfo = (fileString) => {
    const lines = fileString.split('\n');
    const songInfo = {};

    const wantedKeys = {
      general: ['AudioFilename', 'AudioLeadIn', 'PreviewTime', 'Mode'],
      metadata: ['TitleUnicode', 'ArtistUnicode', 'Creator', 'Version', 'BeatmapID'],
      difficulty: ['CircleSize', 'ApproachRate']
    };
    
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        continue;
      }

      if (!trimmed || trimmed.startsWith('//')) {
        continue;
      }

      if (currentSection === 'General') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.general.includes(key)) {
            songInfo[key] = value;
          }
        }
      }

      else if (currentSection === 'Metadata') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.metadata.includes(key)) {
            songInfo[key] = value;
          }
        }
      }

      else if (currentSection === 'Difficulty') {
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          
          if (wantedKeys.difficulty.includes(key)) {
            songInfo[key] = value;
          }
        }
      }

      else if (currentSection === 'Events') {
        if (trimmed.startsWith('0,0,')) {
          const parts = trimmed.split(',');
          let filename = parts[2].trim();

          if (filename.startsWith('"') && filename.endsWith('"')) {
            filename = filename.slice(1, -1);
          }

          songInfo['BackgroundFilename'] = filename;
          songInfo['BackgroundXOffset'] = parseInt(parts[3]);
          songInfo['BackgroundYOffset'] = parseInt(parts[4]);
        }
      }
    }

    return songInfo;
  };

  const timeUpdate = () => {
    if (musicTime.current) {
      setCurrentTime(musicTime.current.currentTime * 1000);
    }
  };

  const getColumn = (xValue) => {
    return Math.floor(xValue * songInfo['CircleSize'] / 512) // clamped between 0 and columnCount - 1
  }


  const HitObjectRenderer = ({ hitObjects, currentTime }) => {
    const visibleHitObjects = hitObjects.filter(obj => {
      const timeUntilHit = obj.time - currentTime;
      return timeUntilHit > -100 && timeUntilHit < 600;
    });

    return (
      <div style={{ 
        position: 'relative', 
        width: `${4 * 120}px`
      }}>
        {visibleHitObjects.map((obj, index) => {
          const timeUntilHit = obj.time - currentTime;
          const column = getColumn(obj.x);
          const approachTime = 500;
          const progress = 1 - (timeUntilHit / approachTime);
          const yPosition = Math.max(0, Math.min(1, progress)) * 800;
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${column * userData['ManiaWidth'][songInfo['CircleSize']]}px`,
                top: `${yPosition}px`,
                width: `${userData['ManiaWidth'][songInfo['CircleSize']] - 2}px`,
                height: `${userData['ManiaHeight'][songInfo['CircleSize']] - 2}px`,
                backgroundColor: '#FFFFFF',
                border: '1px solid white',
                borderRadius: '3px',
                opacity: timeUntilHit < 0 ? 0.5 : 1,
                transition: timeUntilHit < 0 ? 'none' : 'all 16ms linear',
              }}
            />
          );
        })}
        
        <div style={{
          position: 'absolute',
          left: '0',
          bottom: '115px', // adjust to the hit
          width: '100%',
          height: '2px',
          backgroundColor: '#FFFFFF',
        }} />
      </div>
    );
  };

  return (
    <>
      <audio
        ref={musicTime}
        src={mapPath + songInfo['AudioFilename']}
        onTimeUpdate={timeUpdate}
        autoPlay
        controls
      />

      <h1>hi</h1>

      <div>
        Current Time: {currentTime}ms
      </div>

      <div>
        <p>Currently pressed keys: {Array.from(pressedKeys).join(', ') || 'None'}</p>
        <p>Number of keys pressed: {pressedKeys.size}</p>
      </div>

      <div className='w-full h-full absolute overflow-hidden flex justify-center top-0 left-0 pointer-events-none'>
        <HitObjectRenderer
          hitObjects={hitObjects}
          currentTime={currentTime}
        />
      </div>



    </>
  )
}

export default Game
