"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button"
import LogoutButton from '@/components/logout-button';
import axios from 'axios';

const HomePage: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInRoom, setIsInRoom] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [triggerCheck, setTriggerCheck] = useState(0);
    const router = useRouter();

    const authToken = Cookies.get('authToken');

    useEffect(() => {
        const token = Cookies.get('authToken');
        const savedUsername = Cookies.get('username');
        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || null);
        } else {
            setIsLoggedIn(false);
            setUsername(null);
        }

    }, [triggerCheck]);

    useEffect(() => {
        const checkRoom = async () => {
            try {
                const username = Cookies.get('username');
                const response = await axios.post("http://127.0.0.1:8000/api/check-user-in-room", { username });

                if (response.data.in_room) {
                    router.push(`/room/${response.data.room_code}`);
                }
            } catch (error) {
                console.error('Error checking room: ', error);
            }
        };

        checkRoom();
    }, []);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground">
            <h1 className="text-4xl mb-8">DenDen</h1>
            {!isLoggedIn ? (
                <div className="flex space-x-4">
                    <Link href="/login">
                            <Button>Log In</Button>
                    </Link>
                    <Link href="/register">
                            <Button variant="secondary">Sign Up</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex space-x-4"> 
                    <p className="text-xl">Welcome back, {username}!</p>
                    <Link href="/join">
                        <Button>Join a Room</Button>
                    </Link>
                    <Link href="/create">
                        <Button variant="secondary">Create a Room</Button>
                    </Link>
                    <Link href="/">
                        <LogoutButton onLogout={() => setTriggerCheck(prev => prev + 1)} />
                    </Link>
                </div>
                

            )}
        </div>
    );
}

export default HomePage;
