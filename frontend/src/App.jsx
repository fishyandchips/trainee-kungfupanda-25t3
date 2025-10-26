import {
  BrowserRouter as Router,
} from 'react-router-dom';

import Pages from './Pages';

function App() {
  return (
    <>
      <Router>
        <div className='h-4 w-full absolute bottom-0 -translate-y-4 flex gap-4 p-4 text-[#FFFFFF]'>
          <a className='cursor-pointer hover:underline'
          href="/">
            Start
          </a>
          <a className='cursor-pointer hover:underline'
          href="/select">
            Select Game
          </a>
          <a className='cursor-pointer hover:underline'
          href="/game">
            Game Screen
          </a>
        </div>
        <Pages />
      </Router>
    </>
  )
}

export default App
