"use client";

import React, { useEffect, useState } from "react";
import { ScoreboardProps } from "@/types/types";
import styles from "../styles/scoreboard.module.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";

const Scoreboard: React.FC<ScoreboardProps> = ({ room }) => {
  const router = useRouter();
  const [players, setPlayers] = useState([]);

  const authToken = Cookies.get("authToken");

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await axios.get(
          `http://192.168.1.67:8000/api/room-scores/${room}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        setPlayers(response.data);
        console.log("API Response", response.data);
        console.log("Players list", players);
      } catch (error) {
        console.error("Failed to fetch scores", error);
      }
    };

    fetchScores();
  }, []);

  const updatePlayerScore = async (score: number) => {
    try {
      const response = await axios.post(
        `http://192.168.1.67:8000/api/update-player-score`,
        { score },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data) {
        console.log("Score updated:", response.data);
      }
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  const handleConfirmButton = async () => {
    await updatePlayerScore(0);
    router.push("/");
  };

  return (
    <div className={styles.scoreboardContainer}>
      <div className={styles.title}>Scoreboard</div>
      <div className={styles.scoreList}>
        {players
          .slice()
          .sort((a, b) => b["score"] - a["score"])
          .map((player, index) => (
            <div key={index} className={styles.playerScore}>
              <div className={styles.playerName}>{player["user_name"]}</div>
              <div className={styles.playerScoreValue}>{player["score"]}</div>
            </div>
          ))}
      </div>
      <button onClick={handleConfirmButton}>Confirm</button>
    </div>
  );
};

export default Scoreboard;
