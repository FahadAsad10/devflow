import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div className="app">
      <Navbar />

      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default App;