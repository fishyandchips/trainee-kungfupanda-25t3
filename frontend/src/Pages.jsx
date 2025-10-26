import { Routes, Route } from 'react-router-dom';

import './App.css';
import StartMenu from './components/StartMenu';

const Pages = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<StartMenu />} />
      </Routes>
    </>
  )
}

export default Pages
