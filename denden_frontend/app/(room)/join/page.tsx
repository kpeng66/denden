"use client"

import axios from 'axios';
import { useState, ChangeEvent, FormEvent } from 'react';
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

const JoinRoom: React.FC = () => {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const authToken = Cookies.get('authToken');

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRoomCode(e.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
          const response = await axios.post('http://127.0.0.1:8000/api/join-room', 
          { room_code: roomCode }, 
          { 
              headers: {
                  'Authorization': `Bearer ${authToken}`
              }
          }
      );
            if (response.data) {
                console.log("Joined room successfully");
                toast.success("Joined room successfully")
                // redirect to home page
                router.push(`/room/${roomCode}`);
            }
        } catch (error) {
            console.log("Error joining room:", error);
            toast.success("Error joining room")
        }
    };

    return (
        <div>
        <h2>Room Code</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="room_code"
            placeholder="XXXXX"
            onChange={handleInputChange}
          />
          <button type="submit">Join</button>
        </form>
      </div>
    )
}

export default JoinRoom;
