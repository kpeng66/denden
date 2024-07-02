"use client"

import { Button } from "@/components/ui/button";
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';


const CreateRoom: React.FC = () => {
    const router = useRouter();

    const getCurrentUser = async () => {
        const authToken = Cookies.get('authToken');
        const response = await fetch('http://127.0.0.1:8000/api/get-current-user', { 
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });
        if (response.ok) {
            console.log("Fetching current user success!")
            return await response.json();
        } else {
            console.error("Error fetching current user:", await response.text());
            return null;
        }
    }

    const handleCreateRoom = async () => {
        const user = await getCurrentUser();
        console.log(user);

        if (!user) {
            console.error("Could not get current user")
        }

        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/create-room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    host: user 
                })
            });

            if (response.ok) {
                const roomData = await response.json();
                const roomCode = roomData.code;
                if (roomCode) {
                    console.log('Room created successfully with code:', roomCode);
                    router.push(`/room/${roomCode}`); 
                } else {
                    console.error('Room code not found in response:', roomData);
                }

            } else {
                console.error('Error creating room:', await response.text());
            }
        } catch (error) {
            console.error("Error creating room:", error);
        }
        
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground">
            <h1 className="text-4xl mb-8">Create Room</h1>
            <Button onClick={handleCreateRoom}>Create New Room</Button>
            {/* Here you can also display the list of rooms if needed */}
        </div>
    );
}

export default CreateRoom;
