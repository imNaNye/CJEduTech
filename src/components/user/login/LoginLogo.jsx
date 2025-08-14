import logoRobot from '../../../assets/images/common/logoRobot.png';
import logo from '../../../assets/images/common/logo.png';
import './login.css';

export default function LoginLogo() {
  return (
    <div className="login-logo" style={{ display: 'flex', flexDirection: 'column' }}>
      <img
        src={logoRobot}
        alt="logoRobot"
        style={{
          height: '426px',
          alignSelf: 'stretch',
          aspectRatio: '1 / 1'
        }}
      />
      <img
        src={logo}
        alt="logo"
        style={{ width: '392px',
            height: '134px',
            aspectRatio: '196 / 67'  }}
      />
    </div>
  );
}