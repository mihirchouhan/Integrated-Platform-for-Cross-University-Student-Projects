import React from 'react';
import TeamRegistration from './components/TeamRegistration';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Admin from './components/Admin';
import "./App.css"
import CollegeRegistration from './components/CollegeRegistration';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<Admin/>} />
            <Route path='/CollegeR' element={<CollegeRegistration/>} />
           

        </Routes> 
      </BrowserRouter>


      {/* <TeamRegistration /> */}
    </div>
  );
}

export default App;

