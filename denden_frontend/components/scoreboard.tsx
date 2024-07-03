"use client"

import React, { useEffect, useState } from 'react';
import { ScoreboardProps } from '@/types/types';
import styles from '../styles/scoreboard.module.css';
import { useRouter } from 'next/navigation'
import axios from 'axios';
import Cookies from 'js-cookie';

const Scoreboard: React.FC<ScoreboardProps> = ({ room }) => {
    const router = useRouter();
    const [players, setPlayers] = useState([]);

    const authToken = Cookies.get('authToken');


    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/room-scores/${room}`, {
                    headers: { 'Authorization': `Bearer ${authToken}`}
                }
                )
                setPlayers(response.data);
                console.log('API Response', response.data);
                console.log('Players list', players);
            } catch (error) {
                console.error('Failed to fetch scores', error);
            }
        };

        fetchScores();
    }, [room]);

    const handleConfirmButton = () => {

       router.push('/');
    }

    return (
        <div className={styles.scoreboardContainer}>
            <div className={styles.title}>Scoreboard</div>
            <div className={styles.scoreList}>
            {players.map((player, index) => (
                    <div key={index} className={styles.playerScore}>
                        <div className={styles.playerName}>{player['user_name']}</div>
                        <div className={styles.playerScoreValue}>{player['score']}</div>
                    </div>
                ))}
            </div>
            <button onClick={handleConfirmButton}>
                Confirm
            </button>
        </div>
    )
    };

export default Scoreboard;