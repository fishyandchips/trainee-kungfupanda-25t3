import { useState, useEffect, useRef } from 'react';

const Game = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [hitObjects, setHitObjects] = useState([]); // this and songinfo should be parsed into a file later on
  const [songInfo, setSongInfo] = useState([]);
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
    return Math.floor(x * songInfo['CircleSize'] / 512) // clamped between 0 and columnCount - 1
  }

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

      <div className='absolute w-0.5 h-full'>

      </div>



    </>
  )
}

export default Game
