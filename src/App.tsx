import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div>
      <Navbar />

      <div className="app-layout">
        <Sidebar />

        <main>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default App;