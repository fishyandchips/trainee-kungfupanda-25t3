import { useState, useEffect, useRef } from 'react';

const Game = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [hitObjects, setHitObjects] = useState([]); // this and below should be parsed into a file later on
  const [songInfo, setSongInfo] = useState([]);
  const [userData, setUserData] = useState({}); // query from local storage first otherwise set defults
  const musicTime = useRef(0);
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
      Keybinds: {'4k': ['D', 'F', 'J', 'K']},
      ManiaWidth: {'4k': '120'},
      ManiaHeight: {'4k': '30'}
    });
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
      return timeUntilHit > -100 && timeUntilHit < 1500;
    });

    return (
      <div style={{ 
        position: 'relative', 
        width: `${4 * 120}px`
      }}>
        {visibleHitObjects.map((obj, index) => {
          const timeUntilHit = obj.time - currentTime;
          const column = getColumn(obj.x);
          const yPosition = Math.max(0, 1080 - (timeUntilHit / 400) * 300);
          
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${column * userData['ManiaWidth'][songInfo['CircleSize'] + 'k']}px`,
                top: `${yPosition}px`,
                width: `${userData['ManiaWidth'][songInfo['CircleSize'] + 'k'] - 2}px`,
                height: `${userData['ManiaHeight'][songInfo['CircleSize'] + 'k'] - 2}px`,
                backgroundColor: '#FFFFFF',
                border: '1px solid white',
                borderRadius: '3px',
                opacity: timeUntilHit < 0 ? 0.5 : 1,
                transition: 'opacity 0.1s',
              }}
            />
          );
        })}
        
        <div style={{
          position: 'absolute',
          left: '0',
          bottom: '10px', // adjust to the hit
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
