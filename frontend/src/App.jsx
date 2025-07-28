import { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  return (
    <div className="App">
      {!loggedIn ? <Login onLogin={handleLogin} /> : <Chat />}
    </div>
  );
}

export default App;
