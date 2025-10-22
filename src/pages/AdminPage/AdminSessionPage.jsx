import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/session/adminSession.css'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";

export default function AdminSessionPage(){
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const {isAdmin, setIsAdmin} = useUser();

    useEffect(() => {
        setIsAdmin(true);
        localStorage.setItem('isAdmin',"true");
        let start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const percent = Math.min((elapsed / 5000) * 100, 100);
            setProgress(percent);
        }, 100);

        const timeout = setTimeout(() => {
            navigate('/admin/onboarding');
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="admin-session-page">
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}