import "../../App.css";
interface LoginPageProps {
  onLogin: () => void;
}

export default function Loginpage({ onLogin }: LoginPageProps) {
  return (
    <div className="mainMenu">
      <h2>Welcome</h2>
      <button onClick={onLogin}>Login To Meet Capture</button>
    </div>
  );
}
