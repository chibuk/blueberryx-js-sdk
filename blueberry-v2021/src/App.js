import logo from './logo.svg';
import './App.css';

import MainPage from './components/MainPage.js';

import {
  BrowserRouter,
  Switch,
  Route,
  Link
} from "react-router-dom";

function App() {
  return (
    <div id="app-container">
        <BrowserRouter>
            <Switch>
                <Route path="/">
                    <MainPage/>
                </Route>
            </Switch>
        </BrowserRouter>
    </div>
  );
}

export default App;
