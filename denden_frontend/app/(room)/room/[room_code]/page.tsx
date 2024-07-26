"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";
import Cookies from "js-cookie";
import axios from "axios";

import dynamic from "next/dynamic";

const SwipeableViews = dynamic(() => import("react-swipeable-views"), {
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
  const authToken = Cookies.get("authToken");

  const [index, setIndex] = useState(0);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hostId, setHostId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserIsHost, setCurrentUserIsHost] = useState<boolean>(false);

  const gamesList = [
    { name: "Math Add Game", id: 0, color: "#FFD700" },
    { name: "Game #2", id: 1, color: "FF6347" },
    { name: "Game #3", id: 2, color: "4682B4" },
  ];

  /* Swipeable View Logic */
  const selectGame = (gameId: number) => {
    setSelectedGameId(gameId);
  };

  const backToGameList = () => {
    setSelectedGameId(null);
  };

  const handleIndexChange = (index: number, indexLatest: number) => {
    if (selectedGameId !== null) {
      return;
    }

    setIndex(index);
  };

  /* Websocket Logic */
  useEffect(() => {
    const wsConnection = new WebSocket(
      `ws://192.168.1.67:8000/ws/room/${room_code}`
    );
    wsConnection.onopen = () =>
      console.log("Room WebSocket connection successfully opened.");
    wsConnection.onclose = () =>
      console.log("Room Websocket connection closed.");
    wsConnection.onerror = (error) => {
      console.error("Room WebSocket Error", error);
    };
    wsConnection.onmessage = (event) => {
      handleWebsocketMessages(event);
    };
    return () => {
      wsConnection.close();
    };
  }, [room_code]);

  const handleWebsocketMessages = (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case "game.redirect":
        router.push(message.url);
        break;
      case "user_update":
        setUsers(message.users);
        break;
      case "room_closed":
        alert(message.message);
        router.push("/");
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [room_code]);

  const fetchRoomDetails = async () => {
    fetchUsersInRoom();
    fetchHostDetails();
    fetchCurrentUser();
  };

  useEffect(() => {
    if (room_code) {
      setCurrentUserIsHost(currentUserId === hostId);
    }
  }, [hostId]);

  const startGame = async () => {
    if (ws) {
      console.log("Host clicked start game");
      ws.send(
        JSON.stringify({
          type: "trigger.game.start",
        })
      );
    }
  };

  const fetchUsersInRoom = async () => {
    try {
      const response = await fetch(
        `http://192.168.1.67:8000/api/list-users-in-room/${room_code}`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log(`Users in room...${users}`);
      } else {
        console.error("Error fetching users in room:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching users in room:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(
        `http://192.168.1.67:8000/api/get-current-user`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.id);
      } else {
        console.error(
          "Error fetching current user Id: ",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching current user id: ", error);
    }
  };

  const fetchHostDetails = async () => {
    try {
      const response = await fetch(
        `http://192.168.1.67:8000/api/host-details/${room_code}`
      );
      if (response.ok) {
        const data = await response.json();
        setHostId(data.host_id);
      } else {
        console.error("Error fetching host details: ", await response.text());
      }
    } catch (error) {
      console.error("Error fetching room details: ", error);
    }
  };

  const leaveRoom = async () => {
    try {
      const response = await axios.post(
        "http://192.168.1.67:8000/api/leave-room",
        { room_code: room_code },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response) {
        router.push("/");
      } else {
        console.error("Error leaving room: response");
      }
    } catch (error) {
      console.error("Error leaving room: try");
    }
  };

  return (
    <div className="p-4">
      {selectedGameId === null ? (
        <SwipeableViews
          index={index}
          onChangeIndex={setIndex}
          enableMouseEvents
        >
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <h1 className="text-2xl font-bold mb-4">
                Room Code: {room_code}
              </h1>
              <h2 className="text-xl font-semibold">Players:</h2>
              <ul className="mt-2">
                {users.map((user, index) => (
                  <li key={index} className="p-2 my-1 bg-gray-100 rounded-md">
                    {user.username}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/")}
                className="mt-4 btn btn-primary"
              >
                Leave Room
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              {gamesList.map((game) => (
                <button
                  key={game.id}
                  style={{ backgroundColor: game.color }}
                  className="mt-4 w-full py-2 rounded-md text-white font-medium"
                  onClick={() => selectGame(game.id)}
                >
                  {game.name}
                </button>
              ))}
            </div>
          </div>
        </SwipeableViews>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          {currentUserIsHost && (
            <button className="btn btn-success" onClick={startGame}>
              Start Game
            </button>
          )}
          <button
            className="btn btn-danger mt-4"
            onClick={() => setSelectedGameId(null)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomLobby;
