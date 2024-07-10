"use client"

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
import React from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

import dynamic from 'next/dynamic';

const SwipeableViews = dynamic(() => import('react-swipeable-views'), {
  ssr: false,
});

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }

const RoomLobby: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const room_code = params.room_code;

    const authToken = Cookies.get('authToken');

    const [index, setIndex] = useState(0);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [hostId, setHostId] = useState<number| null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentUserIsHost, setCurrentUserIsHost] = useState<boolean>(false);
    const [selectedGameId, setSelectedGameId] = useState<number | null>(null); // state to manage selected game ID

    const gamesList = [
        { name: "Math Add Game", id: 0, color: "#FFD700" },
        { name: "Game #2", id: 1, color: "FF6347"},
        { name: "Game #3", id: 2, color: "4682B4"}
    ];

    const selectGame = (gameId: number) => {
        setSelectedGameId(gameId)
    }

    const backToGameList = () => {
        setSelectedGameId(null);
    }

    const handleIndexChange = (index: number, indexLatest: number) => {
        if (selectedGameId !== null) {
            return;
        }

        setIndex(index)
    }
    
    const startGame = async () => {
        if (currentUserIsHost) {
            try {
                const response = await axios.post('http://192.168.1.67:8000/api/start-math-game', {room_code: room_code}, { 
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
            });
                if (response.data && response.data.game_id) {
                    console.log('Game started with ID: ', response.data.game_id);
                    if (ws) {
                        ws.send(JSON.stringify({'type': 'game.redirect', 'game_id': response.data.game_id, 'room_code': room_code}));
                    }
                }
            } catch (error) {
                console.error('Error starting the game:', error);
            }
        }
    };

    useEffect(() => {
        if (room_code) {
            fetchUsersInRoom();
        }

        const wsConnection = new WebSocket(`ws://192.168.1.67:8000/ws/room/${room_code}`);
        setWs(wsConnection);

        wsConnection.onerror = (error) => {
            console.error("WebSocket Error", error);
        };

        wsConnection.onmessage = (event) => {
            console.log("ws message sent")
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'game.redirect':
                    router.push(`/game/mathgame/${room_code}`);  // Navigate to minigame page
                    break;
                case 'user_update':
                    setUsers(message.users);
                    break;
                case 'room_closed': 
                    alert(message.message);
                    router.push('/');
            }
        };

        return () => {
            console.log("ws closed")
            wsConnection.close();
        }
    }, [room_code]);

    useEffect(() => {
        if (room_code) {
            fetchHostDetails();
            fetchCurrentUser();
            setCurrentUserIsHost(currentUserId === hostId);
        }
    }, [currentUserIsHost, hostId, currentUserId])

    const fetchUsersInRoom = async () => {
        try {
            const response = await fetch(`http://192.168.1.67:8000/api/list-users-in-room/${room_code}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error('Error fetching users in room:', await response.text());
            }
        } catch (error) {
            console.error('Error fetching users in room:', error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch(`http://192.168.1.67:8000/api/get-current-user`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUserId(data.id);
            } else {
                console.error('Error fetching current user Id: ', await response.text());
            }
        } catch (error) {
            console.error('Error fetching current user id: ', error)
        }
    }

    const fetchHostDetails = async () => {
        try {
            const response = await fetch(`http://192.168.1.67:8000/api/host-details/${room_code}`);
            if (response.ok) {
                const data = await response.json();
                setHostId(data.host_id);
            } else {
                console.error('Error fetching host details: ', await response.text());
            }
        } catch (error) {
            console.error("Error fetching room details: ", error);
        }
    };

    const leaveRoom = async () => {
        try {
            const response = await axios.post('http://192.168.1.67:8000/api/leave-room', {room_code: room_code}, { 
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
            });
            if (response) {
                router.push('/');
            } else {
                console.error('Error leaving room: response');
            }
        } catch (error) {
            console.error('Error leaving room: try');
        }
    };
    
    const styles = {
        slideContainer: {
          padding: 15,
          minHeight: '100vh', // Make each slide full height
          color: '#fff',
        },
        gameListContainer: {
          backgroundColor: '#f7f7f7', // Light grey background
          borderRadius: '25px', // Rounded corners
          margin: '0 15px', // Some margin on the sides
        },
        gameButton: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          marginBottom: '10px',
          backgroundColor: '#fff',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Slight shadow
          color: 'black',
          textDecoration: 'none',
        },
        // ... Add more styles for your elements
      };

    return (
        <div>
            {selectedGameId === null ? (
                <SwipeableViews 
                index={index} 
                onChangeIndex={handleIndexChange} 
                enableMouseEvents>
            {/* First view: Room Details */}
            <div className="min-h-screen flex items-center justify-center bg-gray-200">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full">
                        <h1 className="text-4xl mb-2 text-center text-blue-600 font-bold">Room Code: {room_code}</h1>
                        <div className="border-t border-gray-300 mt-4 py-4">
                            <h2 className="text-2xl mb-4 text-gray-700 font-semibold">Players:</h2>
                            <ul>
                                {users.map((user, index) => (
                                    <li key={index} className="mb-2 px-4 py-2 bg-gray-100 rounded-md shadow-sm text-gray-800">{user.username}</li> 
                                ))}
                            </ul>
                        </div>

                        <button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition ease-in-out duration-200 transform hover:scale-105"
                            onClick={leaveRoom}>Leave Room</button>
                    </div>
                </div>
                                    
            {/* Second view: Game List */}
            <div className="min-h-screen flex items-center justify-center bg-gray-200">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xl w-full">
                    {gamesList.map((game, index) => (
                        <button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition ease-in-out duration-200 transform hover:scale-105" key={index} onClick={() => selectGame(game.id)}>
                            {game.name}
                        </button>
                    ))}
                </div>
            </div>
            </SwipeableViews>
            ) : (
                <div className="min-h-screen flex items-center justify-center bg-gray-200">
                    {currentUserIsHost && (<button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition ease-in-out duration-200 transform hover:scale-105" onClick={startGame}>
                        Start Game
                    </button>)}

                    <button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition ease-in-out duration-200 transform hover:scale-105" onClick={backToGameList}>
                        Back
                    </button>
                 </div>
            )}
        </div>
    );  
};

export default RoomLobby;