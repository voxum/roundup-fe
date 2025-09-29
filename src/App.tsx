import './App.css'
import Score from './pages/scores'
import ResultsPage from './pages/results'
import CheckInPage from './pages/check-in';
import SetupPage from './pages/setup';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from './components/navigation';
import HomePage from './pages/home';

function App() {
  return (
      <Router>
      <div className="grid grid-flow-row auto-rows-max">
        <Routes>
          <Route path="/score-entry" element={<Score />} />
          <Route path="/" 
            element={
              <>
                <Navigation />
                <HomePage />
              </>
            } />
          <Route path="/setup"
          element={
              <>
                <Navigation />
                <SetupPage />
              </>
            } />
          <Route path="/results" 
            element={
              <>
                <Navigation />
                <ResultsPage />
              </>
            } />
          <Route path="/check-in" 
            element={
              <>
                <Navigation />
                <CheckInPage />
              </>
            } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
