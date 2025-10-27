import { useState, useEffect, useRef } from 'react';

const Game = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [hitObjects, setHitObjects] = useState([]);
  const musicTime = useRef(0);
  const mapPath = './beatmapsRaw/200552/'; // turn reading files into a component later

  useEffect(() => {
    const theMap = mapPath + 'BlackYooh vs. siromaru - BLACK or WHITE (DE-CADE) [ADVANCED Lv.12].osu';
    const loadHitObjects = async () => {
      const file = await fetch(theMap);
      const fileString = await file.text();
      setHitObjects(getHitObjects(fileString));
    };

    loadHitObjects();
  }, []);

  const getHitObjects = (content) => {
    const lines = content.split('\n');
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

  const timeUpdate = () => {
    if (musicTime.current) {
      setCurrentTime(musicTime.current.currentTime * 1000);
    }
  };

  return (
    <>
      <audio
        ref={musicTime}
        src={mapPath + 'BlackYooh vs. siromaru - BLACK or WHITE.mp3'}
        onTimeUpdate={timeUpdate}
        autoPlay
        controls
      />

      <h1>hi</h1>

      <div>
        Current Time: {currentTime}ms
      </div>



    </>
  )
}

export default Game
