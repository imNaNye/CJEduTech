import LoginContainer from "./LoginContainer";
import LoginLogo from "./LoginLogo";
import './login.css';

export default function LoginMain(){
    return(
        <div className="login-main">
            <LoginLogo/>
            <LoginContainer/>
        </div>
    )
}