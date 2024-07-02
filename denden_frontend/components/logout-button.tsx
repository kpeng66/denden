"use client"

import React from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
    onLogout?: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
    const router = useRouter();

    const handleLogout = () => {
        Cookies.remove('authToken');  // Remove the JWT token
        Cookies.remove('username');
        router.push(`/`);  // Redirect to homepage or login page

        onLogout && onLogout();
    };

    return <Button variant="outline" onClick={handleLogout}>Logout</Button>;
}

export default LogoutButton;